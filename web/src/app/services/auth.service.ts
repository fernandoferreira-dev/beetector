import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map, tap } from 'rxjs';
import { API_BASE_URL } from './api.constants';

interface SignInResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private accessToken: string | null = null;

  constructor(private readonly http: HttpClient) {}

  login(userEmail: string, userPassword: string): Observable<void> {
    return this.http
      .post<SignInResponse>(`${API_BASE_URL}/auth/sign-in`, { userEmail, userPassword })
      .pipe(
        tap((response) => {
          this.accessToken = response.accessToken;
        }),
        map(() => undefined)
      );
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }
}