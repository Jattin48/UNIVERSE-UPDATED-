import { College } from './college.model';

export interface Class12Details {
  board: string;
  stream: 'Science' | 'Commerce' | 'Arts' | 'Other';
  percentage: number;
  yearOfPassing: number;
  subjects: string[];
}

export interface StudentPreferences {
  coursesInterested: string[];
  preferredLocations: string[];
  budgetMin: number;
  budgetMax: number;
  collegeType: string[];
}

export interface StudentProfile {
  _id: string;
  userId: string;
  name: string;
  phone: string;
  dob?: string;
  class12: Class12Details;
  preferences: StudentPreferences;
  shortlistedColleges: College[] | string[];
}
