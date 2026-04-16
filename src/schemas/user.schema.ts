import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum UserRole {
  WORKER = 'worker',
  CUSTOMER = 'customer',
  ADMIN = 'admin',
}

@Schema({ timestamps: true, collection: 'users' })
export class User extends Document {
  declare _id: Types.ObjectId;
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  phone: string;

  @Prop({ unique: true, sparse: true })
  email?: string;

  @Prop({ required: true })
  password: string;

  @Prop({ enum: ['worker', 'customer', 'admin'], required: true })
  role: string;

  @Prop({ required: true })
  city: string;

  @Prop({ default: '/user.png' })
  profilePicture: string;

  @Prop({ default: true })
  isActive: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);
UserSchema.index({ phone: 1 });
UserSchema.index({ role: 1 });
