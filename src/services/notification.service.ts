import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Notification, NotificationType } from '../schemas/notification.schema';

@Injectable()
export class NotificationService {
  constructor(
    @InjectModel(Notification.name) private notificationModel: Model<Notification>,
  ) {}

  async createNotification(data: {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    bookingId?: string;
    conversationId?: string;
    actionUrl?: string;
    metadata?: Record<string, any>;
  }) {
    return this.notificationModel.create({
      userId: new Types.ObjectId(data.userId),
      type: data.type,
      title: data.title,
      message: data.message,
      bookingId: data.bookingId ? new Types.ObjectId(data.bookingId) : undefined,
      conversationId: data.conversationId ? new Types.ObjectId(data.conversationId) : undefined,
      actionUrl: data.actionUrl,
      metadata: data.metadata,
      isRead: false,
    });
  }

  async getUserNotifications(userId: string, limit = 50) {
    return this.notificationModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('bookingId', 'service date time status')
      .lean();
  }

  async getUnreadCount(userId: string) {
    return this.notificationModel.countDocuments({
      userId: new Types.ObjectId(userId),
      isRead: false,
    });
  }

  async markAsRead(notificationId: string, userId: string) {
    return this.notificationModel.findOneAndUpdate(
      { _id: new Types.ObjectId(notificationId), userId: new Types.ObjectId(userId) },
      { isRead: true },
      { new: true },
    );
  }

  async markAllAsRead(userId: string) {
    return this.notificationModel.updateMany(
      { userId: new Types.ObjectId(userId), isRead: false },
      { isRead: true },
    );
  }

  async deleteNotification(notificationId: string, userId: string) {
    return this.notificationModel.findOneAndDelete({
      _id: new Types.ObjectId(notificationId),
      userId: new Types.ObjectId(userId),
    });
  }
}
