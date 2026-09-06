import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../models/user.model';

export const roleGuard = (allowedRoles: UserRole[]): CanActivateFn => {
  return (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    const userRole = authService.getUserRole();

    if (authService.isLoggedIn() && userRole && allowedRoles.includes(userRole)) {
      return true;
    }

    if (!authService.isLoggedIn()) {
      router.navigate(['/login']);
    } else {
      router.navigate(['/colleges']);
    }

    return false;
  };
};
