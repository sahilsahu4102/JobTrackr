import { Request } from 'express';

export interface AuthRequest extends Request {
  userId?: string;
}

export interface JwtPayload {
  userId: string;
  iat?: number;
  exp?: number;
}

export type ApplicationStatus = 'Applied' | 'Phone Screen' | 'Interview' | 'Offer' | 'Rejected';

export interface ParsedJD {
  company: string | null;
  role: string | null;
  requiredSkills: string[];
  niceToHaveSkills: string[];
  seniority: string | null;
  location: string | null;
  salaryRange: string | null;
}
