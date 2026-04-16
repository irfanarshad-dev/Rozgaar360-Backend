import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export enum VerificationStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Schema({ timestamps: true, collection: 'workers' })
export class Worker extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  phone: string;

  @Prop({ required: true })
  password: string;

  @Prop({ default: 'worker' })
  role: string;

  @Prop({ required: true })
  city: string;

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

  @Prop({ default: '/user.png' })
  profilePicture?: string;
}

export const WorkerSchema = SchemaFactory.createForClass(Worker);
