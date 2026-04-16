import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class PasswordReset extends Document {
  @Prop()
  phone?: string;

  @Prop()
  email?: string;

  @Prop({ required: true })
  token: string;

  @Prop()
  role?: string;

  @Prop({ required: true })
  expiresAt: Date;
}

export const PasswordResetSchema = SchemaFactory.createForClass(PasswordReset);
