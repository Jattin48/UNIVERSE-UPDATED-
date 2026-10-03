import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { UserRole } from '../../models/user.model';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css'],
})
export class SignupComponent {
  role: UserRole = 'student';
  email = '';
  password = '';
  name = '';
  phone = '';

  // College specific fields
  collegeName = '';
  city = '';
  state = '';
  collegeType = 'Private';

  // OTP Verification state
  isVerifyingOtp = false;
  otp = '';
  resendCooldown = 0;
  timerInterval: any = null;

  errorMessage = '';
  successMessage = '';
  isLoading = false;

  constructor(private authService: AuthService, private router: Router) {}

  selectRole(r: UserRole) {
    this.role = r;
  }

  onSubmit() {
    if (!this.email || !this.password) {
      this.errorMessage = 'Please provide required email and password';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const payload = {
      role: this.role,
      email: this.email,
      password: this.password,
      name: this.name,
      phone: this.phone,
      collegeName: this.collegeName || this.name,
      city: this.city,
      state: this.state,
      collegeType: this.collegeType,
    };

    this.authService.signup(payload).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.requiresVerification) {
          this.isVerifyingOtp = true;
          this.successMessage = res.message || 'OTP sent to your email. Please verify.';
          this.startResendTimer();
        } else if (res.token) {
          this.navigateUser(res.role);
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Registration failed. Please try again.';
      },
    });
  }

  onVerifyOtp() {
    if (!this.otp || this.otp.trim().length !== 6) {
      this.errorMessage = 'Please enter a valid 6-digit OTP code.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.authService.verifyOtp(this.email, this.otp.trim()).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.successMessage = 'Email verified successfully! Redirecting...';
        setTimeout(() => {
          this.navigateUser(res.role);
        }, 1200);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Invalid or expired OTP. Please try again.';
      },
    });
  }

  onResendOtp() {
    if (this.resendCooldown > 0) return;

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.authService.resendOtp(this.email).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.successMessage = res.message || 'A new OTP has been sent to your email.';
        this.startResendTimer();
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Failed to resend OTP.';
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

  navigateUser(userRole?: string) {
    const role = userRole || this.role;
    if (role === 'college') {
      this.router.navigate(['/college/dashboard']);
    } else {
      this.router.navigate(['/colleges']);
    }
  }

  backToSignup() {
    this.isVerifyingOtp = false;
    this.errorMessage = '';
    this.successMessage = '';
  }
}
