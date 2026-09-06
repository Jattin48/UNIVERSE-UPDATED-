import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StudentService } from '../../services/student.service';
import { StudentProfile } from '../../models/student.model';

@Component({
  selector: 'app-student-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './student-profile.component.html',
  styleUrls: ['./student-profile.component.css'],
})
export class StudentProfileComponent implements OnInit {
  profile: StudentProfile | null = null;
  isLoading = true;
  isSaving = false;
  successMessage = '';
  errorMessage = '';

  // Form helpers
  coursesInput = '';
  locationsInput = '';
  subjectsInput = '';

  constructor(private studentService: StudentService) {}

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile() {
    this.studentService.getProfile().subscribe({
      next: (res) => {
        this.profile = res;
        this.isLoading = false;
        if (res.preferences?.coursesInterested) {
          this.coursesInput = res.preferences.coursesInterested.join(', ');
        }
        if (res.preferences?.preferredLocations) {
          this.locationsInput = res.preferences.preferredLocations.join(', ');
        }
        if (res.class12?.subjects) {
          this.subjectsInput = res.class12.subjects.join(', ');
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = 'Failed to load profile details.';
      },
    });
  }

  onSave() {
    if (!this.profile) return;

    this.isSaving = true;
    this.successMessage = '';
    this.errorMessage = '';

    const payload: Partial<StudentProfile> = {
      name: this.profile.name,
      phone: this.profile.phone,
      class12: {
        ...this.profile.class12,
        subjects: this.subjectsInput
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
      },
      preferences: {
        ...this.profile.preferences,
        coursesInterested: this.coursesInput
          .split(',')
          .map((c) => c.trim())
          .filter(Boolean),
        preferredLocations: this.locationsInput
          .split(',')
          .map((l) => l.trim())
          .filter(Boolean),
      },
    };

    this.studentService.updateProfile(payload).subscribe({
      next: (updated) => {
        this.profile = updated;
        this.isSaving = false;
        this.successMessage = 'Profile updated successfully!';
      },
      error: (err) => {
        this.isSaving = false;
        this.errorMessage = err.error?.message || 'Failed to update profile.';
      },
    });
  }
}
