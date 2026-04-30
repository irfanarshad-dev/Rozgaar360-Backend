import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Booking, BookingStatus } from '../schemas/booking.schema';
import { Conversation } from '../schemas/conversation.schema';
import { User } from '../schemas/user.schema';
import { CreateBookingDto, UpdateBookingStatusDto } from '../dto/booking.dto';
import { NotificationService } from '../services/notification.service';
import { NotificationType } from '../schemas/notification.schema';

@Injectable()
export class BookingService {
  constructor(
    @InjectModel(Booking.name) private bookingModel: Model<Booking>,
    @InjectModel(Conversation.name) private conversationModel: Model<Conversation>,
    @InjectModel(User.name) private userModel: Model<User>,
    private notificationService: NotificationService,
  ) {}

  async createBooking(customerId: string, createBookingDto: CreateBookingDto) {
    console.log('[BookingService] Creating booking for customer:', customerId);
    console.log('[BookingService] Booking data:', createBookingDto);
    
    const worker = await this.userModel.findById(createBookingDto.workerId);
    if (!worker || worker.role !== 'worker') {
      throw new NotFoundException('Worker not found');
    }

    const booking = await this.bookingModel.create({
      customerId: new Types.ObjectId(customerId),
      workerId: new Types.ObjectId(createBookingDto.workerId),
      service: createBookingDto.service,
      date: new Date(createBookingDto.date),
      time: createBookingDto.time,
      address: createBookingDto.address,
      description: createBookingDto.description,
      estimatedCost: createBookingDto.estimatedCost,
      status: BookingStatus.PENDING,
    });

    console.log('[BookingService] Booking created with ID:', booking._id);
    console.log('[BookingService] Customer ID in booking:', booking.customerId.toString());

    const conversation = await this.conversationModel.create({
      jobId: booking._id,
      workerId: new Types.ObjectId(createBookingDto.workerId),
      customerId: new Types.ObjectId(customerId),
      unreadCount: new Map(),
    });

    booking.conversationId = conversation._id as Types.ObjectId;
    await booking.save();

    // Notify worker about new booking
    const customer = await this.userModel.findById(customerId);
    await this.notificationService.createNotification({
      userId: createBookingDto.workerId,
      type: NotificationType.BOOKING_CREATED,
      title: 'New Booking Request',
      message: `You have a new booking request for ${createBookingDto.service}`,
      bookingId: (booking._id as any).toString(),
      actionUrl: `/worker/bookings/${booking._id}`,
      metadata: {
        customerName: customer?.name || 'Customer',
        service: createBookingDto.service,
        date: createBookingDto.date,
      },
    });

    return this.bookingModel
      .findById(booking._id)
      .populate('workerId', 'name phone profilePicture city')
      .populate('customerId', 'name phone')
      .lean();
  }

  async getCustomerBookings(customerId: string, status?: string) {
    const query: any = { customerId: new Types.ObjectId(customerId) };
    if (status) {
      query.status = status;
    }

    return this.bookingModel
      .find(query)
      .populate('workerId', 'name phone profilePicture city skill')
      .populate('conversationId')
      .sort({ createdAt: -1 })
      .lean();
  }

  async getWorkerBookings(workerId: string, status?: string) {
    const query: any = { workerId: new Types.ObjectId(workerId) };
    if (status) {
      query.status = status;
    }

    return this.bookingModel
      .find(query)
      .populate('customerId', 'name phone profilePicture')
      .populate('conversationId')
      .sort({ createdAt: -1 })
      .lean();
  }

  async getAvailableJobs(skill?: string) {
    const query: any = { status: BookingStatus.PENDING };
    
    if (skill) {
      query.service = { $regex: new RegExp(skill, 'i') };
    }

    return this.bookingModel
      .find(query)
      .populate('customerId', 'name phone profilePicture city')
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();
  }

  async getBookingById(bookingId: string, userId: string) {
    console.log('[BookingService] Getting booking:', bookingId, 'for user:', userId);
    
    const booking = await this.bookingModel
      .findById(bookingId)
      .populate('workerId', 'name phone profilePicture city skill')
      .populate('customerId', 'name phone profilePicture')
      .populate('conversationId')
      .lean();

    console.log('[BookingService] Found booking:', booking ? 'Yes' : 'No');

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    const extractId = (value: any): string | null => {
      if (!value) return null;
      if (typeof value === 'object' && value._id) return String(value._id);
      return String(value);
    };

    const customerIdStr = extractId(booking.customerId);
    const workerIdStr = extractId(booking.workerId);

    if (!customerIdStr) {
      console.error('[BookingService] Invalid booking customer reference:', {
        bookingId,
        customerId: booking.customerId,
      });
      throw new NotFoundException('Booking has invalid customer reference');
    }

    console.log('[BookingService] Access check - Customer:', customerIdStr, 'Worker:', workerIdStr, 'User:', userId, 'Status:', booking.status);

    // Allow access if:
    // 1. User is the customer
    // 2. User is the assigned worker
    // 3. Booking is pending (for job opportunities - any worker can view)
    const isCustomer = customerIdStr === userId;
    const isAssignedWorker = workerIdStr && workerIdStr === userId;
    const isPendingJob = booking.status === BookingStatus.PENDING;

    if (!isCustomer && !isAssignedWorker && !isPendingJob) {
      throw new ForbiddenException('Access denied');
    }

    return booking;
  }

