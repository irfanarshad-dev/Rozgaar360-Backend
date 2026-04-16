import { Controller, Post, Get, Body, Param, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ReviewService } from './review.service';
import { CreateReviewDto } from '../dto/review.dto';

@Controller('api/reviews')
export class ReviewController {
  constructor(private reviewService: ReviewService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  async createReview(@Request() req, @Body() createReviewDto: CreateReviewDto) {
    const userId = req.user._id.toString();
    return this.reviewService.createReview(userId, createReviewDto);
  }

  @Get('worker/:workerId')
  async getWorkerReviews(@Param('workerId') workerId: string) {
    return this.reviewService.getWorkerReviews(workerId);
  }
}
