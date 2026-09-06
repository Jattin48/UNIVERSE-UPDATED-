import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CollegeService } from '../../services/college.service';
import { StudentService } from '../../services/student.service';
import { AuthService } from '../../services/auth.service';
import { College } from '../../models/college.model';

@Component({
  selector: 'app-college-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './college-detail.component.html',
  styleUrls: ['./college-detail.component.css'],
})
export class CollegeDetailComponent implements OnInit {
  college: College | null = null;
  isLoading = true;
  errorMessage = '';

  constructor(
    private route: ActivatedRoute,
    private collegeService: CollegeService,
    private studentService: StudentService,
    public authService: AuthService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.fetchCollege(id);
    }
  }

  fetchCollege(id: string) {
    this.collegeService.getCollegeById(id).subscribe({
      next: (res) => {
        this.college = res;
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = 'College not found or error loading details';
      },
    });
  }

  applyNow() {
    if (!this.college) return;
    if (!this.authService.isStudent()) {
      alert('Please log in as a student to apply or submit interest.');
      return;
    }

    this.studentService.applyToCollege(this.college._id).subscribe({
      next: () => {
        alert(`Your application interest has been submitted to ${this.college?.name}!`);
      },
      error: (err) => {
        alert(err.error?.message || 'Error submitting application');
      },
    });
  }
}
