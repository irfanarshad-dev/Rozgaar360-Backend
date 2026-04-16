import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../schemas/user.schema';
import { WorkerProfile, VerificationStatus } from '../schemas/worker-profile.schema';
import { CustomerProfile } from '../schemas/customer-profile.schema';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(WorkerProfile.name) private workerProfileModel: Model<WorkerProfile>,
    @InjectModel(CustomerProfile.name) private customerProfileModel: Model<CustomerProfile>,
  ) {}

  async getPendingVerifications() {
    const pendingProfiles = await this.workerProfileModel.find({
      verificationStatus: VerificationStatus.PENDING,
      $or: [
        { cnicFrontUrl: { $exists: true, $ne: null } },
        { cnicBackUrl: { $exists: true, $ne: null } }
      ]
    }).populate('userId', '-password');

    console.log(`Found ${pendingProfiles.length} pending verifications`);
    return pendingProfiles;
  }

  async getAllUsers() {
    const users = await this.userModel.find().select('-password').sort({ createdAt: -1 });
    const userIds = users.map(u => u._id);
    
    // Get all profiles
    const workerProfiles = await this.workerProfileModel.find({ userId: { $in: userIds } });
    const customerProfiles = await this.customerProfileModel.find({ userId: { $in: userIds } });
    
    return users.map(user => {
      const userObj = user.toObject();
      if (user.role === 'worker') {
        userObj['profile'] = workerProfiles.find(p => p.userId.toString() === user._id.toString());
      } else if (user.role === 'customer') {
        userObj['profile'] = customerProfiles.find(p => p.userId.toString() === user._id.toString());
      }
      return userObj;
    });
  }

  async getAllWorkers() {
    const workers = await this.userModel.find({ role: 'worker' }).select('-password');
    const workerIds = workers.map(w => (w._id as any));
    const profiles = await this.workerProfileModel.find({ userId: { $in: workerIds } });
    
    return workers.map(worker => ({
      ...worker.toObject(),
      profile: profiles.find(p => p.userId.toString() === (worker._id as any).toString())
    }));
  }

  async verifyUser(userId: string, status: 'approved' | 'rejected') {
    console.log(`[Admin] Verifying user with ID: ${userId}, status: ${status}`);
    
    // Try to find user by ID
    let user = await this.userModel.findById(userId);
    let workerProfile: any = null;
    
    if (user) {
      console.log(`[Admin] Found user: ${user.name}, role: ${user.role}`);
      
      if (user.role !== 'worker') {
        throw new NotFoundException('Only workers can be verified');
      }
      
      // Find worker profile
      workerProfile = await this.workerProfileModel.findOne({ userId: user._id });
      console.log(`[Admin] Worker profile found: ${workerProfile ? 'Yes' : 'No'}`);
    } else {
      console.log(`[Admin] User not found with ID: ${userId}, trying as profile ID...`);
      
      // Maybe it's a profile ID, try to find profile
      const profile = await this.workerProfileModel.findById(userId).populate('userId');
      
      if (profile && profile.userId) {
        workerProfile = profile;
        user = profile.userId as any;
        console.log(`[Admin] Found via profile ID. User: ${user?.name || 'Unknown'}`);
      }
    }

    if (!user) {
      console.error(`[Admin] User not found for ID: ${userId}`);
      throw new NotFoundException('User not found');
    }

    if (!workerProfile) {
      console.error(`[Admin] Worker profile not found for user: ${user._id}`);
      throw new NotFoundException('Worker profile not found');
    }

    const updateData: any = {
      verificationStatus: status === 'approved' ? VerificationStatus.APPROVED : VerificationStatus.REJECTED,
    };

    if (status === 'approved') {
      updateData.verified = true;
      updateData.verifiedAt = new Date();
    } else {
      updateData.verified = false;
      updateData.verifiedAt = null;
    }

    const updatedProfile = await this.workerProfileModel.findOneAndUpdate(
      { userId: user._id },
      updateData,
      { new: true }
    ).populate('userId', '-password');

    console.log(`[Admin] Worker ${user._id} ${status} successfully`);

    return {
      message: `Worker ${status} successfully`,
      profile: updatedProfile,
    };
  }

  async getDashboardStats() {
    const totalUsers = await this.userModel.countDocuments();
    const totalWorkers = await this.userModel.countDocuments({ role: 'worker' });
    const totalCustomers = await this.userModel.countDocuments({ role: 'customer' });
    const pendingVerifications = await this.workerProfileModel.countDocuments({ 
      verificationStatus: VerificationStatus.PENDING 
    });
    const verifiedWorkers = await this.workerProfileModel.countDocuments({ 
      verified: true 
    });

    return {
      totalUsers,
      totalWorkers,
      totalCustomers,
      pendingVerifications,
      verifiedWorkers,
    };
  }

  async deleteUser(userId: string) {
    console.log(`Admin deleting user ${userId}`);
    
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Prevent deleting admin users
    if (user.role === 'admin') {
      throw new BadRequestException('Cannot delete admin users');
    }

    // Delete associated profiles
    if (user.role === 'worker') {
      await this.workerProfileModel.deleteOne({ userId });
    } else if (user.role === 'customer') {
      await this.customerProfileModel.deleteOne({ userId });
    }

    // Delete the user
    await this.userModel.findByIdAndDelete(userId);

    console.log(`User ${userId} deleted successfully`);

    return {
      message: 'User deleted successfully',
      userId,
    };
  }
}
