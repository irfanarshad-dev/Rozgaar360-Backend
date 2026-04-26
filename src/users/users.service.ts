/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { v2 as cloudinary } from 'cloudinary';
import { User } from '../schemas/user.schema';
import { WorkerProfile } from '../schemas/worker-profile.schema';
import { CustomerProfile } from '../schemas/customer-profile.schema';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(WorkerProfile.name) private workerProfileModel: Model<WorkerProfile>,
    @InjectModel(CustomerProfile.name) private customerProfileModel: Model<CustomerProfile>,
  ) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  async getProfile(userId: string) {
    const user = await this.userModel.findById(userId).select('-password');
    if (!user) throw new NotFoundException('User not found');

    let profile = null;
    
    if (user.role === 'worker') {
      profile = await this.workerProfileModel.findOne({ userId });
    } else if (user.role === 'customer') {
      profile = await this.customerProfileModel.findOne({ userId });
    }

    return { ...user.toObject(), profile };
  }

  async updateProfile(userId: string, updateData: any) {
    try {
      const user = await this.userModel.findById(userId);
      if (!user) throw new NotFoundException('User not found');

      const {
        skill,
        experience,
        address,
        workerLatitude,
        workerLongitude,
        workerAddress,
        isAvailableNow,
        workStartTime,
        workEndTime,
        nextAvailableAt,
        responseRate,
        serviceRadiusKm,
        weeklySchedule,
        customerLatitude,
        customerLongitude,
        ...userFields
      } = updateData;
      
      const updatedUser = await this.userModel.findByIdAndUpdate(
        userId,
        userFields,
        { new: true }
      ).select('-password');

      if (user.role === 'worker') {
        const profileData = {};
        if (skill) profileData['skill'] = skill;
        if (experience !== undefined && experience !== '') {
          profileData['experience'] = parseInt(experience, 10);
        }
        if (workerAddress) profileData['workerAddress'] = workerAddress;

        if (isAvailableNow !== undefined) {
          profileData['isAvailableNow'] = isAvailableNow === true || isAvailableNow === 'true';
        }
        if (workStartTime || workEndTime) {
          profileData['workingHours'] = {
            start: workStartTime,
            end: workEndTime,
          };
        }
        if (nextAvailableAt) {
          profileData['nextAvailableAt'] = new Date(nextAvailableAt);
        }
        if (responseRate !== undefined && responseRate !== '') {
          profileData['responseRate'] = Number(responseRate);
        }
        if (serviceRadiusKm !== undefined && serviceRadiusKm !== '') {
          profileData['serviceRadiusKm'] = Number(serviceRadiusKm);
        }

        if (Array.isArray(weeklySchedule) && weeklySchedule.length > 0) {
          profileData['weeklySchedule'] = weeklySchedule.map((entry: any) => ({
            day: String(entry.day || '').trim(),
            enabled: entry.enabled === true || entry.enabled === 'true',
            start: String(entry.start || '09:00'),
            end: String(entry.end || '18:00'),
          })).filter((entry: any) => entry.day);
        }

        const hasValidWorkerLocation = Number.isFinite(workerLatitude) && Number.isFinite(workerLongitude)
          && Math.abs(Number(workerLatitude)) <= 90 && Math.abs(Number(workerLongitude)) <= 180;

        if (hasValidWorkerLocation) {
          profileData['location'] = {
            type: 'Point',
            coordinates: [Number(workerLongitude), Number(workerLatitude)],
          };
          profileData['locationUpdatedAt'] = new Date();
        }

        if (Object.keys(profileData).length > 0) {
          await this.workerProfileModel.findOneAndUpdate(
            { userId },
            profileData,
            { new: true }
          );
        }
      } else if (user.role === 'customer') {
        const customerProfileData = {};

        if (address) {
          customerProfileData['address'] = address;
        }

        const hasValidCustomerLocation = Number.isFinite(customerLatitude) && Number.isFinite(customerLongitude)
          && Math.abs(Number(customerLatitude)) <= 90 && Math.abs(Number(customerLongitude)) <= 180;

        if (hasValidCustomerLocation) {
          customerProfileData['location'] = {
            type: 'Point',
            coordinates: [Number(customerLongitude), Number(customerLatitude)],
          };
          customerProfileData['locationUpdatedAt'] = new Date();
        }

        if (Object.keys(customerProfileData).length > 0) {
          await this.customerProfileModel.findOneAndUpdate(
            { userId },
            customerProfileData,
            { new: true }
          );
        }
      }

      return this.getProfile(userId);
    } catch (error) {
      console.error('Update profile error:', error);
      throw new BadRequestException(error.message || 'Failed to update profile');
    }
  }

  async uploadProfilePhoto(userId: string, file: Express.Multer.File) {
    try {
      if (!file) {
        throw new BadRequestException('No file provided');
      }

      const result: any = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder: 'rozgaar360/profiles' },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        uploadStream.end(file.buffer);
      });

      const photoUrl = result.secure_url;
      
      await this.userModel.findByIdAndUpdate(
        userId,
        { profilePicture: photoUrl },
        { new: true }
      );

      return { profilePicture: photoUrl, message: 'Photo uploaded successfully' };
    } catch (error) {
      console.error('Upload error:', error);
      throw new BadRequestException(error.message || 'Failed to upload photo');
    }
  }

  async getWorker(workerId: string) {
    let user = await this.userModel.findById(workerId).select('-password');
    let profile: any = null;

    if (user && user.role === 'worker') {
      profile = await this.workerProfileModel.findOne({ userId: user._id });
      return { ...user.toObject(), profile };
    }

    // Fallback: allow worker profile id to be used in routes.
    profile = await this.workerProfileModel.findById(workerId).populate('userId', '-password');
    const profileUser: any = profile?.userId;

    if (!profileUser || profileUser.role !== 'worker') {
      throw new NotFoundException('Worker not found');
    }

    return { ...profileUser.toObject(), profile };
  }
}
