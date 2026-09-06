import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { StudentProfile } from '../models/student.model';
import { College } from '../models/college.model';

@Injectable({
  providedIn: 'root',
})
export class StudentService {
  private apiUrl = 'http://localhost:5000/api/students/me';

  constructor(private http: HttpClient) {}

  getProfile(): Observable<StudentProfile> {
    return this.http.get<StudentProfile>(this.apiUrl);
  }

  updateProfile(data: Partial<StudentProfile>): Observable<StudentProfile> {
    return this.http.put<StudentProfile>(this.apiUrl, data);
  }

  shortlistCollege(collegeId: string): Observable<College[]> {
    return this.http.post<College[]>(`${this.apiUrl}/shortlist/${collegeId}`, {});
  }

  removeShortlistCollege(collegeId: string): Observable<College[]> {
    return this.http.delete<College[]>(`${this.apiUrl}/shortlist/${collegeId}`);
  }

  applyToCollege(collegeId: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/apply/${collegeId}`, {});
  }
}
