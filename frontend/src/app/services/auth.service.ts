import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { AuthResponse, UserRole } from '../models/user.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;

  currentUser = signal<AuthResponse | null>(null);

  constructor(private http: HttpClient) {
    this.loadUserFromStorage();
  }

  private loadUserFromStorage() {
    const saved = localStorage.getItem('universe_auth');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.token) {
          this.currentUser.set(parsed);
        }
      } catch (e) {
        localStorage.removeItem('universe_auth');
      }
    }
  }

  signup(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/signup`, data).pipe(
      tap((res) => {
        if (res && res.token) {
          this.saveAuth(res);
        }
      })
    );
  }

  verifyOtp(email: string, otp: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/verify-otp`, { email, otp }).pipe(
      tap((res) => {
        if (res && res.token) {
          this.saveAuth(res);
        }
      })
    );
  }

  resendOtp(email: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/resend-otp`, { email });
  }

  login(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login`, data).pipe(
      tap((res) => {
        if (res && res.token) {
          this.saveAuth(res);
        }
      })
    );
  }

  logout() {
    localStorage.removeItem('universe_auth');
    this.currentUser.set(null);
  }

  private saveAuth(res: AuthResponse) {
    localStorage.setItem('universe_auth', JSON.stringify(res));
    this.currentUser.set(res);
  }

  getToken(): string | null {
    return this.currentUser()?.token || null;
  }

  getUserRole(): UserRole | null {
    return this.currentUser()?.role || null;
  }

  isLoggedIn(): boolean {
    return !!this.currentUser()?.token;
  }

  isStudent(): boolean {
    return this.currentUser()?.role === 'student';
  }

  isCollege(): boolean {
    return this.currentUser()?.role === 'college';
  }

  isAdmin(): boolean {
    return this.currentUser()?.role === 'admin';
  }
}
