import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BookingService } from './booking.service';
import { BookingController } from './booking.controller';
import { Booking, BookingSchema } from '../schemas/booking.schema';
import { Conversation, ConversationSchema } from '../schemas/conversation.schema';
import { User, UserSchema } from '../schemas/user.schema';
import { NotificationModule } from '../notifications/notification.module';
import { EmailService } from '../services/email.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Booking.name, schema: BookingSchema },
      { name: Conversation.name, schema: ConversationSchema },
      { name: User.name, schema: UserSchema },
    ]),
    NotificationModule,
  ],
  controllers: [BookingController],
  providers: [BookingService, EmailService],
  exports: [BookingService],
})
export class BookingModule {}
