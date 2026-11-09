import { Response } from 'express';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { User } from '../models/User.js';
import { Application } from '../models/Application.js';
import { GUEST_RESUME, sampleApplications } from '../data/guestSeed.js';
import { env } from '../config/env.js';
import { ApiError } from '../utils/apiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AuthRequest } from '../types/index.js';

// Validation schemas
const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const updateProfileSchema = z.object({
  name: z.string().min(2).max(50).optional(),
  resumeText: z.string().optional(),
});

// Generate JWT token
const generateToken = (userId: string, expiresIn: string = env.JWT_EXPIRES_IN): string => {
  return jwt.sign({ userId }, env.JWT_SECRET, {
    expiresIn: expiresIn as any,
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const register = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { name, email, password } = registerSchema.parse(req.body);

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw ApiError.badRequest('An account with this email already exists');
    }

    // Create user
    const user = await User.create({ name, email, password });

    // Generate token
    const token = generateToken(user._id.toString());

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          resumeText: user.resumeText,
        },
        token,
      },
    });
  }
);

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { email, password } = loginSchema.parse(req.body);

    // Find user and include password for comparison
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    // Compare password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    // Generate token
    const token = generateToken(user._id.toString());

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          resumeText: user.resumeText,
        },
        token,
      },
    });
  }
);

// Guests live 24 h. The cap keeps an open, unauthenticated endpoint from filling the free
// 512 MB Atlas tier; ponytail: a per-IP rate limit if this is ever abused.
const GUEST_TTL_MS = 24 * 60 * 60 * 1000;
const MAX_GUESTS = 200;

// @desc    One-click demo account with sample applications (for recruiters and reviewers)
// @route   POST /api/auth/guest
// @access  Public
export const guestLogin = asyncHandler(
  async (_req: AuthRequest, res: Response): Promise<void> => {
    // Sweep expired guests and their applications
    const expired = await User.distinct('_id', { isGuest: true, createdAt: { $lt: new Date(Date.now() - GUEST_TTL_MS) } });
    if (expired.length) {
      await Application.deleteMany({ userId: { $in: expired } });
      await User.deleteMany({ _id: { $in: expired } });
    }
    if ((await User.countDocuments({ isGuest: true })) >= MAX_GUESTS) {
      throw new ApiError(429, 'Too many guest sessions right now. Please try again later or sign up.');
    }

    const user = await User.create({
      name: 'Guest',
      email: `guest-${randomUUID()}@guest.jobtrackr.app`,
      password: randomUUID(), // never shown; the token is the only way back in
      resumeText: GUEST_RESUME,
      isGuest: true,
    });
    await Application.insertMany(sampleApplications(user._id));

    res.status(201).json({
      success: true,
      data: {
        user: { id: user._id, name: user.name, email: user.email, resumeText: user.resumeText },
        token: generateToken(user._id.toString(), '1d'),
      },
    });
  }
);

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
export const getMe = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const user = await User.findById(req.userId);
    if (!user) {
      throw ApiError.notFound('User not found');
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          resumeText: user.resumeText,
        },
      },
    });
  }
);

// @desc    Update user profile (e.g. resume)
// @route   PUT /api/auth/profile
// @access  Private
export const updateProfile = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { name, resumeText } = updateProfileSchema.parse(req.body);

    const user = await User.findById(req.userId);
    if (!user) {
      throw ApiError.notFound('User not found');
    }

    if (name !== undefined) user.name = name;
    if (resumeText !== undefined) user.resumeText = resumeText;

    await user.save();

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          resumeText: user.resumeText,
        },
      },
    });
  }
);
