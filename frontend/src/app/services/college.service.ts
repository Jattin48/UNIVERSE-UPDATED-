import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { College } from '../models/college.model';

@Injectable({
  providedIn: 'root',
})
export class CollegeService {
  private apiUrl = 'http://localhost:5000/api/colleges';

  constructor(private http: HttpClient) {}

  searchColleges(filters: any = {}): Observable<College[]> {
    let params = new HttpParams();
    Object.keys(filters).forEach((key) => {
      if (filters[key] !== null && filters[key] !== undefined && filters[key] !== '') {
        params = params.set(key, filters[key]);
      }
    });

    return this.http.get<College[]>(`${this.apiUrl}/search`, { params });
  }

  getCollegeById(id: string): Observable<College> {
    return this.http.get<College>(`${this.apiUrl}/${id}`);
  }

  getMyCollegeProfile(): Observable<College> {
    return this.http.get<College>(`${this.apiUrl}/me/profile`);
  }

  updateMyCollegeProfile(data: Partial<College>): Observable<College> {
    return this.http.put<College>(`${this.apiUrl}/me/profile`, data);
  }

  uploadVerificationDocs(documents: string[]): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/me/documents`, { documents });
  }

  getCollegeLeads(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/me/leads`);
  }
}
