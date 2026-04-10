import mongoose, { Document, Schema } from 'mongoose';
import { ApplicationStatus } from '../types/index.js';

export interface IApplication extends Document {
  userId: mongoose.Types.ObjectId;
  company: string;
  role: string;
  status: ApplicationStatus;
  jdLink?: string;
  jobDescription?: string;
  notes?: string;
  activities: { text: string; date: Date }[];
  followUpDate?: Date;
  salaryRange?: string;
  location?: string;
  seniority?: string;
  requiredSkills: string[];
  niceToHaveSkills: string[];
  resumeSuggestions: string[];
  matchScore: number | null;
  missingSkills: string[];
  dateApplied: Date;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const applicationSchema = new Schema<IApplication>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    company: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
    },
    role: {
      type: String,
      required: [true, 'Role title is required'],
      trim: true,
    },
    status: {
      type: String,
      enum: ['Applied', 'Phone Screen', 'Interview', 'Offer', 'Rejected'],
      default: 'Applied',
      required: true,
    },
    jdLink: {
      type: String,
      trim: true,
    },
    jobDescription: {
      type: String,
    },
    notes: {
      type: String,
    },
    activities: [{
      text: { type: String, required: true },
      date: { type: Date, default: Date.now }
    }],
    followUpDate: {
      type: Date,
    },
    salaryRange: {
      type: String,
      trim: true,
    },
    location: {
      type: String,
      trim: true,
    },
    seniority: {
      type: String,
      trim: true,
    },
    requiredSkills: {
      type: [String],
      default: [],
    },
    niceToHaveSkills: {
      type: [String],
      default: [],
    },
    resumeSuggestions: {
      type: [String],
      default: [],
    },
    matchScore: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },
    missingSkills: {
      type: [String],
      default: [],
    },
    dateApplied: {
      type: Date,
      default: Date.now,
    },
    order: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient querying by user and status
applicationSchema.index({ userId: 1, status: 1 });

export const Application = mongoose.model<IApplication>('Application', applicationSchema);
