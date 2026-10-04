import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { StudentService } from '../../services/student.service';
import { StudentProfile } from '../../models/student.model';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-student-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './student-profile.component.html',
  styleUrls: ['./student-profile.component.css'],
})
export class StudentProfileComponent implements OnInit {
  profile: StudentProfile | null = null;
  isLoading = true;
  isSaving = false;
  successMessage = '';
  errorMessage = '';
  activeTab: 'overview' | 'edit' | 'shortlist' = 'overview';
  copiedLink = false;

  // OTP Modal State
  showOtpModal = false;
  otp = '';
  otpSuccess = '';
  otpError = '';
  isVerifyingOtp = false;
  resendCooldown = 0;
  timerInterval: any = null;

  // Form helpers
  coursesInput = '';
  locationsInput = '';
  subjectsInput = '';

  constructor(
    private studentService: StudentService,
    public authService: AuthService
  ) {}

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
      error: () => {
        this.isLoading = false;
        this.errorMessage = 'Failed to load profile details.';
      },
    });
  }

  setTab(tab: 'overview' | 'edit' | 'shortlist') {
    this.activeTab = tab;
    this.successMessage = '';
    this.errorMessage = '';
  }

  getInitials(name?: string): string {
    if (!name) return 'ST';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
  }

  get shortlistedList(): any[] {
    return (this.profile?.shortlistedColleges as any[]) || [];
  }

  getShortlistedCount(): number {
    return this.shortlistedList.length;
  }

  isCollegeObject(item: any): boolean {
    return typeof item === 'object' && item !== null && 'name' in item;
  }

  copyProfileLink() {
    navigator.clipboard.writeText(window.location.href);
    this.copiedLink = true;
    setTimeout(() => {
      this.copiedLink = false;
    }, 2500);
  }

  openOtpModal() {
    this.showOtpModal = true;
    this.otp = '';
    this.otpSuccess = '';
    this.otpError = '';
  }

  closeOtpModal() {
    this.showOtpModal = false;
  }

  onVerifyOtpModal() {
    const email = this.authService.currentUser()?.email;
    if (!email || !this.otp || this.otp.trim().length !== 6) {
      this.otpError = 'Please enter a valid 6-digit OTP code.';
      return;
    }

    this.isVerifyingOtp = true;
    this.otpError = '';
    this.otpSuccess = '';

    this.authService.verifyOtp(email, this.otp.trim()).subscribe({
      next: () => {
        this.isVerifyingOtp = false;
        this.otpSuccess = 'Email verified successfully!';
        setTimeout(() => {
          this.closeOtpModal();
        }, 1500);
      },
      error: (err) => {
        this.isVerifyingOtp = false;
        this.otpError = err.error?.message || 'Invalid or expired OTP code.';
      },
    });
  }

  onResendOtpModal() {
    if (this.resendCooldown > 0) return;

    const email = this.authService.currentUser()?.email;
    if (!email) return;

    this.isVerifyingOtp = true;
    this.otpError = '';
    this.otpSuccess = '';

    this.authService.resendOtp(email).subscribe({
      next: (res) => {
        this.isVerifyingOtp = false;
        this.otpSuccess = res.message || 'OTP code sent to your email!';
        this.startResendTimer();
      },
      error: (err) => {
        this.isVerifyingOtp = false;
        this.otpError = err.error?.message || 'Failed to resend OTP.';
      },
    });
  }

  startResendTimer() {
    this.resendCooldown = 60;
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      if (this.resendCooldown > 0) {
        this.resendCooldown--;
      } else {
        clearInterval(this.timerInterval);
      }
    }, 1000);
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
