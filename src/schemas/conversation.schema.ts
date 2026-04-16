import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Conversation extends Document {
  @Prop({ type: Types.ObjectId, required: true })
  jobId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true })
  workerId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true })
  customerId: Types.ObjectId;

  @Prop({ default: null })
  lastMessage?: string;

  @Prop({ default: null })
  lastMessageTime?: Date;

  @Prop({ type: Map, of: Number, default: {} })
  unreadCount: Map<string, number>;
}

export const ConversationSchema = SchemaFactory.createForClass(Conversation);
