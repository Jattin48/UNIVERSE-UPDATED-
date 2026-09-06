import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { StudentService } from '../../services/student.service';
import { College } from '../../models/college.model';

@Component({
  selector: 'app-shortlist',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './shortlist.component.html',
  styleUrls: ['./shortlist.component.css'],
})
export class ShortlistComponent implements OnInit {
  shortlistedColleges: College[] = [];
  isLoading = true;

  constructor(private studentService: StudentService) {}

  ngOnInit(): void {
    this.loadShortlist();
  }

  loadShortlist() {
    this.studentService.getProfile().subscribe({
      next: (profile) => {
        this.isLoading = false;
        if (profile && Array.isArray(profile.shortlistedColleges)) {
          this.shortlistedColleges = profile.shortlistedColleges as College[];
        }
      },
      error: () => {
        this.isLoading = false;
      },
    });
  }

  removeShortlist(collegeId: string) {
    this.studentService.removeShortlistCollege(collegeId).subscribe({
      next: (updatedList: any) => {
        this.shortlistedColleges = this.shortlistedColleges.filter((c) => c._id !== collegeId);
      },
    });
  }

  applyNow(college: College) {
    this.studentService.applyToCollege(college._id).subscribe({
      next: () => {
        alert(`Application/Interest submitted to ${college.name}!`);
      },
      error: (err) => {
        alert(err.error?.message || 'Error submitting application');
      },
    });
  }
}
