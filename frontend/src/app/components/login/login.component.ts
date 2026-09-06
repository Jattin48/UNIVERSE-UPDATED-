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
  isLoading = false;

  constructor(private authService: AuthService, private router: Router) {}

  onSubmit() {
    if (!this.email || !this.password) {
      this.errorMessage = 'Please provide email and password';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.login({ email: this.email, password: this.password }).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.role === 'student') {
          this.router.navigate(['/colleges']);
        } else if (res.role === 'college') {
          this.router.navigate(['/college/dashboard']);
        } else if (res.role === 'admin') {
          this.router.navigate(['/admin/panel']);
        } else {
          this.router.navigate(['/colleges']);
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Login failed. Please check credentials.';
      },
    });
  }
}
