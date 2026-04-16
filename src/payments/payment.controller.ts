import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PaymentService } from '../services/payment.service';

@Controller('api/payments')
@UseGuards(AuthGuard('jwt'))
export class PaymentController {
  constructor(private paymentService: PaymentService) {}

  @Post('create')
  async createPayment(@Body() body: { bookingId: string; paymentMethod: 'jazzcash' | 'cod' }) {
    return this.paymentService.createPayment(body.bookingId, body.paymentMethod);
  }

  @Post('jazzcash/callback')
  async jazzCashCallback(@Body() callbackData: any) {
    return this.paymentService.handleJazzCashCallback(callbackData);
  }

  @Post(':id/mark-paid')
  async markCODPaid(@Param('id') id: string) {
    return this.paymentService.markCODPaid(id);
  }

  @Get(':id')
  async getPayment(@Param('id') id: string) {
    return this.paymentService.getPayment(id);
  }

  @Get('booking/:bookingId')
  async getPaymentsByBooking(@Param('bookingId') bookingId: string) {
    return this.paymentService.getPaymentsByBooking(bookingId);
  }
}
