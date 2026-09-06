export interface Course {
  _id?: string;
  name: string;
  duration: string;
  eligibility: string;
  annualFee: number;
  seats: number;
  cutoff: number;
}

export interface CollegeLocation {
  city: string;
  state: string;
  country: string;
  coordinates: [number, number]; // [lon, lat]
}

export interface College {
  _id: string;
  userId: string;
  name: string;
  location: CollegeLocation;
  type: 'Government' | 'Private' | 'Deemed';
  affiliation: string;
  registrationStatus: 'pending' | 'approved' | 'rejected';
  coursesOffered: Course[];
  facilities: string[];
  images: string[];
  website?: string;
  admissionProcess?: string;
  documentsForVerification?: string[];
  rating?: number;
  interestedStudents?: Array<{
    studentId: any;
    appliedAt: string;
  }>;
}
