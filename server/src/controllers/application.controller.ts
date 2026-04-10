import { Response } from 'express';
import { z } from 'zod';
import { Application } from '../models/Application.js';
import { ApiError } from '../utils/apiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AuthRequest } from '../types/index.js';

// Schemas
const applicationBaseSchema = z.object({
  company: z.string().min(1, 'Company is required'),
  role: z.string().min(1, 'Role is required'),
  status: z.enum(['Applied', 'Phone Screen', 'Interview', 'Offer', 'Rejected']).optional(),
  jdLink: z.string().optional(),
  jobDescription: z.string().optional(),
  notes: z.string().optional(),
  salaryRange: z.string().optional(),
  location: z.string().optional(),
  seniority: z.string().optional(),
  dateApplied: z.string().or(z.date()).optional(),
  requiredSkills: z.array(z.string()).optional(),
  niceToHaveSkills: z.array(z.string()).optional(),
  resumeSuggestions: z.array(z.string()).optional(),
  matchScore: z.number().nullable().optional(),
  missingSkills: z.array(z.string()).optional(),
  activities: z.array(z.object({ text: z.string(), date: z.string().or(z.date()).optional() })).optional(),
  followUpDate: z.string().or(z.date()).optional(),
});

const updateStatusOrderSchema = z.object({
  status: z.enum(['Applied', 'Phone Screen', 'Interview', 'Offer', 'Rejected']),
  order: z.number().int().min(0),
});

const reorderSchema = z.object({
  applications: z.array(
    z.object({
      id: z.string(),
      status: z.enum(['Applied', 'Phone Screen', 'Interview', 'Offer', 'Rejected']),
      order: z.number(),
    })
  ),
});

// @desc    Get all applications for a user
export const getApplications = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const applications = await Application.find({ userId: req.userId }).sort({ order: 1, createdAt: -1 });
    
    res.json({
      success: true,
      count: applications.length,
      data: applications,
    });
  }
);

// @desc    Create new application
export const createApplication = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const data = applicationBaseSchema.parse(req.body);
    
    // Auto-calculate order (place at the end of the specified column)
    const status = data.status || 'Applied';
    const highestOrderApp = await Application.findOne({ userId: req.userId, status })
      .sort({ order: -1 })
      .select('order');
      
    const order = highestOrderApp ? highestOrderApp.order + 1024 : 1024;

    const application = await Application.create({
      ...data,
      userId: req.userId,
      order,
    });

    res.status(201).json({
      success: true,
      data: application,
    });
  }
);

// @desc    Update application
export const updateApplication = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const data = applicationBaseSchema.partial().parse(req.body);
    
    const application = await Application.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      data,
      { new: true, runValidators: true }
    );

    if (!application) {
      throw ApiError.notFound('Application not found');
    }

    res.json({
      success: true,
      data: application,
    });
  }
);

// @desc    Add activity to application timeline
export const addActivity = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { text } = z.object({ text: z.string().min(1) }).parse(req.body);
    
    const application = await Application.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { $push: { activities: { text, date: new Date() } } },
      { new: true }
    );

    if (!application) {
      throw ApiError.notFound('Application not found');
    }

    res.json({
      success: true,
      data: application,
    });
  }
);

// @desc    Update application status and order (for dragging)
export const updateStatusAndOrder = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { status, order } = updateStatusOrderSchema.parse(req.body);
    
    const application = await Application.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { status, order },
      { new: true, runValidators: true }
    );

    if (!application) {
      throw ApiError.notFound('Application not found');
    }

    res.json({
      success: true,
      data: application,
    });
  }
);

import mongoose from 'mongoose';

// @desc    Batch reorder applications (after drag and drop)
export const batchReorder = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { applications } = reorderSchema.parse(req.body);
    console.log("Receiving Reorder Request:", applications);
    // We execute multiple updates using bulkWrite for efficiency
    const bulkOps = applications.map((app) => ({
      updateOne: {
        filter: { 
          _id: new mongoose.Types.ObjectId(app.id), 
          userId: new mongoose.Types.ObjectId(req.userId) 
        },
        update: { $set: { status: app.status, order: app.order } },
      },
    }));

    await Application.bulkWrite(bulkOps);

    res.json({
      success: true,
      message: 'Applications reordered successfully',
    });
  }
);

// @desc    Delete application
export const deleteApplication = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const application = await Application.findOneAndDelete({ 
      _id: req.params.id, 
      userId: req.userId 
    });

    if (!application) {
      throw ApiError.notFound('Application not found');
    }

    res.json({
      success: true,
      data: {},
    });
  }
);
