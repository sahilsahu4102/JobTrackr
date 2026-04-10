import { Response } from 'express';
import { z } from 'zod';
import { aiService } from '../services/ai.service.js';
import { ApiError } from '../utils/apiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AuthRequest } from '../types/index.js';
import { User } from '../models/User.js';

const parseRequestSchema = z.object({
  url: z.string().url().optional(),
  text: z.string().optional(),
}).refine(data => data.url || data.text, {
  message: "Either 'url' or 'text' must be provided",
});

// @desc    Parse Job Description using OpenAI
// @route   POST /api/ai/parse-jd
export const parseJobDescription = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { url, text } = parseRequestSchema.parse(req.body);
    
    let textToParse = text || '';

    // If a URL was provided, attempt to scrape it
    if (url && !text) {
      textToParse = await aiService.scrapeUrl(url);
    }
    
    // Ensure we have something to parse
    if (!textToParse || textToParse.trim().length < 20) {
      throw ApiError.badRequest('The job description text is too short to parse.');
    }

    // Fetch user to get their resume for matching
    const user = await User.findById(req.userId);
    const resumeText = user?.resumeText && user.resumeText.trim() !== '' ? user.resumeText : undefined;
    
    console.log(`[AI-DEBUG] Retrieved user resumeText length: ${resumeText?.length || 0}`);

    // Hit OpenAI
    const parsedData = await aiService.parseJobDescription(textToParse, resumeText);
    
    console.log(`[AI-DEBUG] AI Response:`, JSON.stringify(parsedData, null, 2));

    res.json({
      success: true,
      data: parsedData,
    });
  }
);
