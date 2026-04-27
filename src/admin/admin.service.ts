import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User } from '../schemas/user.schema';
import { WorkerProfile, VerificationStatus } from '../schemas/worker-profile.schema';
import { CustomerProfile } from '../schemas/customer-profile.schema';
import { Booking, BookingStatus } from '../schemas/booking.schema';
import { Review } from '../schemas/review.schema';
import { Payment } from '../schemas/payment.schema';
import { Category } from '../schemas/category.schema';
import { Conversation } from '../schemas/conversation.schema';
import { Message } from '../schemas/message.schema';
import { Notification } from '../schemas/notification.schema';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(WorkerProfile.name) private workerProfileModel: Model<WorkerProfile>,
    @InjectModel(CustomerProfile.name) private customerProfileModel: Model<CustomerProfile>,
    @InjectModel(Booking.name) private bookingModel: Model<Booking>,
    @InjectModel(Review.name) private reviewModel: Model<Review>,
    @InjectModel(Payment.name) private paymentModel: Model<Payment>,
    @InjectModel(Category.name) private categoryModel: Model<Category>,
    @InjectModel(Conversation.name) private conversationModel: Model<Conversation>,
    @InjectModel(Message.name) private messageModel: Model<Message>,
    @InjectModel(Notification.name) private notificationModel: Model<Notification>,
  ) {}

  private toObjectId(id: string) {
    return new Types.ObjectId(id);
  }

  private sanitizeDocument<T extends Record<string, any>>(doc: T | null): T | null {
    if (!doc) return null;
    const next = { ...doc };
    delete next.password;
    return next as T;
  }

  private listResponse<T>(data: T[], total: number, page: number, limit: number) {
    return { data, total, page, limit };
  }

  private resolveWorkerStatus(user: any, profile: any): 'pending' | 'active' | 'suspended' {
    if (!user?.isActive) return 'suspended';
    if (profile?.verificationStatus === VerificationStatus.APPROVED && profile?.verified) return 'active';
    return 'pending';
  }

  // USERS
  async getUsers(page = 1, limit = 20, search = '') {
    const safePage = Math.max(1, Number(page) || 1);
    const safeLimit = Math.max(1, Math.min(100, Number(limit) || 20));
    const skip = (safePage - 1) * safeLimit;

    const query: any = {};
    const term = String(search || '').trim();
    if (term) {
      const regex = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      query.$or = [
        { name: regex },
        { phone: regex },
        { email: regex },
        { city: regex },
        { role: regex },
      ];
    }

    const [users, total] = await Promise.all([
      this.userModel.find(query).select({ password: 0 }).sort({ createdAt: -1 }).skip(skip).limit(safeLimit).lean(),
      this.userModel.countDocuments(query),
    ]);

    return this.listResponse(users, total, safePage, safeLimit);
  }

  async toggleUserSuspend(userId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    if (user.role === 'admin') throw new BadRequestException('Cannot suspend admin user');

    user.isActive = !user.isActive;
    await user.save();

    const updated = await this.userModel.findById(userId).select({ password: 0 }).lean();
    return {
      message: `User is now ${updated?.isActive ? 'active' : 'suspended'}`,
      data: updated,
    };
  }

  async deleteUser(userId: string) {
    const user = await this.userModel.findById(userId).lean();
    if (!user) throw new NotFoundException('User not found');
    if (user.role === 'admin') throw new BadRequestException('Cannot delete admin user');

    if (user.role === 'worker') {
      await this.workerProfileModel.deleteOne({ userId: this.toObjectId(userId) });
    }
    if (user.role === 'customer') {
      await this.customerProfileModel.deleteOne({ userId: this.toObjectId(userId) });
    }

    await this.userModel.findByIdAndDelete(userId);

    return { message: 'User deleted successfully' };
  }

  // WORKERS
  async getWorkers(status: 'pending' | 'active' | 'suspended' | undefined, page = 1, limit = 20) {
    const safePage = Math.max(1, Number(page) || 1);
    const safeLimit = Math.max(1, Math.min(100, Number(limit) || 20));

    const workers = await this.userModel.find({ role: 'worker' }).select({ password: 0 }).sort({ createdAt: -1 }).lean();
    const workerIds = workers.map((w: any) => w._id);
    const profiles = await this.workerProfileModel.find({ userId: { $in: workerIds } }).lean();
    const profileMap = new Map(profiles.map((p: any) => [String(p.userId), p]));

    const merged = workers.map((worker: any) => {
      const profile = profileMap.get(String(worker._id));
      const workerStatus = this.resolveWorkerStatus(worker, profile);
      return { ...worker, profile, status: workerStatus };
    });

    const filtered = status ? merged.filter((w: any) => w.status === status) : merged;
    const total = filtered.length;
    const start = (safePage - 1) * safeLimit;
    const paged = filtered.slice(start, start + safeLimit);

    return this.listResponse(paged, total, safePage, safeLimit);
  }

  async approveWorker(workerId: string) {
    const worker = await this.userModel.findOne({ _id: workerId, role: 'worker' });
    if (!worker) throw new NotFoundException('Worker not found');

    worker.isActive = true;
    await worker.save();

    await this.workerProfileModel.findOneAndUpdate(
      { userId: this.toObjectId(workerId) },
      {
        verificationStatus: VerificationStatus.APPROVED,
        verified: true,
        verifiedAt: new Date(),
      },
      { new: true, upsert: false },
    );

    const updated = await this.userModel.findById(workerId).select({ password: 0 }).lean();
    return { message: 'Worker approved successfully', data: updated };
  }

  async suspendWorker(workerId: string) {
    const worker = await this.userModel.findOne({ _id: workerId, role: 'worker' });
    if (!worker) throw new NotFoundException('Worker not found');

    worker.isActive = false;
    await worker.save();

    await this.workerProfileModel.findOneAndUpdate(
      { userId: this.toObjectId(workerId) },
      {
        verificationStatus: VerificationStatus.REJECTED,
        verified: false,
      },
      { new: true },
    );

    const updated = await this.userModel.findById(workerId).select({ password: 0 }).lean();
    return { message: 'Worker suspended successfully', data: updated };
  }

  async deleteWorker(workerId: string) {
    const worker = await this.userModel.findOne({ _id: workerId, role: 'worker' }).lean();
    if (!worker) throw new NotFoundException('Worker not found');

    await this.workerProfileModel.deleteOne({ userId: this.toObjectId(workerId) });
    await this.userModel.findByIdAndDelete(workerId);

    return { message: 'Worker deleted successfully' };
  }

  // BOOKINGS
  async getBookings(page = 1, limit = 20, status?: string) {
    const safePage = Math.max(1, Number(page) || 1);
    const safeLimit = Math.max(1, Math.min(100, Number(limit) || 20));
    const skip = (safePage - 1) * safeLimit;

    const query: any = {};
    if (status) query.status = status;

    const [bookings, total] = await Promise.all([
      this.bookingModel
        .find(query)
        .populate('customerId', 'name phone city role')
        .populate('workerId', 'name phone city role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(safeLimit)
        .lean(),
      this.bookingModel.countDocuments(query),
    ]);

    return this.listResponse(bookings, total, safePage, safeLimit);
  }

  async getBookingById(bookingId: string) {
    const booking = await this.bookingModel
      .findById(bookingId)
      .populate('customerId', 'name phone city role')
      .populate('workerId', 'name phone city role')
      .populate('conversationId')
      .lean();

    if (!booking) throw new NotFoundException('Booking not found');
    return booking;
  }

  async cancelBooking(bookingId: string, reason?: string) {
    const booking = await this.bookingModel.findById(bookingId);
    if (!booking) throw new NotFoundException('Booking not found');

    booking.status = BookingStatus.CANCELLED;
    booking.cancelledAt = new Date();
    if (reason) booking.cancellationReason = reason;
    await booking.save();

    return {
      message: 'Booking cancelled successfully',
      data: await this.getBookingById(bookingId),
    };
  }

  // CATEGORIES
  async getCategories(page = 1, limit = 20, search = '') {
    const safePage = Math.max(1, Number(page) || 1);
    const safeLimit = Math.max(1, Math.min(100, Number(limit) || 20));
    const skip = (safePage - 1) * safeLimit;

    const query: any = {};
    const term = String(search || '').trim();
    if (term) {
      const regex = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      query.$or = [{ name: regex }, { description: regex }];
    }

    const [categories, total] = await Promise.all([
      this.categoryModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(safeLimit).lean(),
      this.categoryModel.countDocuments(query),
    ]);

    return this.listResponse(categories, total, safePage, safeLimit);
  }

  async createCategory(payload: { name: string; icon?: string; description?: string }) {
    const created = await this.categoryModel.create(payload);
    return created.toObject();
  }

  async updateCategory(id: string, payload: { name?: string; icon?: string; description?: string }) {
    const updated = await this.categoryModel.findByIdAndUpdate(id, payload, { new: true }).lean();
    if (!updated) throw new NotFoundException('Category not found');
    return updated;
  }

  async deleteCategory(id: string) {
    const deleted = await this.categoryModel.findByIdAndDelete(id).lean();
    if (!deleted) throw new NotFoundException('Category not found');
    return { message: 'Category deleted successfully' };
  }

  // REVIEWS
  async getReviews(page = 1, limit = 20) {
    const safePage = Math.max(1, Number(page) || 1);
    const safeLimit = Math.max(1, Math.min(100, Number(limit) || 20));
    const skip = (safePage - 1) * safeLimit;

    const [reviews, total] = await Promise.all([
      this.reviewModel
        .find()
        .populate('workerId', 'name phone city')
        .populate('customerId', 'name phone city')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(safeLimit)
        .lean(),
      this.reviewModel.countDocuments(),
    ]);

    return this.listResponse(reviews, total, safePage, safeLimit);
  }

  async deleteReview(reviewId: string) {
    const review = await this.reviewModel.findByIdAndDelete(reviewId).lean();
    if (!review) throw new NotFoundException('Review not found');
    return { message: 'Review deleted successfully' };
  }

  // DASHBOARD STATS
  async getStats() {
    const [
      totalUsers,
      totalWorkers,
      activeBookings,
      revenueResult,
      bookingsByCategory,
      recentBookings,
    ] = await Promise.all([
      this.userModel.countDocuments(),
      this.userModel.countDocuments({ role: 'worker' }),
      this.bookingModel.countDocuments({ status: { $in: ['pending', 'confirmed', 'in_progress'] } }),
      this.paymentModel.aggregate([
        { $match: { status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      this.bookingModel.aggregate([
        { $group: { _id: '$service', count: { $sum: 1 } } },
        { $project: { _id: 0, category: '$_id', count: 1 } },
        { $sort: { count: -1 } },
      ]),
      this.bookingModel
        .find()
        .populate('customerId', 'name phone city role')
        .populate('workerId', 'name phone city role')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
    ]);

    return {
      totalUsers,
      totalWorkers,
      activeBookings,
      totalRevenue: revenueResult?.[0]?.total || 0,
      bookingsByCategory,
      recentBookings,
    };
  }

  // Legacy compatibility (existing frontend)
  async getDashboardStats() {
    const stats = await this.getStats();

    const [totalCustomers, pendingVerifications, verifiedWorkers] = await Promise.all([
      this.userModel.countDocuments({ role: 'customer' }),
      this.workerProfileModel.countDocuments({ verificationStatus: VerificationStatus.PENDING }),
      this.workerProfileModel.countDocuments({ verified: true }),
    ]);

    return {
      ...stats,
      totalCustomers,
      pendingVerifications,
      verifiedWorkers,
    };
  }

  async getPendingVerifications() {
    return this.workerProfileModel
      .find({
        verificationStatus: VerificationStatus.PENDING,
      })
      .populate('userId', '-password')
      .sort({ createdAt: -1 })
      .lean();
  }

  async verifyUser(userId: string, status: 'approved' | 'rejected') {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    if (user.role !== 'worker') throw new BadRequestException('Only workers can be verified');

    const updatedProfile = await this.workerProfileModel.findOneAndUpdate(
      { userId: this.toObjectId(userId) },
      {
        verificationStatus: status === 'approved' ? VerificationStatus.APPROVED : VerificationStatus.REJECTED,
        verified: status === 'approved',
        verifiedAt: status === 'approved' ? new Date() : null,
      },
      { new: true },
    ).populate('userId', '-password');

    if (status === 'approved') {
      user.isActive = true;
      await user.save();
    }

    return {
      message: `Worker ${status} successfully`,
      profile: updatedProfile,
    };
  }

  // Generic DB CRUD used by existing dashboard panel
  private getModelByCollection(collection: string): Model<any> {
    switch (collection) {
      case 'users':
        return this.userModel;
      case 'worker-profiles':
        return this.workerProfileModel;
      case 'customer-profiles':
        return this.customerProfileModel;
      case 'bookings':
        return this.bookingModel;
      case 'conversations':
        return this.conversationModel;
      case 'messages':
        return this.messageModel;
      case 'notifications':
        return this.notificationModel;
      case 'reviews':
        return this.reviewModel;
      case 'payments':
        return this.paymentModel;
      case 'categories':
        return this.categoryModel;
      default:
        throw new BadRequestException(`Unsupported collection: ${collection}`);
    }
  }

  private sanitizePayload(payload: Record<string, any>) {
    const clean = { ...(payload || {}) };
    delete clean._id;
    delete clean.__v;
    delete clean.createdAt;
    delete clean.updatedAt;
    return clean;
  }

  async listCollection(collection: string, page = 1, limit = 20, search = '') {
    const model = this.getModelByCollection(collection);
    const safePage = Math.max(1, Number(page) || 1);
    const safeLimit = Math.max(1, Math.min(100, Number(limit) || 20));
    const skip = (safePage - 1) * safeLimit;

    const query: any = {};
    const term = String(search || '').trim();
    if (term) {
      const regex = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      query.$or = [{ _id: /^[a-f\d]{24}$/i.test(term) ? this.toObjectId(term) : undefined }].filter(Boolean);
      if (!query.$or.length) delete query.$or;
      query.$or = [
        ...(query.$or || []),
        { name: regex },
        { title: regex },
        { message: regex },
        { status: regex },
        { type: regex },
        { service: regex },
      ];
    }

    const [items, total] = await Promise.all([
      model.find(query).sort({ createdAt: -1 }).skip(skip).limit(safeLimit).lean(),
      model.countDocuments(query),
    ]);

    const safeItems = collection === 'users'
      ? items.map((item: any) => this.sanitizeDocument(item))
      : items;

    return {
      collection,
      data: safeItems,
      items: safeItems,
      total,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.max(1, Math.ceil(total / safeLimit)),
    };
  }

  async createCollectionDocument(collection: string, payload: Record<string, any>) {
    const model = this.getModelByCollection(collection);
    const data = this.sanitizePayload(payload);

    if (collection === 'users' && data.password) {
      data.password = await bcrypt.hash(String(data.password), 10);
    }

    const created = await model.create(data);
    const createdObj = created.toObject ? created.toObject() : created;

    return collection === 'users' ? this.sanitizeDocument(createdObj) : createdObj;
  }

  async updateCollectionDocument(collection: string, id: string, payload: Record<string, any>) {
    const model = this.getModelByCollection(collection);
    const data = this.sanitizePayload(payload);

    if (collection === 'users' && data.password) {
      data.password = await bcrypt.hash(String(data.password), 10);
    }

    const updated: any = await model.findByIdAndUpdate(id, data, { new: true }).lean();
    if (!updated) throw new NotFoundException('Document not found');

    return collection === 'users' ? this.sanitizeDocument(updated) : updated;
  }

  async deleteCollectionDocument(collection: string, id: string) {
    if (collection === 'users') return this.deleteUser(id);
    if (collection === 'workers') return this.deleteWorker(id);

    const model = this.getModelByCollection(collection);
    const deleted = await model.findByIdAndDelete(id).lean();
    if (!deleted) throw new NotFoundException('Document not found');

    return { message: 'Document deleted successfully', collection, id };
  }
}
