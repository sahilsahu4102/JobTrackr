import OpenAI from 'openai';
import { env } from '../config/env.js';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { ApiError } from '../utils/apiError.js';

// Parse schema mapping to our Application model
export interface ParsedJobDescription {
  company: string;
  role: string;
  location?: string;
  salaryRange?: string;
  seniority?: string;
  requiredSkills: string[];
  niceToHaveSkills: string[];
  matchScore: number | null;
  missingSkills: string[];
  resumeSuggestions: string[];
}

class AIService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: env.OPENROUTER_API_KEY,
      defaultHeaders: {
        'HTTP-Referer': 'http://localhost:5173', // Your site URL for rankings
        'X-Title': 'JobTrackr', // Your site name
      },
    });
  }

  /**
   * Fetches the HTML content of a URL and extracts the outer text payload.
   * Leverages ScrapingDog API if configured to bypass anti-bot protections.
   */
  async scrapeUrl(url: string): Promise<string> {
    try {
      let targetUrl = url;
      
      if (env.SCRAPINGDOG_API_KEY) {
        // Route through ScrapingDog
        targetUrl = `https://api.scrapingdog.com/scrape?api_key=${env.SCRAPINGDOG_API_KEY}&url=${encodeURIComponent(url)}&dynamic=false`;
      }

      const response = await axios.get(targetUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        },
        timeout: 15000, // 15 second timeout for scrape service
      });

      const $ = cheerio.load(response.data);
      
      // Remove noisy elements
      $('script, style, noscript, nav, footer, header').remove();
      
      const text = $('body').text().replace(/\s+/g, ' ').trim();
      
      if (!text || text.length < 50) {
        throw new Error('Extracted text is too short or blocked.');
      }
      
      return text;
    } catch (err) {
      const error = err as Error;
      console.error('Scraping error:', error.message);
      throw ApiError.badRequest('Failed to scrape URL. The site might be protected against bots. Please try pasting the text manually.');
    }
  }

  /**
   * Passes the raw text into OpenAI to map to our Application schema.
   * If a resumeText is provided, it will also calculate a match score and missing skills.
   */
  async parseJobDescription(text: string, resumeText?: string): Promise<ParsedJobDescription> {
    try {
      const systemContent = `You are an expert HR assistant. Your goal is to extract structured information from the provided job description text.
        Return ONLY a perfectly formatted, strict JSON object. No markdown wrapping.
        The JSON object MUST match this EXACT structure:
        {
          "company": "Company Name",
          "role": "Target Job Title",
          "location": "City, State, or Remote",
          "salaryRange": "$XXX,XXX - $XXX,XXX or equivalent",
          "seniority": "Entry, Mid, Senior, Lead, etc",
          "requiredSkills": ["skill1", "skill2"],
          "niceToHaveSkills": ["skill1", "skill2"]
          ${resumeText ? `,"matchScore": Number between 0 and 100 representing how well the User Resume matches the job description,
          "missingSkills": ["missing skill 1 from resume", "missing skill 2"],
          "resumeSuggestions": ["Actionable suggestion to improve resume", "Another specific suggestion to rewrite bullet point"]` : `,"matchScore": null, "missingSkills": [], "resumeSuggestions": []`}
        }
        If you cannot determine a field, return an empty string for text fields, or an empty array for array fields.
        Never guess the company name if it's completely absent, use "Unknown Company".
        ${resumeText ? `\nHere is the User's Resume to compare against:\n"""\n${resumeText.substring(0, 5000)}\n"""\nAnalyze the resume against the job description and generate the matchScore, missingSkills, and resumeSuggestions.` : ''}
      `;

      const completion = await this.openai.chat.completions.create({
        model: 'openai/gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: systemContent
          },
          {
            role: 'user',
            content: `Job Description Text:\n\n${text.substring(0, 15000)}` // Limit text length to save tokens
          }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.1, // Low temperature for deterministic extraction
      });

      const result = completion.choices[0]?.message?.content;
      
      if (!result) {
        throw new Error('OpenAI returned empty response');
      }

      const parsed: ParsedJobDescription = JSON.parse(result);
      return parsed;

    } catch (err) {
      const error = err as Error;
      console.error('OpenAI Parse Error:', error);
      throw ApiError.internal(`AI API Error: ${error.message || 'Verification Failed.'}`);
    }
  }
}

export const aiService = new AIService();
