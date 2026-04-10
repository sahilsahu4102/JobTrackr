export interface User {
  id: string;
  name: string;
  email: string;
  resumeText?: string;
}

export interface AuthResponse {
  success: boolean;
  data: {
    user: User;
    token: string;
  };
}

export interface MeResponse {
  success: boolean;
  data: {
    user: User;
  };
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: Array<{ field: string; message: string }>;
}

export type ApplicationStatus = 'Applied' | 'Phone Screen' | 'Interview' | 'Offer' | 'Rejected';

export interface Application {
  _id: string;
  company: string;
  role: string;
  status: ApplicationStatus;
  jdLink?: string;
  jobDescription?: string;
  notes?: string;
  activities: { text: string; date: string }[];
  followUpDate?: string;
  salaryRange?: string;
  location?: string;
  seniority?: string;
  requiredSkills: string[];
  niceToHaveSkills: string[];
  resumeSuggestions: string[];
  matchScore?: number | null;
  missingSkills?: string[];
  dateApplied: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}
