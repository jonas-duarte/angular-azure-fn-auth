import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { MsalBroadcastService, MsalService } from '@azure/msal-angular';
import { EventMessage, EventType, AuthenticationResult } from '@azure/msal-browser';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  loginDisplay = false;
  token = 'not defined'

  constructor(private authService: MsalService, private msalBroadcastService: MsalBroadcastService, private http: HttpClient) { }

  ngOnInit(): void {
    this.msalBroadcastService.msalSubject$
      .pipe(
        filter((msg: EventMessage) => msg.eventType === EventType.LOGIN_SUCCESS),
      )
      .subscribe((result: EventMessage) => {
        console.log(result);
        const payload = result.payload as AuthenticationResult;
        this.authService.instance.setActiveAccount(payload.account);
      });

    this.setLoginDisplay();
    const account = this.authService.instance.getAllAccounts()[0]
    if (account) {
      this.authService.instance.setActiveAccount(account)
      this.authService.acquireTokenSilent({
        scopes: ['api://325528b1-f81e-4b5a-ac2b-eafaa85f90a3/user_impersonation']
      }).subscribe((result) => {
        this.token = result.accessToken;
      })
    }
  }

  setLoginDisplay() {
    this.loginDisplay = this.authService.instance.getAllAccounts().length > 0;
  }

  lastRequestResult: string = "--- not requested ---";
  async request() {
    this.lastRequestResult = "--- requesting ---";
    try {
      const result = await this.http.get('https://jonas-fn.azurewebsites.net/api/example', {
        headers: {
          Authorization: `Bearer ${this.token}`,

        }
      }).toPromise()

      this.lastRequestResult = JSON.stringify(result);
    } catch (e: any) {
      console.error(e);
      this.lastRequestResult = e.message;
    }

  }

}
