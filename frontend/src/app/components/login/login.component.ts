import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent {
  email = '';
  password = '';
  errorMessage = '';
  successMessage = '';
  isLoading = false;

  // OTP Verification state
  isVerifyingOtp = false;
  otp = '';
  resendCooldown = 0;
  timerInterval: any = null;

  constructor(private authService: AuthService, private router: Router) {}

  onSubmit() {
    if (!this.email || !this.password) {
      this.errorMessage = 'Please provide email and password';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.authService.login({ email: this.email, password: this.password }).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.requiresVerification) {
          this.isVerifyingOtp = true;
          this.successMessage = res.message || 'OTP sent to your email. Please verify.';
          this.startResendTimer();
        } else {
          this.navigateUser(res.role);
        }
      },
      error: (err) => {
        this.isLoading = false;
        if (err.error?.requiresVerification) {
          this.isVerifyingOtp = true;
          this.successMessage = err.error.message || 'Please verify your email with the OTP sent to your inbox.';
          this.startResendTimer();
        } else {
          this.errorMessage = err.error?.message || 'Login failed. Please check credentials.';
        }
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
        this.successMessage = 'Email verified! Logging you in...';
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
    if (userRole === 'student') {
      this.router.navigate(['/colleges']);
    } else if (userRole === 'college') {
      this.router.navigate(['/college/dashboard']);
    } else if (userRole === 'admin') {
      this.router.navigate(['/admin/panel']);
    } else {
      this.router.navigate(['/colleges']);
    }
  }

  backToLogin() {
    this.isVerifyingOtp = false;
    this.errorMessage = '';
    this.successMessage = '';
  }
}
