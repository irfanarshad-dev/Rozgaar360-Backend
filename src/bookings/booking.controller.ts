import { Controller, Post, Get, Put, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { BookingService } from './booking.service';
import { CreateBookingDto, UpdateBookingStatusDto } from '../dto/booking.dto';

@Controller('api/bookings')
@UseGuards(AuthGuard('jwt'))
export class BookingController {
  constructor(private bookingService: BookingService) {}

  @Post()
  async createBooking(@Request() req, @Body() createBookingDto: CreateBookingDto) {
    const userId = req.user._id.toString();
    console.log('[BookingController] User from JWT:', userId, 'Role:', req.user.role);
    return this.bookingService.createBooking(userId, createBookingDto);
  }

  @Get('my-bookings')
  async getMyBookings(@Request() req, @Query('status') status?: string) {
    const userId = req.user._id.toString();
    if (req.user.role === 'customer') {
      return this.bookingService.getCustomerBookings(userId, status);
    } else if (req.user.role === 'worker') {
      return this.bookingService.getWorkerBookings(userId, status);
    }
    return [];
  }

  @Get(':id')
  async getBookingById(@Param('id') id: string, @Request() req) {
    const userId = req.user._id.toString();
    console.log('[BookingController] Getting booking:', id, 'for user:', userId);
    return this.bookingService.getBookingById(id, userId);
  }

  @Put(':id/status')
  async updateBookingStatus(
    @Param('id') id: string,
    @Request() req,
    @Body() updateDto: UpdateBookingStatusDto,
  ) {
    const userId = req.user._id.toString();
    return this.bookingService.updateBookingStatus(id, userId, updateDto);
  }

  @Put(':id')
  async updateBooking(
    @Param('id') id: string,
    @Request() req,
    @Body() updateDto: { estimatedCost?: number },
  ) {
    const userId = req.user._id.toString();
    return this.bookingService.updateBooking(id, userId, updateDto);
  }
}
