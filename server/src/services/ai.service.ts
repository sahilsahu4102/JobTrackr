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

// Free OpenRouter models, in the order tried (the free list changes, so
// OPENROUTER_FREE_MODELS can replace it). Until 2026-11 the only model was the paid
// openai/gpt-4o-mini, and an account without credits answered 402 to every parse.
// Timed on one 16 000-character LinkedIn posting with a resume, 2026-11-09: Gemma was
// rate-limited (it fails in under a second, so trying it first costs nothing), Flint took
// 20-24 s and Nemotron 3.5 Super VL 23 s with good output, the 30B reasoning model 32 s,
// and the 550B model 48 s while listing 36 required skills for one posting.
const FREE_MODELS = [
  'google/gemma-4-31b-it:free',
  'recursive/flint-v1.0:free',
  'nvidia/nemotron-3.5-super-vl:free',
  'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free',
  'nvidia/nemotron-3-ultra-550b-a55b:free',
];

class AIService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: env.OPENROUTER_API_KEY,
      maxRetries: 0, // a busy free model should hand over to the next one, not be retried
      timeout: 45_000, // free models take 20-30 s on a long posting
      defaultHeaders: {
        'HTTP-Referer': 'http://localhost:5173', // Your site URL for rankings
        'X-Title': 'JobTrackr', // Your site name
      },
    });
  }

  /**
   * Fetches a job page as text: directly first, then through the free Jina Reader
   * (r.jina.ai), which loads the page in a real browser, for sites that block scripts or
   * render with JavaScript. Until 2026-11 this went through Scrapingdog, whose plan had
   * run out, so every URL failed with a 403.
   */
  async scrapeUrl(url: string): Promise<string> {
    const direct = await axios
      .get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        },
        timeout: 10000,
      })
      .then((res) => {
        const $ = cheerio.load(res.data);
        $('script, style, noscript, nav, footer, header').remove(); // noisy elements
        return $('body').text().replace(/\s+/g, ' ').trim();
      })
      .catch(() => '');
    if (direct.length >= 500) return direct; // a JavaScript shell has far less text than a job post

    const reader = await axios
      .get(`https://r.jina.ai/${url}`, { headers: { Accept: 'text/plain' }, timeout: 25000, responseType: 'text' })
      .then((res) => String(res.data).replace(/\s+/g, ' ').trim())
      .catch(() => '');
    // The reader answers 200 with a warning when the target page itself failed
    if (reader.length >= 200 && !/returned error [45]\d\d/.test(reader.slice(0, 600))) return reader;

    console.error('Scraping error: no text from', url);
    throw ApiError.badRequest('Failed to scrape URL. The site might be protected against bots. Please try pasting the text manually.');
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

      const messages = [
        { role: 'system' as const, content: systemContent },
        { role: 'user' as const, content: `Job Description Text:\n\n${text.substring(0, 10000)}` }, // a posting is rarely longer; less text, faster answer
      ];

      // The first model that answers with a complete result wins. A 402 (no credits), 404
      // (model withdrawn), 429 (free tier busy), an outage or an unusable answer moves on;
      // a result that parses but is hollow (no skills, or no score when a resume was
      // given) is kept as a last resort, since a posting can genuinely list no skills.
      let hollow: ParsedJobDescription | null = null;
      const models = [env.OPENROUTER_MODEL, ...(env.OPENROUTER_FREE_MODELS?.trim() ? env.OPENROUTER_FREE_MODELS.split(',') : FREE_MODELS)]
        .map((m) => m?.trim())
        .filter((m): m is string => !!m);
      const failures: string[] = [];

      for (const model of new Set(models)) {
        try {
          // No response_format: several free models reject it, and the JSON is
          // extracted from the reply either way.
          const completion = await this.openai.chat.completions.create({ model, messages, temperature: 0.1 });
          const parsed = extractJob(completion.choices[0]?.message?.content ?? '');
          if (parsed && isComplete(parsed, !!resumeText)) return parsed;
          if (parsed) hollow ??= parsed;
          failures.push(`${model}: ${parsed ? 'hollow answer' : 'unusable answer'}`);
        } catch (err) {
          failures.push(`${model}: ${(err as Error).message.slice(0, 80)}`);
        }
        console.warn(`[AI] ${failures[failures.length - 1]}, trying the next model`);
      }
      if (hollow) return hollow;
      throw new Error(`no model answered (${failures.join('; ')})`);

    } catch (err) {
      const error = err as Error;
      console.error('AI parse error:', error);
      throw ApiError.internal(`AI API Error: ${error.message || 'Verification Failed.'}`);
    }
  }
}

/** A result worth returning at once: it lists skills and, if a resume was given, scores the match. */
export function isComplete(job: ParsedJobDescription, hasResume: boolean): boolean {
  return job.requiredSkills.length + job.niceToHaveSkills.length > 0 && (!hasResume || job.matchScore !== null);
}

/** The job object in a model reply, which may wrap it in prose or a code fence; null if unusable. */
export function extractJob(reply: string): ParsedJobDescription | null {
  const match = reply.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    const job = JSON.parse(match[0]);
    if (typeof job.company !== 'string' || typeof job.role !== 'string') return null;
    return {
      ...job,
      requiredSkills: Array.isArray(job.requiredSkills) ? job.requiredSkills : [],
      niceToHaveSkills: Array.isArray(job.niceToHaveSkills) ? job.niceToHaveSkills : [],
      missingSkills: Array.isArray(job.missingSkills) ? job.missingSkills : [],
      resumeSuggestions: Array.isArray(job.resumeSuggestions) ? job.resumeSuggestions : [],
      matchScore: typeof job.matchScore === 'number' ? job.matchScore : null,
    };
  } catch {
    return null;
  }
}

export const aiService = new AIService();
