import { Injectable, NotFoundException, BadRequestException, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { v2 as cloudinary } from 'cloudinary';
import { WorkerProfile, VerificationStatus } from '../schemas/worker-profile.schema';
import { User } from '../schemas/user.schema';

@Injectable()
export class VerificationService implements OnModuleInit {
  constructor(
    @InjectModel(WorkerProfile.name) private workerProfileModel: Model<WorkerProfile>,
    @InjectModel(User.name) private userModel: Model<User>,
  ) {}

  onModuleInit() {
    // Initialize Cloudinary configuration
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    console.log('Cloudinary configured:', {
      cloud_name: process.env.CLOUDINARY_NAME,
      api_key: process.env.CLOUDINARY_API_KEY ? '***' : 'missing',
      api_secret: process.env.CLOUDINARY_API_SECRET ? '***' : 'missing',
    });
  }

  async uploadCNIC(userId: string, files: { cnicFront: Express.Multer.File[], cnicBack: Express.Multer.File[] }) {
    console.log('Upload CNIC called for user:', userId);
    console.log('Files received:', {
      front: files.cnicFront ? files.cnicFront[0]?.originalname : 'missing',
      back: files.cnicBack ? files.cnicBack[0]?.originalname : 'missing',
    });

    // Check if user exists
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if user is a worker
    if (user.role !== 'worker') {
      throw new BadRequestException('Only workers can upload CNIC');
    }

    // Find or create worker profile
    let workerProfile = await this.workerProfileModel.findOne({ userId });
    if (!workerProfile) {
      throw new NotFoundException('Worker profile not found');
    }

    // Check if CNIC already submitted and pending
    if (workerProfile.cnicFrontUrl && workerProfile.cnicBackUrl) {
      if (workerProfile.verificationStatus === VerificationStatus.PENDING) {
        throw new BadRequestException('You have already submitted a request, please wait for any response.');
      }
      // Allow re-upload if rejected
      if (workerProfile.verificationStatus === VerificationStatus.REJECTED) {
        console.log('Re-uploading CNIC after rejection');
      }
    }

    if (!files.cnicFront || !files.cnicBack || !files.cnicFront[0] || !files.cnicBack[0]) {
      throw new BadRequestException('Both CNIC front and back images are required');
    }

    // Validate file size (2MB limit)
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (files.cnicFront[0].size > maxSize || files.cnicBack[0].size > maxSize) {
      throw new BadRequestException('File size must be less than 2MB');
    }

    // Validate file types
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(files.cnicFront[0].mimetype) || 
        !allowedTypes.includes(files.cnicBack[0].mimetype)) {
      throw new BadRequestException('Only JPEG, JPG and PNG files are allowed');
    }

    try {
      console.log('Uploading to Cloudinary...');
      // Upload to Cloudinary
      const frontUpload = await this.uploadToCloudinary(files.cnicFront[0], `cnic_front_${userId}`) as any;
      const backUpload = await this.uploadToCloudinary(files.cnicBack[0], `cnic_back_${userId}`) as any;

      console.log('Cloudinary upload successful');

      // Update worker profile
      const updatedProfile = await this.workerProfileModel.findOneAndUpdate(
        { userId },
        {
          cnicFrontUrl: frontUpload.secure_url,
          cnicBackUrl: backUpload.secure_url,
          verificationStatus: VerificationStatus.PENDING,
        },
        { new: true }
      );

      return {
        message: 'CNIC uploaded successfully',
        verificationStatus: VerificationStatus.PENDING,
        profile: updatedProfile,
      };
    } catch (error) {
      console.error('CNIC upload error:', error);
      throw new BadRequestException(`Failed to upload CNIC images: ${error.message}`);
    }
  }

  private async uploadToCloudinary(file: Express.Multer.File, publicId: string): Promise<any> {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          resource_type: 'image',
          public_id: publicId,
          folder: 'rozgaar360/cnic',
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(file.buffer);
    });
  }
}