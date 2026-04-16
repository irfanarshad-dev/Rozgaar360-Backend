import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { VerificationService } from './verification.service';
import { VerificationController } from './verification.controller';
import { CloudinaryProvider } from './cloudinary.config';
import { WorkerProfile, WorkerProfileSchema } from '../schemas/worker-profile.schema';
import { User, UserSchema } from '../schemas/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: WorkerProfile.name, schema: WorkerProfileSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [VerificationController],
  providers: [VerificationService, CloudinaryProvider],
  exports: [VerificationService],
})
export class VerificationModule {}