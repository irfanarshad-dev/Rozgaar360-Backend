import { Controller, Get, Query } from '@nestjs/common';
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
    @Query('maxDistance') maxDistance?: string,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 3;
    const latNum = lat ? parseFloat(lat) : undefined;
    const lngNum = lng ? parseFloat(lng) : undefined;
    const maxDistNum = maxDistance ? parseInt(maxDistance, 10) : 50000;
    
    return this.recommendationsService.getRecommendations(
      city,
      skill,
      limitNum,
      latNum,
      lngNum,
      maxDistNum
    );
  }
}