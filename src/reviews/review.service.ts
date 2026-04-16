import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Review } from '../schemas/review.schema';
import { Booking } from '../schemas/booking.schema';
import { WorkerProfile } from '../schemas/worker-profile.schema';
import { User } from '../schemas/user.schema';
import { CreateReviewDto } from '../dto/review.dto';

@Injectable()
export class ReviewService {
  constructor(
    @InjectModel(Review.name) private reviewModel: Model<Review>,
    @InjectModel(Booking.name) private bookingModel: Model<Booking>,
    @InjectModel(WorkerProfile.name) private workerProfileModel: Model<WorkerProfile>,
    @InjectModel(User.name) private userModel: Model<User>,
  ) {}

  async createReview(customerId: string, createReviewDto: CreateReviewDto) {
    console.log('[ReviewService] Creating review for booking:', createReviewDto.bookingId);
    
    // Verify booking exists and is completed
    const booking = await this.bookingModel.findById(createReviewDto.bookingId);
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.customerId.toString() !== customerId) {
      throw new ForbiddenException('You can only review your own bookings');
    }

    if (booking.status !== 'completed') {
      throw new BadRequestException('You can only review completed bookings');
    }

    // Check if review already exists
    const existingReview = await this.reviewModel.findOne({
      workerId: booking.workerId,
      customerId: new Types.ObjectId(customerId),
      // You might want to link to booking to prevent multiple reviews per booking
    });

    if (existingReview) {
      throw new BadRequestException('You have already reviewed this worker');
    }

    // Get customer name
    const customer = await this.userModel.findById(customerId);
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    // Create review
    const review = await this.reviewModel.create({
      workerId: booking.workerId,
      customerId: new Types.ObjectId(customerId),
      rating: createReviewDto.rating,
      comment: createReviewDto.comment,
      customerName: customer.name,
    });

    console.log('[ReviewService] Review created:', review._id);

    // Update worker profile rating
    await this.updateWorkerRating(booking.workerId.toString());

    return review;
  }

  async updateWorkerRating(workerId: string) {
    console.log('[ReviewService] Updating rating for worker:', workerId);
    
    // Get all reviews for this worker
    const reviews = await this.reviewModel.find({ workerId: new Types.ObjectId(workerId) });
    
    if (reviews.length === 0) {
      console.log('[ReviewService] No reviews found');
      return;
    }

    // Calculate average rating
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / reviews.length;
    const reviewCount = reviews.length;

    console.log('[ReviewService] Average rating:', averageRating, 'Count:', reviewCount);

    // Update worker profile
    await this.workerProfileModel.findOneAndUpdate(
      { userId: new Types.ObjectId(workerId) },
      {
        rating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
        reviewCount: reviewCount,
      }
    );

    console.log('[ReviewService] Worker profile updated');
  }

  async getWorkerReviews(workerId: string) {
    return this.reviewModel
      .find({ workerId: new Types.ObjectId(workerId) })
      .sort({ createdAt: -1 })
      .lean();
  }
}
