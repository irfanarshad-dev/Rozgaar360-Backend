import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { WorkerProfile } from '../schemas/worker-profile.schema';
import { AIService } from '../ai/ai.service';

const DEFAULT_RADIUS_KM = 5;
const FALLBACK_RADIUS_KM = [5, 10, 20, 50];

@Injectable()
export class RecommendationsService {
  constructor(
    @InjectModel(WorkerProfile.name) private workerProfileModel: Model<WorkerProfile>,
    private aiService: AIService,
  ) {}

  private hasValidCoordinates(lat?: number, lng?: number): boolean {
    return Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat as number) <= 90 && Math.abs(lng as number) <= 180;
  }

  private toMeters(radiusKm?: number): number {
    const km = Number.isFinite(radiusKm) && (radiusKm as number) > 0 ? (radiusKm as number) : DEFAULT_RADIUS_KM;
    return Math.round(km * 1000);
  }

  private buildRadiusLadder(radiusKm?: number): number[] {
    const baseRadius = Number.isFinite(radiusKm) && (radiusKm as number) > 0 ? Math.round(radiusKm as number) : DEFAULT_RADIUS_KM;
    const ladder = [baseRadius, ...FALLBACK_RADIUS_KM];
    return Array.from(new Set(ladder)).sort((a, b) => a - b);
  }

  private scoreWorker(worker: any): number {
    const rating = Math.max(0, Math.min(5, Number(worker.rating) || 0));
    const reviewCount = Math.max(0, Number(worker.reviewCount) || 0);
    const experience = Math.max(0, Number(worker.experience) || 0);
    const responseRate = Math.max(0, Math.min(100, Number(worker.responseRate) || 0));
    const serviceRadiusKm = Math.max(1, Number(worker.serviceRadiusKm) || 10);

    const ratingScore = (rating / 5) * 35;
    const reviewConfidenceScore = Math.min(reviewCount / 50, 1) * 10;
    const experienceScore = Math.min(experience / 15, 1) * 15;
    const availabilityScore = worker.isAvailableNow ? 15 : 3;
    const responseScore = (responseRate / 100) * 10;

    let distanceScore = 15;
    if (typeof worker.distanceKm === 'number') {
      const normalizedDistance = Math.max(0, 1 - worker.distanceKm / Math.max(serviceRadiusKm, 1));
      distanceScore = normalizedDistance * 15;
    }

    return Number((ratingScore + reviewConfidenceScore + experienceScore + availabilityScore + responseScore + distanceScore).toFixed(2));
  }

  private normalizeScore(score: unknown): number {
    const numeric = Number(score);
    if (!Number.isFinite(numeric)) return 0;
    if (numeric <= 1) return Number((numeric * 100).toFixed(2));
    return Number(Math.max(0, Math.min(100, numeric)).toFixed(2));
  }

  private computeQueryRelevance(worker: any, query: string): number {
    const normalizedQuery = (query || '').toLowerCase().trim();
    if (!normalizedQuery) return 50;

    const tokens = normalizedQuery
      .split(/\s+/)
      .map((token) => token.trim())
      .filter((token) => token.length > 1);

    const haystack = [
      worker.skill,
      worker.city,
      worker.workerAddress,
      worker.name,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    const matchedTokens = tokens.filter((token) => haystack.includes(token)).length;
    const tokenCoverage = tokens.length > 0 ? matchedTokens / tokens.length : 0;

    let relevance = 35 + tokenCoverage * 45;

    if (/near|nearby|closest|close/.test(normalizedQuery) && typeof worker.distanceKm === 'number') {
      const distanceBonus = Math.max(0, 1 - worker.distanceKm / 25) * 20;
      relevance += distanceBonus;
    }

    if (/urgent|asap|today|now/.test(normalizedQuery) && worker.isAvailableNow) {
      relevance += 8;
    }

    return Number(Math.max(0, Math.min(100, relevance)).toFixed(2));
  }

  private buildSmartAIScore(worker: any, query: string, aiScoreRaw: unknown): number {
    const aiScore = this.normalizeScore(aiScoreRaw);
    const deterministicScore = this.normalizeScore(worker.deterministicScore);
    const queryRelevance = this.computeQueryRelevance(worker, query);

    const composite = aiScore * 0.5 + deterministicScore * 0.3 + queryRelevance * 0.2;
    return Number(composite.toFixed(2));
  }

  private sortByRealDistance(a: any, b: any): number {
    const aHasDistance = typeof a.distanceKm === 'number';
    const bHasDistance = typeof b.distanceKm === 'number';

    if (aHasDistance && bHasDistance) {
      const distanceDelta = a.distanceKm - b.distanceKm;
      if (Math.abs(distanceDelta) > 0.01) {
        return distanceDelta;
      }
    } else if (aHasDistance) {
      return -1;
    } else if (bHasDistance) {
      return 1;
    }

    return b.deterministicScore - a.deterministicScore;
  }

  private mapWorker(profile: any, includeDistance = false) {
    const worker: any = {
      id: profile.userId._id,
      name: profile.userId.name,
      phone: profile.userId.phone,
      email: profile.userId.email,
      city: profile.userId.city,
      profilePicture: profile.userId.profilePicture,
      skill: profile.skill,
      experience: profile.experience,
      rating: profile.rating,
      reviewCount: profile.reviewCount,
      verified: profile.verified,
      verificationStatus: profile.verificationStatus,
      location: profile.location,
      workerAddress: profile.workerAddress,
      isAvailableNow: profile.isAvailableNow,
      workingHours: profile.workingHours,
      nextAvailableAt: profile.nextAvailableAt,
      responseRate: profile.responseRate,
      serviceRadiusKm: profile.serviceRadiusKm,
      locationUpdatedAt: profile.locationUpdatedAt,
    };

    if (includeDistance && profile.distanceMeters !== undefined) {
      worker.distanceKm = Number((profile.distanceMeters / 1000).toFixed(2));
    }

    worker.deterministicScore = this.scoreWorker(worker);
    return worker;
  }

  private async getFallbackRecommendations(baseQuery: any, city: string | undefined, safeLimit: number) {
    const fallbackProfiles = await this.workerProfileModel
      .find({
        ...baseQuery,
      })
      .sort({ isAvailableNow: -1, rating: -1, reviewCount: -1, responseRate: -1 })
      .limit(safeLimit * 4)
      .populate('userId', '-password');

    return fallbackProfiles
      .filter((profile: any) => profile.userId)
      .map((profile: any) => this.mapWorker(profile))
      .filter((worker: any) => (!city ? true : worker.city === city))
      .sort((a: any, b: any) => b.deterministicScore - a.deterministicScore)
      .slice(0, safeLimit);
  }

  async getRecommendations(
    city?: string,
    skill?: string,
    limit = 10,
    lat?: number,
    lng?: number,
    radiusKm = DEFAULT_RADIUS_KM,
  ) {
    const safeLimit = Math.max(1, Math.min(limit, 100));
    const hasCoordinates = this.hasValidCoordinates(lat, lng);

    const baseQuery: any = {
      verified: true,
      verificationStatus: 'approved',
    };

    if (skill) {
      baseQuery.skill = skill;
    }

    let selectedWorkers: any[] = [];

    if (hasCoordinates) {
      const radiusLadder = this.buildRadiusLadder(radiusKm);

      for (const km of radiusLadder) {
        const nearbyWorkers = await this.workerProfileModel
          .aggregate([
            {
              $geoNear: {
                near: {
                  type: 'Point',
                  coordinates: [lng as number, lat as number],
                },
                distanceField: 'distanceMeters',
                maxDistance: this.toMeters(km),
                spherical: true,
                query: {
                  ...baseQuery,
                  'location.coordinates.0': { $ne: 0 },
                  'location.coordinates.1': { $ne: 0 },
                },
              },
            },
            { $limit: safeLimit * 6 },
          ])
          .exec();

        if (nearbyWorkers.length > 0) {
          selectedWorkers = nearbyWorkers;
          break;
        }
      }
    }

    if (selectedWorkers.length === 0) {
      return this.getFallbackRecommendations(baseQuery, city, safeLimit);
    }

    const ids = selectedWorkers.map((worker: any) => worker._id);
    const hydratedProfiles = await this.workerProfileModel
      .find({ _id: { $in: ids } })
      .populate('userId', '-password');

    const hydratedMap = new Map(hydratedProfiles.map((profile: any) => [profile._id.toString(), profile]));

    const nearestWorkers = selectedWorkers
      .map((rawWorker: any) => {
        const profile = hydratedMap.get(rawWorker._id.toString());
        if (!profile || !profile.userId) {
          return null;
        }

        profile.distanceMeters = rawWorker.distanceMeters;
        return this.mapWorker(profile, true);
      })
      .filter((worker: any) => worker)
      .filter((worker: any) => (!city ? true : worker.city === city))
      .sort((a: any, b: any) => this.sortByRealDistance(a, b))
      .slice(0, safeLimit);

    if (nearestWorkers.length === 0) {
      return this.getFallbackRecommendations(baseQuery, city, safeLimit);
    }

    return nearestWorkers;
  }

  async getAIRecommendations(query: string, city?: string, lat?: number, lng?: number, radiusKm = DEFAULT_RADIUS_KM) {
    const baseWorkers = await this.getRecommendations(city, undefined, 60, lat, lng, radiusKm);

    if (baseWorkers.length === 0) {
      return [];
    }

    const aiMatches = await this.aiService.recommendWorkers(query, baseWorkers);

    if (!Array.isArray(aiMatches) || aiMatches.length === 0) {
      return [];
    }

    const aiMap = new Map(aiMatches.map((match: any) => [String(match.id), match]));

    return baseWorkers
      .map((worker: any) => {
        const aiMatch = aiMap.get(String(worker.id));
        const aiScore = this.normalizeScore(aiMatch?.matchScore ?? worker.deterministicScore);
        const finalScore = this.buildSmartAIScore(worker, query, aiScore);

        return {
          ...worker,
          aiReason: aiMatch?.aiReason || 'Good fit based on skill relevance and recent platform performance signals.',
          aiMatchScore: aiScore,
          matchScore: finalScore,
        };
      })
      .sort((a: any, b: any) => b.matchScore - a.matchScore)
      .slice(0, 10);
  }

  async getAIJobRecommendations(workerProfile: any, jobs: any[], preference = '') {
    return this.aiService.recommendJobs(workerProfile, jobs, preference);
  }
}
