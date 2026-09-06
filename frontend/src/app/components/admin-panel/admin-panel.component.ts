import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AdminService } from '../../services/admin.service';
import { College } from '../../models/college.model';

@Component({
  selector: 'app-admin-panel',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './admin-panel.component.html',
  styleUrls: ['./admin-panel.component.css'],
})
export class AdminPanelComponent implements OnInit {
  pendingColleges: College[] = [];
  allColleges: College[] = [];
  isLoading = true;
  activeFilter: 'pending' | 'all' = 'pending';

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData() {
    this.isLoading = true;
    this.adminService.getPendingColleges().subscribe({
      next: (res) => {
        this.pendingColleges = res;
        this.isLoading = false;
      },
    });

    this.adminService.getAllColleges().subscribe({
      next: (res) => {
        this.allColleges = res;
      },
    });
  }

  updateStatus(collegeId: string, status: 'approved' | 'rejected') {
    this.adminService.updateCollegeStatus(collegeId, status).subscribe({
      next: (res) => {
        alert(`College listing set to '${status}' successfully!`);
        this.loadData();
      },
      error: (err) => {
        alert('Failed to update college status');
      },
    });
  }
}
