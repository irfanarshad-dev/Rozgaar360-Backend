import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class LoginAttempt extends Document {
  @Prop({ required: true })
  phone: string;

  @Prop({ required: true })
  role: string;

  @Prop({ default: 0 })
  attempts: number;

  @Prop()
  lockedUntil?: Date;
}

export const LoginAttemptSchema = SchemaFactory.createForClass(LoginAttempt);
