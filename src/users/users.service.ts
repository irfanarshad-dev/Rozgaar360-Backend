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

      const { skill, experience, address, ...userFields } = updateData;
      
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
        
        if (Object.keys(profileData).length > 0) {
          await this.workerProfileModel.findOneAndUpdate(
            { userId },
            profileData,
            { new: true }
          );
        }
      } else if (user.role === 'customer') {
        if (address) {
          await this.customerProfileModel.findOneAndUpdate(
            { userId },
            { address },
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
    const user = await this.userModel.findById(workerId).select('-password');
    if (!user || user.role !== 'worker') {
      throw new NotFoundException('Worker not found');
    }

    const profile = await this.workerProfileModel.findOne({ userId: workerId });
    return { ...user.toObject(), profile };
  }
}
