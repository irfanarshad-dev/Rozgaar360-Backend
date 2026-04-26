import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { EmailService } from '../services/email.service';
import { User, UserSchema } from '../schemas/user.schema';
import { WorkerProfile, WorkerProfileSchema } from '../schemas/worker-profile.schema';
import { CustomerProfile, CustomerProfileSchema } from '../schemas/customer-profile.schema';
import { AdminProfile, AdminProfileSchema } from '../schemas/admin-profile.schema';
import { PasswordReset, PasswordResetSchema } from '../schemas/password-reset.schema';
import { LoginAttempt, LoginAttemptSchema } from '../schemas/login-attempt.schema';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'your_super_secret_jwt_key_change_in_production',
        signOptions: { expiresIn: '7d' },
      }),
      inject: [ConfigService],
    }),
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: WorkerProfile.name, schema: WorkerProfileSchema },
      { name: CustomerProfile.name, schema: CustomerProfileSchema },
      { name: AdminProfile.name, schema: AdminProfileSchema },
      { name: PasswordReset.name, schema: PasswordResetSchema },
      { name: LoginAttempt.name, schema: LoginAttemptSchema },
    ]),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, EmailService],
  exports: [AuthService],
})
export class AuthModule {}
