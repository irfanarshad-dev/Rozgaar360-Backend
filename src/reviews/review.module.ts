import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ReviewService } from './review.service';
import { ReviewController } from './review.controller';
import { Review, ReviewSchema } from '../schemas/review.schema';
import { Booking, BookingSchema } from '../schemas/booking.schema';
import { WorkerProfile, WorkerProfileSchema } from '../schemas/worker-profile.schema';
import { User, UserSchema } from '../schemas/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Review.name, schema: ReviewSchema },
      { name: Booking.name, schema: BookingSchema },
      { name: WorkerProfile.name, schema: WorkerProfileSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [ReviewController],
  providers: [ReviewService],
  exports: [ReviewService],
})
export class ReviewModule {}
