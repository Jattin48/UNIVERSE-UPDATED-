import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { AuthResponse, UserRole } from '../models/user.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = 'http://localhost:5000/api/auth';

  currentUser = signal<AuthResponse | null>(null);

  constructor(private http: HttpClient) {
    this.loadUserFromStorage();
  }

  private loadUserFromStorage() {
    const saved = localStorage.getItem('universe_auth');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        this.currentUser.set(parsed);
      } catch (e) {
        localStorage.removeItem('universe_auth');
      }
    }
  }

  signup(data: any): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/signup`, data).pipe(
      tap((res) => {
        this.saveAuth(res);
      })
    );
  }

  login(data: any): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, data).pipe(
      tap((res) => {
        this.saveAuth(res);
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
