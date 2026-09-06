export type UserRole = 'student' | 'college' | 'admin';

export interface User {
  _id: string;
  email: string;
  role: UserRole;
  isVerified?: boolean;
}

export interface AuthResponse {
  _id: string;
  email: string;
  role: UserRole;
  token: string;
  profile?: any;
}
