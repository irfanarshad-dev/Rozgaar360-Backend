import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { RecommendationsService } from './recommendations.service';

@Controller('api/recommendations')
export class RecommendationsController {
  constructor(private recommendationsService: RecommendationsService) {}

  @Get()
  async getRecommendations(
    @Query('city') city?: string,
    @Query('skill') skill?: string,
    @Query('limit') limit?: string,
    @Query('lat') lat?: string,
    @Query('lng') lng?: string,
    @Query('radiusKm') radiusKm?: string,
    @Query('maxDistance') maxDistance?: string,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 10;
    const latNum = lat ? parseFloat(lat) : undefined;
    const lngNum = lng ? parseFloat(lng) : undefined;

    // Backward compatibility for old maxDistance (meters) clients.
    const radiusFromMeters = maxDistance ? Number((parseInt(maxDistance, 10) / 1000).toFixed(2)) : undefined;
    const radiusKmNum = radiusKm ? parseFloat(radiusKm) : radiusFromMeters;

    return this.recommendationsService.getRecommendations(
      city,
      skill,
      limitNum,
      latNum,
      lngNum,
      radiusKmNum,
    );
  }

  @Get('ai')
  async getAIRecommendations(
    @Query('query') query: string,
    @Query('city') city?: string,
    @Query('lat') lat?: string,
    @Query('lng') lng?: string,
    @Query('radiusKm') radiusKm?: string,
  ) {
    const latNum = lat ? parseFloat(lat) : undefined;
    const lngNum = lng ? parseFloat(lng) : undefined;
    const radiusKmNum = radiusKm ? parseFloat(radiusKm) : undefined;
    return this.recommendationsService.getAIRecommendations(query, city, latNum, lngNum, radiusKmNum);
  }

  @Post('jobs/ai')
  async getAIJobRecommendations(
    @Body() body: {
      workerProfile: any;
      jobs: any[];
      preference?: string;
    },
  ) {
    return this.recommendationsService.getAIJobRecommendations(
      body.workerProfile,
      body.jobs,
      body.preference,
    );
  }
}