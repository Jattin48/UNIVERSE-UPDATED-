import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CollegeService } from '../../services/college.service';
import { College, Course } from '../../models/college.model';

@Component({
  selector: 'app-college-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './college-dashboard.component.html',
  styleUrls: ['./college-dashboard.component.css'],
})
export class CollegeDashboardComponent implements OnInit {
  college: College | null = null;
  leads: any[] = [];
  isLoading = true;
  isSaving = false;
  successMessage = '';
  errorMessage = '';

  activeTab: 'listing' | 'courses' | 'documents' | 'leads' = 'listing';

  // New course form inputs
  newCourseName = '';
  newCourseDuration = '4 Years';
  newCourseEligibility = '50% in Class 12th';
  newCourseFee: number | null = null;
  newCourseSeats: number = 60;
  newCourseCutoff: number = 75;

  // New doc input
  newDocName = '';

  constructor(private collegeService: CollegeService) {}

  ngOnInit(): void {
    this.loadProfile();
    this.loadLeads();
  }

  loadProfile() {
    this.collegeService.getMyCollegeProfile().subscribe({
      next: (res) => {
        this.college = res;
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = 'Failed to load college profile.';
      },
    });
  }

  loadLeads() {
    this.collegeService.getCollegeLeads().subscribe({
      next: (res) => {
        this.leads = res;
      },
    });
  }

  saveListing() {
    if (!this.college) return;
    this.isSaving = true;
    this.successMessage = '';

    this.collegeService.updateMyCollegeProfile(this.college).subscribe({
      next: (updated) => {
        this.college = updated;
        this.isSaving = false;
        this.successMessage = 'College details updated successfully!';
      },
      error: (err) => {
        this.isSaving = false;
        this.errorMessage = 'Failed to save changes.';
      },
    });
  }

  addCourse() {
    if (!this.college || !this.newCourseName || !this.newCourseFee) {
      alert('Please provide course name and annual fee.');
      return;
    }

    const courseObj: Course = {
      name: this.newCourseName,
      duration: this.newCourseDuration,
      eligibility: this.newCourseEligibility,
      annualFee: this.newCourseFee,
      seats: this.newCourseSeats,
      cutoff: this.newCourseCutoff,
    };

    if (!this.college.coursesOffered) {
      this.college.coursesOffered = [];
    }

    this.college.coursesOffered.push(courseObj);
    this.saveListing();

    // Reset inputs
    this.newCourseName = '';
    this.newCourseFee = null;
  }

  removeCourse(index: number) {
    if (!this.college || !this.college.coursesOffered) return;
    this.college.coursesOffered.splice(index, 1);
    this.saveListing();
  }

  addDocument() {
    if (!this.newDocName) return;

    this.collegeService.uploadVerificationDocs([this.newDocName]).subscribe({
      next: (res) => {
        if (this.college) {
          this.college.documentsForVerification = res.documents;
        }
        this.newDocName = '';
        alert('Verification document uploaded! Status remains pending moderation.');
      },
    });
  }
}
