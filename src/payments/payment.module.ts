import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PaymentController } from './payment.controller';
import { PaymentService } from '../services/payment.service';
import { StripePaymentController } from './stripe-payment.controller';
import { StripePaymentService } from './stripe-payment.service';
import { Payment, PaymentSchema } from '../schemas/payment.schema';
import { Booking, BookingSchema } from '../schemas/booking.schema';
import { NotificationModule } from '../notifications/notification.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Payment.name, schema: PaymentSchema },
      { name: Booking.name, schema: BookingSchema },
    ]),
    NotificationModule,
  ],
  controllers: [PaymentController, StripePaymentController],
  providers: [PaymentService, StripePaymentService],
  exports: [PaymentService, StripePaymentService],
})
export class PaymentModule {}
