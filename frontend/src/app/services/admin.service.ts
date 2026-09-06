import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { College } from '../models/college.model';

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  private apiUrl = 'http://localhost:5000/api/admin';

  constructor(private http: HttpClient) {}

  getPendingColleges(): Observable<College[]> {
    return this.http.get<College[]>(`${this.apiUrl}/colleges/pending`);
  }

  getAllColleges(): Observable<College[]> {
    return this.http.get<College[]>(`${this.apiUrl}/colleges`);
  }

  updateCollegeStatus(collegeId: string, status: 'approved' | 'rejected' | 'pending'): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/colleges/${collegeId}/status`, { status });
  }
}
