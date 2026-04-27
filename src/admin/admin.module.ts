import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { User, UserSchema } from '../schemas/user.schema';
import { WorkerProfile, WorkerProfileSchema } from '../schemas/worker-profile.schema';
import { CustomerProfile, CustomerProfileSchema } from '../schemas/customer-profile.schema';
import { Booking, BookingSchema } from '../schemas/booking.schema';
import { Conversation, ConversationSchema } from '../schemas/conversation.schema';
import { Message, MessageSchema } from '../schemas/message.schema';
import { Notification, NotificationSchema } from '../schemas/notification.schema';
import { Review, ReviewSchema } from '../schemas/review.schema';
import { Payment, PaymentSchema } from '../schemas/payment.schema';
import { Category, CategorySchema } from '../schemas/category.schema';
import { RolesGuard } from './roles.guard';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: WorkerProfile.name, schema: WorkerProfileSchema },
      { name: CustomerProfile.name, schema: CustomerProfileSchema },
      { name: Booking.name, schema: BookingSchema },
      { name: Conversation.name, schema: ConversationSchema },
      { name: Message.name, schema: MessageSchema },
      { name: Notification.name, schema: NotificationSchema },
      { name: Review.name, schema: ReviewSchema },
      { name: Payment.name, schema: PaymentSchema },
      { name: Category.name, schema: CategorySchema },
    ]),
  ],
  controllers: [AdminController],
  providers: [AdminService, RolesGuard],
  exports: [AdminService],
})
export class AdminModule {}
