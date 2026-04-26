import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum VerificationStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Schema({ timestamps: true, collection: 'workerprofiles' })
export class WorkerProfile extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  skill: string;

  @Prop()
  experience?: number;

  @Prop({ default: 0 })
  rating: number;

  @Prop({ default: 0 })
  reviewCount: number;

  @Prop()
  cnicFrontUrl?: string;

  @Prop()
  cnicBackUrl?: string;

  @Prop({ enum: VerificationStatus, default: VerificationStatus.PENDING })
  verificationStatus: VerificationStatus;

  @Prop({ default: false })
  verified: boolean;

  @Prop()
  verifiedAt?: Date;

  @Prop({
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number],
      default: [0, 0],
    },
  })
  location?: {
    type: string;
    coordinates: number[];
  };

  @Prop()
  workerAddress?: string;

  @Prop({ default: true })
  isAvailableNow: boolean;

  @Prop({
    type: {
      start: { type: String },
      end: { type: String },
    },
    _id: false,
  })
  workingHours?: {
    start?: string;
    end?: string;
  };

  @Prop()
  nextAvailableAt?: Date;

  @Prop({ default: 100 })
  responseRate: number;

  @Prop({ default: 10 })
  serviceRadiusKm: number;

  @Prop({ default: Date.now })
  lastActiveAt: Date;

  @Prop()
  locationUpdatedAt?: Date;

  @Prop({
    type: [
      {
        day: { type: String, required: true },
        enabled: { type: Boolean, default: true },
        start: { type: String, default: '09:00' },
        end: { type: String, default: '18:00' },
      },
    ],
    default: [
      { day: 'Monday', enabled: true, start: '09:00', end: '18:00' },
      { day: 'Tuesday', enabled: true, start: '09:00', end: '18:00' },
      { day: 'Wednesday', enabled: true, start: '09:00', end: '18:00' },
      { day: 'Thursday', enabled: true, start: '09:00', end: '18:00' },
      { day: 'Friday', enabled: true, start: '09:00', end: '18:00' },
      { day: 'Saturday', enabled: true, start: '09:00', end: '18:00' },
      { day: 'Sunday', enabled: false, start: '09:00', end: '18:00' },
    ],
  })
  weeklySchedule?: Array<{
    day: string;
    enabled: boolean;
    start: string;
    end: string;
  }>;
}

export const WorkerProfileSchema = SchemaFactory.createForClass(WorkerProfile);
WorkerProfileSchema.index({ userId: 1 });
WorkerProfileSchema.index({ location: '2dsphere' });
