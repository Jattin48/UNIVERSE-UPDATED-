import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { asyncScheduler, EMPTY, Subject, Subscription } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, switchMap, throttleTime } from 'rxjs/operators';
import { CollegeService } from '../../services/college.service';
import { StudentService } from '../../services/student.service';
import { AuthService } from '../../services/auth.service';
import { College } from '../../models/college.model';

@Component({
  selector: 'app-college-search',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './college-search.component.html',
  styleUrls: ['./college-search.component.css'],
})
export class CollegeSearchComponent implements OnInit, OnDestroy {
  colleges: College[] = [];
  isLoading = false;
  errorMessage = '';
  private readonly searchQueryChanges = new Subject<string>();
  private readonly searchRequests = new Subject<void>();
  private readonly searchSubscriptions = new Subscription();
  private lastRequestedSearchQuery = '';

  // Filter inputs
  searchQuery = '';
  course = '';
  state = '';
  city = '';
  collegeType = '';
  budgetMin: number | null = null;
  budgetMax: number | null = null;
  minRating: number | null = null;

  // Shortlisted IDs for quick toggle
  shortlistedIds: string[] = [];

  // College comparison list
  comparedColleges: College[] = [];
  showComparisonModal = false;
  showMobileFilters = false;

  toggleMobileFilters() {
    this.showMobileFilters = !this.showMobileFilters;
  }

  constructor(
    private collegeService: CollegeService,
    private studentService: StudentService,
    public authService: AuthService
  ) {}

  ngOnInit(): void {
    // Wait until typing pauses before triggering a search.
    this.searchSubscriptions.add(
      this.searchQueryChanges
        .pipe(debounceTime(350), distinctUntilChanged())
        .subscribe((query) => {
          if (query.trim() !== this.lastRequestedSearchQuery) {
            this.fetchColleges();
          }
        })
    );

    // Limit this browser to one search per second; the backend enforces the shared per-IP limit.
    this.searchSubscriptions.add(
      this.searchRequests
        .pipe(throttleTime(1000, asyncScheduler, { leading: true, trailing: true }))
        .pipe(
          switchMap(() => {
            this.isLoading = true;
            this.errorMessage = '';
            this.lastRequestedSearchQuery = this.searchQuery.trim();

            const filters: any = {
              searchQuery: this.lastRequestedSearchQuery,
              course: this.course,
              state: this.state,
              city: this.city,
              type: this.collegeType,
              budgetMin: this.budgetMin,
              budgetMax: this.budgetMax,
              minRating: this.minRating,
            };

            return this.collegeService.searchColleges(filters).pipe(
              catchError(() => {
                this.isLoading = false;
                this.errorMessage = 'Failed to load colleges. Make sure backend is running.';
                return EMPTY;
              })
            );
          })
        )
        .subscribe((res) => {
          this.colleges = res;
          this.isLoading = false;
        })
    );

    this.fetchColleges();
    if (this.authService.isStudent()) {
      this.loadStudentShortlist();
    }
  }

  ngOnDestroy(): void {
    this.searchSubscriptions.unsubscribe();
  }

  onSearchQueryChange(query: string): void {
    this.searchQueryChanges.next(query);
  }

  fetchColleges() {
    this.searchRequests.next();
  }

  resetFilters() {
    this.searchQuery = '';
    this.course = '';
    this.state = '';
    this.city = '';
    this.collegeType = '';
    this.budgetMin = null;
    this.budgetMax = null;
    this.minRating = null;
    this.fetchColleges();
  }

  loadStudentShortlist() {
    this.studentService.getProfile().subscribe({
      next: (profile) => {
        if (profile && profile.shortlistedColleges) {
          this.shortlistedIds = profile.shortlistedColleges.map((c: any) =>
            typeof c === 'string' ? c : c._id
          );
        }
      },
    });
  }

  isShortlisted(collegeId: string): boolean {
    return this.shortlistedIds.includes(collegeId);
  }

  toggleShortlist(college: College) {
    if (!this.authService.isStudent()) {
      alert('Please log in as a Student to shortlist colleges.');
      return;
    }

    if (this.isShortlisted(college._id)) {
      this.studentService.removeShortlistCollege(college._id).subscribe({
        next: (updated) => {
          this.shortlistedIds = updated.map((c: any) => c._id || c);
        },
      });
    } else {
      this.studentService.shortlistCollege(college._id).subscribe({
        next: (updated) => {
          this.shortlistedIds = updated.map((c: any) => c._id || c);
        },
      });
    }
  }

  // Comparison feature
  toggleCompare(college: College) {
    const idx = this.comparedColleges.findIndex((c) => c._id === college._id);
    if (idx >= 0) {
      this.comparedColleges.splice(idx, 1);
    } else {
      if (this.comparedColleges.length >= 3) {
        alert('You can compare a maximum of 3 colleges at a time.');
        return;
      }
      this.comparedColleges.push(college);
    }
  }

  isCompared(collegeId: string): boolean {
    return this.comparedColleges.some((c) => c._id === collegeId);
  }

  openComparison() {
    if (this.comparedColleges.length < 2) {
      alert('Please select at least 2 colleges to compare.');
      return;
    }
    this.showComparisonModal = true;
  }

  closeComparison() {
    this.showComparisonModal = false;
  }

  applyNow(college: College) {
    if (!this.authService.isStudent()) {
      alert('Please log in as a student to apply or submit interest.');
      return;
    }

    this.studentService.applyToCollege(college._id).subscribe({
      next: (res) => {
        alert(`Success! Your interest has been submitted to ${college.name}.`);
      },
      error: (err) => {
        alert(err.error?.message || 'Error submitting application');
      },
    });
  }

  getLowestFee(college: College): number {
    if (!college.coursesOffered || college.coursesOffered.length === 0) return 0;
    return Math.min(...college.coursesOffered.map((c) => c.annualFee));
  }
}
