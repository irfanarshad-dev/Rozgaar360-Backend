import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../schemas/user.schema';
import { WorkerProfile } from '../schemas/worker-profile.schema';

@Injectable()
export class RecommendationsService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(WorkerProfile.name) private workerProfileModel: Model<WorkerProfile>,
  ) {}

  async getRecommendations(city?: string, skill?: string, limit = 10, lat?: number, lng?: number, maxDistance = 50000) {
    const query: any = {};
    
    if (city) query.city = city;
    if (skill) query.skill = skill;

    let profiles;

    // If user location provided, use geospatial query
    if (lat && lng) {
      profiles = await this.workerProfileModel
        .find({
          ...query,
          location: {
            $near: {
              $geometry: {
                type: 'Point',
                coordinates: [lng, lat]
              },
              $maxDistance: maxDistance // 50km default
            }
          }
        })
        .limit(limit)
        .populate('userId', '-password');
    } else {
      profiles = await this.workerProfileModel
        .find(query)
        .sort({ rating: -1, reviewCount: -1 })
        .limit(limit)
        .populate('userId', '-password');
    }

    return profiles
      .filter((profile: any) => profile.userId)
      .map((profile: any) => ({
        id: profile.userId._id,
        name: profile.userId.name,
        phone: profile.userId.phone,
        email: profile.userId.email,
        city: profile.userId.city,
        profilePicture: profile.userId.profilePicture,
        skill: profile.skill,
        experience: profile.experience,
        rating: profile.rating,
        reviewCount: profile.reviewCount,
        verified: profile.verified,
        verificationStatus: profile.verificationStatus,
        location: profile.location,
      }));
  }
}