  async updateBookingStatus(
    bookingId: string,
    userId: string,
    updateDto: UpdateBookingStatusDto,
  ) {
    const booking = await this.bookingModel.findById(bookingId);

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (
      booking.customerId.toString() !== userId &&
      booking.workerId.toString() !== userId
    ) {
      throw new ForbiddenException('Access denied');
    }

    booking.status = updateDto.status as BookingStatus;

    if (updateDto.status === 'confirmed') {
      // Notify customer that booking is confirmed
      await this.notificationService.createNotification({
        userId: booking.customerId.toString(),
        type: NotificationType.BOOKING_CONFIRMED,
        title: 'Booking Confirmed',
        message: `Your booking for ${booking.service} has been confirmed by the worker`,
        bookingId: bookingId,
        actionUrl: `/customer/bookings/${bookingId}`,
      });
    }

    if (updateDto.status === 'in_progress') {
      // Notify customer that work has started
      await this.notificationService.createNotification({
        userId: booking.customerId.toString(),
        type: NotificationType.BOOKING_STARTED,
        title: 'Work Started',
        message: `The worker has started working on your ${booking.service} booking`,
        bookingId: bookingId,
        actionUrl: `/customer/bookings/${bookingId}`,
      });
    }

    if (updateDto.status === 'completed') {
      booking.completedAt = new Date();
      // Notify customer that work is completed
      await this.notificationService.createNotification({
        userId: booking.customerId.toString(),
        type: NotificationType.BOOKING_COMPLETED,
        title: 'Work Completed',
        message: `Your ${booking.service} booking has been completed. Please leave a review!`,
        bookingId: bookingId,
        actionUrl: `/customer/reviews/new/${bookingId}`,
      });
    }

    if (updateDto.status === 'cancelled') {
      booking.cancelledAt = new Date();
      booking.cancellationReason = updateDto.cancellationReason;
      
      // Notify the other party about cancellation
      const notifyUserId = booking.workerId.toString() === userId 
        ? booking.customerId.toString() 
        : booking.workerId.toString();
      
      await this.notificationService.createNotification({
        userId: notifyUserId,
        type: NotificationType.BOOKING_CANCELLED,
        title: 'Booking Cancelled',
        message: `The booking for ${booking.service} has been cancelled`,
        bookingId: bookingId,
        actionUrl: userId === booking.workerId.toString() ? `/worker/bookings` : `/customer/bookings`,
        metadata: { reason: updateDto.cancellationReason },
      });
    }

    await booking.save();

    return this.bookingModel
      .findById(bookingId)
      .populate('workerId', 'name phone profilePicture city skill')
      .populate('customerId', 'name phone profilePicture')
      .populate('conversationId')
      .lean();
  }

  async updateBooking(
    bookingId: string,
    userId: string,
    updateDto: { estimatedCost?: number },
  ) {
    const booking = await this.bookingModel.findById(bookingId);

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.workerId.toString() !== userId) {
      throw new ForbiddenException('Only worker can update booking details');
    }

    if (updateDto.estimatedCost !== undefined) {
      const PLATFORM_FEE_PERCENTAGE = 0.15; // 15% platform fee
      const platformFee = updateDto.estimatedCost * PLATFORM_FEE_PERCENTAGE;
      const totalAmount = updateDto.estimatedCost + platformFee;
      
      booking.estimatedCost = updateDto.estimatedCost;
      booking.platformFee = platformFee;
      booking.totalAmount = totalAmount;
      
      // Notify customer about amount set
      await this.notificationService.createNotification({
        userId: booking.customerId.toString(),
        type: NotificationType.AMOUNT_SET,
        title: 'Service Amount Set',
        message: `The worker has set the amount for your ${booking.service} booking: $${updateDto.estimatedCost} (+ $${platformFee.toFixed(2)} platform fee = $${totalAmount.toFixed(2)} total)`,
        bookingId: bookingId,
        actionUrl: `/payment?bookingId=${bookingId}`,
        metadata: { 
          amount: updateDto.estimatedCost,
          platformFee: platformFee,
          totalAmount: totalAmount,
        },
      });
    }

    await booking.save();

    return this.bookingModel
      .findById(bookingId)
      .populate('workerId', 'name phone profilePicture city skill')
      .populate('customerId', 'name phone profilePicture')
      .populate('conversationId')
      .lean();
  }
}
