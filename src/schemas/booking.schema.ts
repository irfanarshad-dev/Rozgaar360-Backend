import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum BookingStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Schema({ timestamps: true })
export class Booking extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  customerId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  workerId: Types.ObjectId;

  @Prop({ required: true })
  service: string;

  @Prop({ required: true })
  date: Date;

  @Prop({ required: true })
  time: string;

  @Prop({ required: true })
  address: string;

  @Prop({ required: true })
  description: string;

  @Prop({ enum: BookingStatus, default: BookingStatus.PENDING })
  status: BookingStatus;

  @Prop({ type: Types.ObjectId, ref: 'Conversation' })
  conversationId?: Types.ObjectId;

  @Prop()
  estimatedCost?: number;

  @Prop({ default: 0 })
  platformFee?: number;

  @Prop({ default: 0 })
  totalAmount?: number;

  @Prop({ enum: ['pending', 'processing', 'completed', 'failed'], default: 'pending' })
  paymentStatus?: string;

  @Prop()
  completedAt?: Date;

  @Prop()
  cancelledAt?: Date;

  @Prop()
  cancellationReason?: string;
}

export const BookingSchema = SchemaFactory.createForClass(Booking);
BookingSchema.index({ customerId: 1, status: 1 });
BookingSchema.index({ workerId: 1, status: 1 });
