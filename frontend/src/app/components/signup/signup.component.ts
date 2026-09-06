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

  errorMessage = '';
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
        if (res.role === 'college') {
          this.router.navigate(['/college/dashboard']);
        } else {
          this.router.navigate(['/colleges']);
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Registration failed. Please try again.';
      },
    });
  }
}
