import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum MessageStatus {
  SENT = 'sent',
  DELIVERED = 'delivered',
  SEEN = 'seen',
}

@Schema({ timestamps: true })
export class Message extends Document {
  @Prop({ type: Types.ObjectId, required: true })
  conversationId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true })
  senderId: Types.ObjectId;

  @Prop({ required: true })
  text: string;

  @Prop({ default: MessageStatus.SENT })
  status: MessageStatus;

  @Prop({ type: [String], default: [] })
  fileUrls?: string[];

  @Prop({ default: null })
  seenAt?: Date;

  @Prop()
  createdAt?: Date;

  @Prop()
  updatedAt?: Date;
}

export const MessageSchema = SchemaFactory.createForClass(Message);
