import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Conversation } from '../schemas/conversation.schema';
import { Message } from '../schemas/message.schema';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(Conversation.name) private conversationModel: Model<Conversation>,
    @InjectModel(Message.name) private messageModel: Model<Message>,
  ) {}

  async getOrCreateConversation(jobId: string, workerId: string, customerId: string) {
    let conversation = await this.conversationModel.findOne({
      jobId: new Types.ObjectId(jobId),
      workerId: new Types.ObjectId(workerId),
      customerId: new Types.ObjectId(customerId),
    });

    if (!conversation) {
      conversation = await this.conversationModel.create({
        jobId: new Types.ObjectId(jobId),
        workerId: new Types.ObjectId(workerId),
        customerId: new Types.ObjectId(customerId),
        unreadCount: new Map(),
      });
    }

    return conversation;
  }

  async saveMessage(conversationId: string, senderId: string, text: string, fileUrls?: string[]) {
    const message = await this.messageModel.create({
      conversationId: new Types.ObjectId(conversationId),
      senderId: new Types.ObjectId(senderId),
      text,
      fileUrls: fileUrls || [],
      status: 'sent',
    });

    await this.conversationModel.findByIdAndUpdate(conversationId, {
      lastMessage: text,
      lastMessageTime: new Date(),
    });

    return message;
  }

  async getMessages(conversationId: string, limit = 50, skip = 0) {
    return this.messageModel
      .find({ conversationId: new Types.ObjectId(conversationId) })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .lean();
  }

  async markMessageAsSeen(messageId: string) {
    return this.messageModel.findByIdAndUpdate(
      messageId,
      { status: 'seen', seenAt: new Date() },
      { new: true },
    );
  }

  async getConversationById(conversationId: string) {
    const conversation = await this.conversationModel.findById(conversationId);
    if (!conversation) throw new NotFoundException('Conversation not found');
    return conversation;
  }

  async getConversations(userId: string) {
    return this.conversationModel
      .find({
        $or: [
          { workerId: new Types.ObjectId(userId) },
          { customerId: new Types.ObjectId(userId) },
        ],
      })
      .sort({ lastMessageTime: -1 })
      .lean();
  }

  async updateUnreadCount(conversationId: string, userId: string, count: number) {
    const conversation = await this.conversationModel.findById(conversationId);
    if (!conversation) throw new NotFoundException('Conversation not found');

    conversation.unreadCount.set(userId, count);
    return conversation.save();
  }

  async resetUnreadCount(conversationId: string, userId: string) {
    return this.updateUnreadCount(conversationId, userId, 0);
  }
}
