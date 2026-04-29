import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class AIService {
  private readonly logger = new Logger(AIService.name);
  private genAI: GoogleGenerativeAI;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('GOOGLE_AI_API_KEY');
    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
    } else {
      this.logger.warn('GOOGLE_AI_API_KEY is not set. AI features will be disabled.');
    }
  }

  async recommendWorkers(query: string, workers: any[]) {
    if (!this.genAI) return []; // Fallback is handled by RecommendationsService

    const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const workerData = workers.map(w => ({
      id: w.id,
      name: w.name,
      skill: w.skill,
      experience: w.experience,
      rating: w.rating,
      reviewCount: w.reviewCount
    }));

    const categories = ['Plumber', 'Electrician', 'Carpenter', 'Tailor', 'Painter', 'Cleaner', 'Mechanic', 'Cook', 'Driver', 'AC Repair'];

    const prompt = `
      You are an expert recruitment assistant for "Rozgaar360", a professional service platform in Pakistan.
      
      CUSTOMER QUERY: "${query}"
      
      AVAILABLE CATEGORIES: ${categories.join(', ')}
      
      AVAILABLE WORKERS:
      ${JSON.stringify(workerData, null, 2)}
      
      TASK:
      1. Determine if the customer's query relates to any of the AVAILABLE CATEGORIES. 
         - If the query is about plumbing (leaks, pipes, taps), match with "Plumber".
         - If the query is about electrical issues (wiring, lights, sockets), match with "Electrician".
         - Be strict. Do NOT recommend an Electrician for a plumbing job.
      2. From the PROVIDED WORKERS list, select the workers whose "skill" genuinely matches the requirement.
      3. If NO suitable workers are found in the list, return an empty array [].
      4. Return a JSON array of the top 5 most suitable workers.
      5. For each worker, provide an "aiReason" explaining why their skill is the right one for this specific job.
      
      OUTPUT FORMAT (Strict JSON):
      [
        { "id": "worker_id", "aiReason": "Reason here", "matchScore": 95 },
        ...
      ]
    `;

    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Clean up string in case AI adds markdown
      const cleanJson = text.replace(/```json|```/g, '').trim();
      return JSON.parse(cleanJson);
    } catch (error) {
      this.logger.error('Error getting AI recommendations:', error);
      return [];
    }
  }

  private extractJsonArray(text: string): any[] {
    const cleaned = text.replace(/```json|```/g, '').trim();
    const firstBracket = cleaned.indexOf('[');
    const lastBracket = cleaned.lastIndexOf(']');

    if (firstBracket === -1 || lastBracket === -1 || lastBracket <= firstBracket) {
      throw new Error('AI response did not contain a JSON array');
    }

    return JSON.parse(cleaned.slice(firstBracket, lastBracket + 1));
  }

  private normalizeText(value: unknown): string {
    return String(value || '').toLowerCase().trim();
  }

  private parseBudget(job: any): number {
    const rawBudget = job?.budget ?? job?.estimatedCost ?? job?.amount ?? 0;
    const numericBudget = Number(rawBudget);
    return Number.isFinite(numericBudget) ? numericBudget : 0;
  }

  private scoreFallbackJob(workerProfile: any, job: any, maxBudget: number): { score: number; reasons: string[]; tag: string } {
    const workerSkills = Array.isArray(workerProfile?.skills)
      ? workerProfile.skills.map((skill: unknown) => this.normalizeText(skill))
      : [this.normalizeText(workerProfile?.skills || workerProfile?.skill)].filter(Boolean);

    const requiredSkills = Array.isArray(job?.requiredSkills)
      ? job.requiredSkills.map((skill: unknown) => this.normalizeText(skill))
      : [this.normalizeText(job?.requiredSkills || job?.category || job?.title)].filter(Boolean);

    const jobText = [job?.title, job?.description, job?.category, job?.location]
      .filter(Boolean)
      .map((value) => this.normalizeText(value))
      .join(' ');

    const skillMatches = requiredSkills.filter((skill) => workerSkills.some((workerSkill) => workerSkill.includes(skill) || skill.includes(workerSkill))).length;
    const skillScore = requiredSkills.length > 0
      ? Math.min(40, (skillMatches / requiredSkills.length) * 40)
      : (workerSkills.some((skill) => jobText.includes(skill)) ? 24 : 8);

    const workerLocation = this.normalizeText(workerProfile?.location || workerProfile?.city || workerProfile?.workerLocation);
    const jobLocation = this.normalizeText(job?.location);
    const locationMatches = workerLocation && jobLocation
      ? jobLocation.includes(workerLocation) || workerLocation.includes(jobLocation)
      : false;
    const locationScore = locationMatches ? 20 : (jobLocation ? 8 : 5);

    const jobBudget = this.parseBudget(job);
    const budgetScore = maxBudget > 0
      ? Math.min(15, (jobBudget / maxBudget) * 15)
      : Math.min(15, jobBudget > 0 ? 10 + Math.min(jobBudget / 10000, 5) : 3);

    const urgencyMap: Record<string, number> = { low: 3, medium: 6, high: 10 };
    const urgencyScore = urgencyMap[this.normalizeText(job?.urgency)] || 4;

    const rating = Math.max(0, Math.min(5, Number(workerProfile?.rating) || 0));
    const experience = Math.max(0, Number(workerProfile?.experienceLevel ?? workerProfile?.experience ?? 0) || 0);
    const ratingExperienceScore = ((rating / 5) * 5) + Math.min(5, experience >= 10 ? 5 : experience * 0.5);

    const availability = this.normalizeText(workerProfile?.availability);
    const availabilityScore = availability.includes('now') || availability.includes('available') ? 5 : 2;

    const totalScore = Math.round(Math.max(0, Math.min(100,
      skillScore + locationScore + budgetScore + urgencyScore + ratingExperienceScore + availabilityScore,
    )));

    const reasons: string[] = [];
    if (skillMatches > 0) reasons.push(`Matches your skills in ${requiredSkills[0] || 'this category'}`);
    if (locationMatches) reasons.push(`Located near your area`);
    if (jobBudget > 0 && (maxBudget === jobBudget || jobBudget >= maxBudget * 0.8)) reasons.push('High budget job');
    if (this.normalizeText(job?.urgency) === 'high') reasons.push('Urgent requirement');
    if (availability.includes('now') || availability.includes('available')) reasons.push('Fits your current availability');

    const tag = locationMatches && skillMatches > 0
      ? 'Best Match'
      : locationMatches
        ? 'Nearby'
        : jobBudget >= maxBudget * 0.8
          ? 'High Paying'
          : this.normalizeText(job?.urgency) === 'high'
            ? 'Urgent'
            : 'Best Match';

    return { score: totalScore, reasons: reasons.slice(0, 4), tag };
  }

  async recommendJobs(workerProfile: any, jobs: any[], preference = '') {
    if (!Array.isArray(jobs) || jobs.length === 0) return [];

    const normalizedJobs = jobs
      .map((job: any) => ({
        id: String(job.id || job._id || ''),
        title: job.title || job.service || 'Untitled job',
        description: job.description || '',
        category: job.category || job.service || '',
        requiredSkills: Array.isArray(job.requiredSkills)
          ? job.requiredSkills
          : [job.requiredSkills || job.category || job.service].filter(Boolean),
        location: job.location || job.address || job.city || '',
        budget: this.parseBudget(job),
        urgency: job.urgency || 'medium',
      }))
      .filter((job: any) => job.id);

    if (normalizedJobs.length === 0) return [];

    const fallbackSorted = (() => {
      const maxBudget = Math.max(...normalizedJobs.map((job: any) => job.budget || 0), 0);
      return normalizedJobs
        .map((job: any) => {
          const scored = this.scoreFallbackJob(workerProfile, job, maxBudget);
          return {
            jobId: job.id,
            matchScore: scored.score,
            matchPercentage: `${scored.score}%`,
            reason: scored.reasons.length > 0 ? scored.reasons : ['Relevant job opportunity'],
            priorityTag: scored.tag,
          };
        })
        .sort((a: any, b: any) => b.matchScore - a.matchScore)
        .slice(0, 10);
    })();

    if (!this.genAI) return fallbackSorted;

    const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `
You are an intelligent job recommendation engine for a marketplace platform.

Your task is to analyze a worker profile and a list of available jobs, then return the best matching jobs ranked by relevance.

-------------------------------------

INPUT:

Worker Profile:
- Skills: ${JSON.stringify(workerProfile?.skills || workerProfile?.skill || [])}
- Location: ${JSON.stringify(workerProfile?.location || workerProfile?.city || workerProfile?.workerLocation || '')}
- Experience Level: ${JSON.stringify(workerProfile?.experienceLevel || workerProfile?.experience || 0)}
- Rating: ${JSON.stringify(workerProfile?.rating || 0)}
- Availability: ${JSON.stringify(workerProfile?.availability || workerProfile?.isAvailableNow || 'unknown')}

Jobs List:
${JSON.stringify(normalizedJobs, null, 2)}

Each job contains:
- id
- title
- description
- category
- requiredSkills
- location
- budget
- urgency (low, medium, high)

-------------------------------------

TASK:

1. For EACH job, calculate a match score (0–100) based on:

- Skill Match (40%)
  → Compare worker skills with requiredSkills

- Location Proximity (20%)
  → Closer jobs should score higher

- Budget Suitability (15%)
  → Jobs meeting or exceeding expectations rank higher

- Urgency (10%)
  → High urgency jobs should be boosted

- Worker Rating & Experience (10%)
  → Higher rating/experience increases match

- Availability (5%)
  → If worker is available now, increase score

2. Rank all jobs from highest to lowest score

3. Return ONLY top 10 jobs

-------------------------------------

OUTPUT FORMAT (STRICT JSON):

[
  {
    "jobId": "string",
    "matchScore": number,
    "matchPercentage": "85%",
    "reason": [
      "Matches your skills in AC repair",
      "Located 2 km from you",
      "High budget job",
      "Urgent requirement"
    ],
    "priorityTag": "Best Match | Nearby | High Paying | Urgent"
  }
]

-------------------------------------

RULES:

- Do NOT return explanations outside JSON
- Keep reasons short and user-friendly
- Ensure scores are realistic and varied
- Prefer highly relevant jobs over random ones
- If skills do not match at all, give very low score
- Use the worker's profile and the job list exactly as provided

${preference ? `
Extra worker preference note:
${JSON.stringify(preference)}
` : ''}
`;

    try {
      // Prevent long upstream AI latency from causing frontend timeouts.
      // If Gemini is slow, return deterministic fallback scores quickly.
      const aiTimeoutMs = 12000;
      const result = await Promise.race([
        model.generateContent(prompt),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error(`AI jobs recommendation timeout after ${aiTimeoutMs}ms`)), aiTimeoutMs),
        ),
      ]) as any;
      const response = await result.response;
      const text = response.text();
      const parsed = this.extractJsonArray(text);

      if (!Array.isArray(parsed)) {
        return fallbackSorted;
      }

      return parsed
        .map((item: any) => ({
          jobId: String(item.jobId || item.id || ''),
          matchScore: Number(item.matchScore) || 0,
          matchPercentage: String(item.matchPercentage || `${Number(item.matchScore) || 0}%`),
          reason: Array.isArray(item.reason) ? item.reason.slice(0, 4) : [],
          priorityTag: String(item.priorityTag || 'Best Match'),
        }))
        .filter((item: any) => item.jobId)
        .sort((a: any, b: any) => b.matchScore - a.matchScore)
        .slice(0, 10);
    } catch (error) {
      this.logger.error('Error getting AI job recommendations:', error);
      return fallbackSorted;
    }
  }
}
