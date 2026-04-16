import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum NotificationType {
  BOOKING_CREATED = 'booking_created',
  BOOKING_CONFIRMED = 'booking_confirmed',
  BOOKING_REJECTED = 'booking_rejected',
  BOOKING_STARTED = 'booking_started',
  BOOKING_COMPLETED = 'booking_completed',
  BOOKING_CANCELLED = 'booking_cancelled',
  PAYMENT_RECEIVED = 'payment_received',
  PAYMENT_PENDING = 'payment_pending',
  NEW_MESSAGE = 'new_message',
  AMOUNT_SET = 'amount_set',
  REVIEW_RECEIVED = 'review_received',
}

@Schema({ timestamps: true })
export class Notification extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true, enum: NotificationType })
  type: NotificationType;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  message: string;

  @Prop({ type: Types.ObjectId, ref: 'Booking' })
  bookingId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Conversation' })
  conversationId?: Types.ObjectId;

  @Prop({ default: false })
  isRead: boolean;

  @Prop()
  actionUrl?: string;

  @Prop({ type: Object })
  metadata?: Record<string, any>;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
NotificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
