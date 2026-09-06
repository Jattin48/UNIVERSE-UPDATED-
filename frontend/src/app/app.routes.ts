import { Routes } from '@angular/router';
import { CollegeSearchComponent } from './components/college-search/college-search.component';
import { CollegeDetailComponent } from './components/college-detail/college-detail.component';
import { LoginComponent } from './components/login/login.component';
import { SignupComponent } from './components/signup/signup.component';
import { StudentProfileComponent } from './components/student-profile/student-profile.component';
import { ShortlistComponent } from './components/shortlist/shortlist.component';
import { CollegeDashboardComponent } from './components/college-dashboard/college-dashboard.component';
import { AdminPanelComponent } from './components/admin-panel/admin-panel.component';
import { authGuard } from './guards/auth.guard';
import { roleGuard } from './guards/role.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'colleges', pathMatch: 'full' },
  { path: 'colleges', component: CollegeSearchComponent },
  { path: 'colleges/:id', component: CollegeDetailComponent },
  { path: 'login', component: LoginComponent },
  { path: 'signup', component: SignupComponent },
  {
    path: 'student/profile',
    component: StudentProfileComponent,
    canActivate: [authGuard, roleGuard(['student'])],
  },
  {
    path: 'student/shortlist',
    component: ShortlistComponent,
    canActivate: [authGuard, roleGuard(['student'])],
  },
  {
    path: 'college/dashboard',
    component: CollegeDashboardComponent,
    canActivate: [authGuard, roleGuard(['college'])],
  },
  {
    path: 'admin/panel',
    component: AdminPanelComponent,
    canActivate: [authGuard, roleGuard(['admin'])],
  },
  { path: '**', redirectTo: 'colleges' },
];
