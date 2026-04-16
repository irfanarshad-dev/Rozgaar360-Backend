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
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      default: [0, 0]
    }
  })
  location?: {
    type: string;
    coordinates: number[];
  };
}

export const WorkerProfileSchema = SchemaFactory.createForClass(WorkerProfile);
WorkerProfileSchema.index({ userId: 1 });
WorkerProfileSchema.index({ location: '2dsphere' });
