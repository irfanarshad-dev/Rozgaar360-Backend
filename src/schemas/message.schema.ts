import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum MessageStatus {
  SENT = 'sent',
  DELIVERED = 'delivered',
  SEEN = 'seen',
}

export enum MessageType {
  TEXT = 'text',
  FILE = 'file',
  VOICE = 'voice',
  MIXED = 'mixed',
}

export enum FileType {
  IMAGE = 'image',
  PDF = 'pdf',
  DOC = 'doc',
  OTHER = 'other',
}

@Schema({ _id: false })
export class Reaction {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  emoji: string;

  @Prop({ default: Date.now })
  createdAt: Date;
}

@Schema({ _id: false })
export class ReadReceipt {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ default: Date.now })
  readAt: Date;
}

@Schema({ timestamps: true })
export class Message extends Document {
  @Prop({ type: Types.ObjectId, required: true })
  conversationId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true })
  senderId: Types.ObjectId;

  @Prop()
  senderName?: string;

  @Prop({ default: false })
  deletedForEveryone?: boolean;

  @Prop({ type: [Types.ObjectId], default: [] })
  deletedFor?: Types.ObjectId[];

  @Prop({ default: '' })
  text: string;

  @Prop({ default: MessageStatus.SENT })
  status: MessageStatus;

  @Prop({ type: [String], default: [] })
  fileUrls?: string[];

  @Prop({ default: null })
  seenAt?: Date;

  // New fields for enhanced features
  @Prop({ type: String, enum: MessageType, default: MessageType.TEXT })
  messageType: MessageType;

  // File sharing
  @Prop()
  fileUrl?: string;

  @Prop()
  fileName?: string;

  @Prop()
  fileSize?: number;

  @Prop({ type: String, enum: FileType })
  fileType?: FileType;

  // Voice message
  @Prop()
  voiceUrl?: string;

  @Prop()
  voiceDuration?: number;

  // Reactions
  @Prop({ type: [Reaction], default: [] })
  reactions: Reaction[];

  // Read receipts
  @Prop({ type: [ReadReceipt], default: [] })
  readBy: ReadReceipt[];

  // Reply to message
  @Prop({ type: Types.ObjectId, ref: 'Message' })
  replyTo?: Types.ObjectId;

  @Prop()
  createdAt?: Date;

  @Prop()
  updatedAt?: Date;
}

export const MessageSchema = SchemaFactory.createForClass(Message);

// Add indexes for search and performance
MessageSchema.index({ conversationId: 1, createdAt: -1 });
MessageSchema.index({ text: 'text', fileName: 'text' });
MessageSchema.index({ 'readBy.userId': 1 });
