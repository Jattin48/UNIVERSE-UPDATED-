import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, RouterLinkActive],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css'],
})
export class NavbarComponent {
  isMobileMenuOpen = false;

  // Optional OTP Modal state
  showOtpModal = false;
  otp = '';
  otpSuccess = '';
  otpError = '';
  isVerifying = false;
  resendCooldown = 0;
  timerInterval: any = null;

  constructor(public authService: AuthService, private router: Router) {}

  toggleMobileMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  closeMobileMenu() {
    this.isMobileMenuOpen = false;
  }

  openOtpModal() {
    this.showOtpModal = true;
    this.otp = '';
    this.otpSuccess = '';
    this.otpError = '';
    this.closeMobileMenu();
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

    this.isVerifying = true;
    this.otpError = '';
    this.otpSuccess = '';

    this.authService.verifyOtp(email, this.otp.trim()).subscribe({
      next: (res) => {
        this.isVerifying = false;
        this.otpSuccess = 'Email verified successfully!';
        setTimeout(() => {
          this.closeOtpModal();
        }, 1500);
      },
      error: (err) => {
        this.isVerifying = false;
        this.otpError = err.error?.message || 'Invalid or expired OTP. Please try again.';
      },
    });
  }

  onResendOtpModal() {
    if (this.resendCooldown > 0) return;

    const email = this.authService.currentUser()?.email;
    if (!email) return;

    this.isVerifying = true;
    this.otpError = '';
    this.otpSuccess = '';

    this.authService.resendOtp(email).subscribe({
      next: (res) => {
        this.isVerifying = false;
        this.otpSuccess = res.message || 'OTP sent to your email!';
        this.startResendTimer();
      },
      error: (err) => {
        this.isVerifying = false;
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

  onLogout() {
    this.authService.logout();
    this.closeMobileMenu();
    this.router.navigate(['/login']);
  }
}
