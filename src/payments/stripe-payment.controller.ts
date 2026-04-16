import { Controller, Get, Query, Post, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { StripePaymentService } from './stripe-payment.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Payment } from '../schemas/payment.schema';
import { Booking } from '../schemas/booking.schema';
import { NotificationService } from '../services/notification.service';
import { NotificationType } from '../schemas/notification.schema';

@Controller('api/payment')
export class StripePaymentController {
  constructor(
    private readonly stripeService: StripePaymentService,
    @InjectModel(Payment.name) private paymentModel: Model<Payment>,
    @InjectModel(Booking.name) private bookingModel: Model<Booking>,
    private notificationService: NotificationService,
  ) {}

  @Get('checkout')
  @UseGuards(AuthGuard('jwt'))
  async createCheckout(@Query('bookingId') bookingId: string) {
    const booking = await this.bookingModel.findById(bookingId);
    if (!booking) {
      throw new Error('Booking not found');
    }

    if (!booking.totalAmount || booking.totalAmount === 0) {
      throw new Error('Worker has not set the amount yet. Please wait for the worker to accept and set the price.');
    }

    const amount = booking.totalAmount;
    const session = await this.stripeService.createCheckoutSession(bookingId, amount);

    return {
      sessionId: session.id,
      url: session.url,
    };
  }

  @Post('verify')
  async verifyPayment(@Body() body: { sessionId: string; bookingId: string }) {
    const session = await this.stripeService.verifySession(body.sessionId);

    if (session.payment_status === 'paid') {
      const booking = await this.bookingModel.findById(body.bookingId);
      
      // Update payment record with amount
      await this.paymentModel.findOneAndUpdate(
        { bookingId: body.bookingId },
        {
          status: 'completed',
          transactionId: session.payment_intent as string,
          paymentMethod: 'stripe',
          amount: booking?.totalAmount || (session.amount_total || 0) / 100,
          customerId: booking?.customerId,
          workerId: booking?.workerId,
        },
        { upsert: true, new: true },
      );

      // Update booking status
      await this.bookingModel.findByIdAndUpdate(body.bookingId, {
        status: 'confirmed',
      });
      
      if (booking) {
        // Notify worker about payment received
        await this.notificationService.createNotification({
          userId: booking.workerId.toString(),
          type: NotificationType.PAYMENT_RECEIVED,
          title: 'Payment Received',
          message: `Payment of $${(booking.totalAmount || 0).toFixed(2)} received for ${booking.service}`,
          bookingId: body.bookingId,
          actionUrl: `/worker/bookings/${body.bookingId}`,
          metadata: { amount: booking.totalAmount || 0 },
        });
      }

      return { success: true, message: 'Payment verified successfully' };
    }

    return { success: false, message: 'Payment not completed' };
  }
}
