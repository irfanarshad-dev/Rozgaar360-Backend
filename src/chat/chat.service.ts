import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Conversation } from '../schemas/conversation.schema';
import { Message, MessageType } from '../schemas/message.schema';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(Conversation.name) private conversationModel: Model<Conversation>,
    @InjectModel(Message.name) private messageModel: Model<Message>,
  ) {}

  async getOrCreateConversation(jobId: string, workerId: string, customerId: string) {
    // First try to find existing conversation between worker and customer (regardless of jobId)
    let conversation = await this.conversationModel.findOne({
      workerId: new Types.ObjectId(workerId),
      customerId: new Types.ObjectId(customerId),
    });

    if (!conversation) {
      conversation = await this.conversationModel.create({
        jobId: jobId ? new Types.ObjectId(jobId) : null,
        workerId: new Types.ObjectId(workerId),
        customerId: new Types.ObjectId(customerId),
        unreadCount: new Map(),
      });
    }

    return conversation;
  }

  async saveMessage(conversationId: string, senderId: string, text: string, fileUrls?: string[], messageData?: any) {
    console.log('[ChatService] saveMessage called with:', {
      conversationId,
      senderId,
      text,
      fileUrls,
      messageData,
    });

    // Get sender name from User model
    const sender = await this.conversationModel.findById(conversationId)
      .populate('workerId', 'name')
      .populate('customerId', 'name');
    
    let senderName = 'Unknown';
    if (sender) {
      const workerIdStr = sender.workerId?._id?.toString() || sender.workerId?.toString();
      const customerIdStr = sender.customerId?._id?.toString() || sender.customerId?.toString();
      
      if (workerIdStr === senderId) {
        senderName = (sender.workerId as any)?.name || 'Worker';
      } else if (customerIdStr === senderId) {
        senderName = (sender.customerId as any)?.name || 'Customer';
      }
    }

    const messageDoc: any = {
      conversationId: new Types.ObjectId(conversationId),
      senderId: new Types.ObjectId(senderId),
      senderName,
      text: text || '',
      fileUrls: fileUrls || [],
      status: 'sent',
    };

    // Explicitly set file fields if provided
    if (messageData) {
      if (messageData.messageType) messageDoc.messageType = messageData.messageType;
      if (messageData.fileUrl) messageDoc.fileUrl = messageData.fileUrl;
      if (messageData.fileName) messageDoc.fileName = messageData.fileName;
      if (messageData.fileSize) messageDoc.fileSize = messageData.fileSize;
      if (messageData.fileType) messageDoc.fileType = messageData.fileType;
      if (messageData.voiceUrl) messageDoc.voiceUrl = messageData.voiceUrl;
      if (messageData.voiceDuration) messageDoc.voiceDuration = messageData.voiceDuration;
    }

    console.log('[ChatService] Creating message with:', messageDoc);

    const message = await this.messageModel.create(messageDoc);

    console.log('[ChatService] Message created:', message.toObject());

    const lastMsg = text || messageData?.fileName || 'File' || 'Voice message';
    await this.conversationModel.findByIdAndUpdate(conversationId, {
      lastMessage: lastMsg,
      lastMessageTime: new Date(),
    });

    return message;
  }

  async getMessages(conversationId: string, limit = 50, skip = 0) {
    const messages = await this.messageModel
      .find({ conversationId: new Types.ObjectId(conversationId) })
      .sort({ createdAt: 1 })
      .limit(limit)
      .skip(skip)
      .lean();
    
    return messages.map(msg => ({
      ...msg,
      _id: msg._id.toString(),
      conversationId: msg.conversationId.toString(),
      senderId: msg.senderId.toString(),
    }));
  }

  async markMessageAsSeen(messageId: string) {
    return this.messageModel.findByIdAndUpdate(
      messageId,
      { status: 'seen', seenAt: new Date() },
      { new: true },
    );
  }

  async getConversationById(conversationId: string) {
    const conversation = await this.conversationModel
      .findById(conversationId)
      .populate('workerId', 'name email profilePicture')
      .populate('customerId', 'name email profilePicture');
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
      .populate('workerId', 'name email profilePicture')
      .populate('customerId', 'name email profilePicture')
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

  async addReaction(messageId: string, userId: string, emoji: string) {
    const message = await this.messageModel.findById(messageId);
    if (!message) throw new NotFoundException('Message not found');

    const existingReactionIndex = message.reactions.findIndex(
      (r) => r.userId.toString() === userId,
    );

    if (existingReactionIndex >= 0) {
      const existingEmoji = message.reactions[existingReactionIndex].emoji;
      if (existingEmoji === emoji) {
        // Remove reaction (toggle off)
        message.reactions.splice(existingReactionIndex, 1);
      } else {
        // Replace with new emoji
        message.reactions[existingReactionIndex].emoji = emoji;
        message.reactions[existingReactionIndex].createdAt = new Date();
      }
    } else {
      // Add new reaction
      message.reactions.push({
        userId: new Types.ObjectId(userId),
        emoji,
        createdAt: new Date(),
      });
    }

    await message.save();
    return message;
  }

  async markMessagesAsRead(conversationId: string, userId: string) {
    const messages = await this.messageModel.find({
      conversationId: new Types.ObjectId(conversationId),
      senderId: { $ne: new Types.ObjectId(userId) },
    });

    let count = 0;
    for (const message of messages) {
      const alreadyRead = message.readBy.some(
        (r) => r.userId.toString() === userId,
      );
      if (!alreadyRead) {
        message.readBy.push({
          userId: new Types.ObjectId(userId),
          readAt: new Date(),
        });
        await message.save();
        count++;
      }
    }

    return { success: true, count };
  }

  async searchMessages(conversationId: string, query: string, limit = 20) {
    const messages = await this.messageModel
      .find({
        conversationId: new Types.ObjectId(conversationId),
        $or: [
          { text: { $regex: query, $options: 'i' } },
          { fileName: { $regex: query, $options: 'i' } },
        ],
      })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return {
      messages: messages.map((msg) => ({
        ...msg,
        _id: msg._id.toString(),
        conversationId: msg.conversationId.toString(),
        senderId: msg.senderId.toString(),
      })),
      total: messages.length,
    };
  }

  async deleteMessage(messageId: string, userId: string, deleteForEveryone: boolean) {
    const message = await this.messageModel.findById(messageId);
    if (!message) throw new NotFoundException('Message not found');

    if (message.senderId.toString() !== userId) {
      throw new NotFoundException('You can only delete your own messages');
    }

    if (deleteForEveryone) {
      message.deletedForEveryone = true;
      message.text = '';
      message.fileUrl = undefined;
      message.fileName = undefined;
      message.voiceUrl = undefined;
    } else {
      if (!message.deletedFor) message.deletedFor = [];
      if (!message.deletedFor.some(id => id.toString() === userId)) {
        message.deletedFor.push(new Types.ObjectId(userId));
      }
    }

    await message.save();
    return { success: true, message };
  }
}
