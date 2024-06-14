import { Injectable, Optional, SkipSelf } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, Observable, of, tap } from 'rxjs';
import { User } from '../_model/user';
import { MessageService } from './message.service';
import { ConfigService } from './config.service';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  user: User = new User();
  constructor(
    private http: HttpClient,
    private messageService: MessageService,
    private configService: ConfigService,
    private router: Router,
    @Optional() @SkipSelf() sharedService?: UserService
  ) {
    if (sharedService) {
      throw new Error('UserService already loaded');
      console.log('------------ userservice already loaded!!!');
    } else console.log('------------ userservice constructed!!!');
    if (this.user.username) {
      this.user.username = this.user.username;
      this.user.isLoggedIn = true;
    } else {
      const sessionUsername = sessionStorage.getItem('username');
      const sessionUuid = sessionStorage.getItem('uuid');
      if (sessionUsername && sessionUuid) {
        this.user.username = sessionUsername;
        this.user.uuid = sessionUuid;
        this.user.isLoggedIn = true;
      }
    }
  }
  isLoggedIn(): boolean {
    return this.user.isLoggedIn;
  }
  isAdmin(): boolean {
    console.log(this.user.username + 'is admin: ' + this.user.isAdmin);
    return this.user.isAdmin == true;
  }
  login(username: string, password: string): Observable<User> {
    this.user.username = username;
    this.user.password = password;
    return this.http
      .post<User>('https://127.0.0.1:3000/users/login', this.user)
      .pipe(
        catchError(this.configService.handleError<User>('login', undefined)),
        tap((x) => {
          if (x != null) {
            this.user = x;
            this.user.isLoggedIn = true;
            localStorage.setItem('username', this.user.username);
            sessionStorage.setItem('username', this.user.username);
            sessionStorage.setItem('uuid', this.user.uuid);
            console.log('+++++ ' + JSON.stringify(this.user));
          }
        })
      );
  }
  register(
    username: string,
    password: string,
    email: string
  ): Observable<number> {
    this.user.username = username;
    this.user.password = password;
    this.user.email = email;
    console.log('service register ::: ' + JSON.stringify(this.user));
    let obs: Observable<number> = this.http
      .post<number>('https://127.0.0.1:3000/users/register/', this.user)
      .pipe(catchError(this.configService.handleError<number>('register', -1)));
    return obs;
  }
  update(): void {
    console.log('service update user ::: ' + JSON.stringify(this.user));
    this.http
      .put<User>('https://127.0.0.1:3000/users/update/', this.user)
      .pipe(catchError(this.configService.handleError<void>('update')))
      .subscribe(() => {});
  }
  logout(): void {
    this.user = new User();
    this.router.navigate(['/']).then();
    sessionStorage.removeItem('username');
    sessionStorage.removeItem('uuid');
    sessionStorage.removeItem('messages');
  }
}
