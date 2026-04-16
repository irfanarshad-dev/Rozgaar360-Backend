import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { VerificationModule } from './verification/verification.module';
import { AdminModule } from './admin/admin.module';
import { RecommendationsModule } from './recommendations/recommendations.module';
import { ChatModule } from './chat/chat.module';
import { BookingModule } from './bookings/booking.module';
import { ReviewModule } from './reviews/review.module';
import { PaymentModule } from './payments/payment.module';
import { NotificationModule } from './notifications/notification.module';
import { Test, TestSchema } from './schemas/test.schema';

@Module({
  imports: [
    ConfigModule.forRoot(),
    MongooseModule.forRoot(process.env.MONGODB_URI!),
    MongooseModule.forFeature([{ name: Test.name, schema: TestSchema }]),
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 10,
    }]),
    AuthModule,
    UsersModule,
    VerificationModule,
    AdminModule,
    RecommendationsModule,
    ChatModule,
    BookingModule,
    ReviewModule,
    PaymentModule,
    NotificationModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
