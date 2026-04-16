import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { User, UserSchema } from '../schemas/user.schema';
import { WorkerProfile, WorkerProfileSchema } from '../schemas/worker-profile.schema';
import { CustomerProfile, CustomerProfileSchema } from '../schemas/customer-profile.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: WorkerProfile.name, schema: WorkerProfileSchema },
      { name: CustomerProfile.name, schema: CustomerProfileSchema },
    ]),
  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
