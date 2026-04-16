import { Injectable, UnauthorizedException, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { User } from '../schemas/user.schema';
import { WorkerProfile } from '../schemas/worker-profile.schema';
import { CustomerProfile } from '../schemas/customer-profile.schema';
import { AdminProfile } from '../schemas/admin-profile.schema';
import { PasswordReset } from '../schemas/password-reset.schema';
import { LoginAttempt } from '../schemas/login-attempt.schema';
import { EmailService } from '../services/email.service';
import { RegisterDto, LoginDto, ForgotPasswordEmailDto, ResetPasswordEmailDto } from '../dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(WorkerProfile.name) private workerProfileModel: Model<WorkerProfile>,
    @InjectModel(CustomerProfile.name) private customerProfileModel: Model<CustomerProfile>,
    @InjectModel(AdminProfile.name) private adminProfileModel: Model<AdminProfile>,
    @InjectModel(PasswordReset.name) private passwordResetModel: Model<PasswordReset>,
    @InjectModel(LoginAttempt.name) private loginAttemptModel: Model<LoginAttempt>,
    private jwtService: JwtService,
    private emailService: EmailService,
  ) {}

  async register(registerDto: RegisterDto) {
    // Check if phone already exists
    const existingPhone = await this.userModel.findOne({ phone: registerDto.phone });
    if (existingPhone) {
      throw new ConflictException('Phone number already registered');
    }

    // Check if email already exists (if provided)
    if (registerDto.email) {
      const existingEmail = await this.userModel.findOne({ email: registerDto.email });
      if (existingEmail) {
        throw new ConflictException('Email already registered');
      }
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);
    
    const user = await this.userModel.create({
      name: registerDto.name,
      phone: registerDto.phone,
      email: registerDto.email,
      password: hashedPassword,
      role: registerDto.role,
      city: registerDto.city,
    });

    // Create role-specific profile
    if (registerDto.role === 'worker') {
      await this.workerProfileModel.create({
        userId: user._id,
        skill: registerDto.skill,
        experience: registerDto.experience,
      });
    } else if (registerDto.role === 'customer') {
      await this.customerProfileModel.create({
        userId: user._id,
        address: registerDto.address,
      });
    } else if (registerDto.role === 'admin') {
      await this.adminProfileModel.create({
        userId: user._id,
        permissions: [],
      });
    }

    // Send welcome email if email provided
    if (registerDto.email) {
      await this.emailService.sendWelcomeEmail(registerDto.email, registerDto.name);
    }

    const { password, ...result } = user.toObject();
    return result;
  }

  async login(loginDto: LoginDto) {
    if (!loginDto.role) {
      throw new BadRequestException('Role is required');
    }

    if (!loginDto.phone && !loginDto.email) {
      throw new BadRequestException('Phone or email is required');
    }

    // Find user by phone or email
    const query: any = {};
    if (loginDto.phone) query.phone = loginDto.phone;
    if (loginDto.email) query.email = loginDto.email;

    const user = await this.userModel.findOne(query);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatch = await bcrypt.compare(loginDto.password, user.password);
    if (!passwordMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.role !== loginDto.role) {
      throw new UnauthorizedException(`User is registered as ${user.role}, not ${loginDto.role}`);
    }

    const payload = { 
      sub: (user._id as Types.ObjectId).toString(), 
      phone: user.phone,
      email: user.email,
      role: user.role 
    };
    const token = this.jwtService.sign(payload);

    const { password, ...userResult } = user.toObject();
    return {
      token,
      user: userResult,
    };
  }

  async forgotPasswordEmail(forgotPasswordDto: ForgotPasswordEmailDto) {
    const user = await this.userModel.findOne({ email: forgotPasswordDto.email });

    if (!user) {
      throw new NotFoundException('Email not found');
    }

    // Generate 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    const hashedOtp = await bcrypt.hash(otp, 10);

    // Delete old OTP requests
    await this.passwordResetModel.deleteMany({ email: forgotPasswordDto.email });

    // Save new OTP
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    await this.passwordResetModel.create({
      email: forgotPasswordDto.email,
      token: hashedOtp,
      expiresAt,
    });

    // Send OTP via email (FREE)
    await this.emailService.sendOTP(forgotPasswordDto.email, otp);

    return { 
      message: 'OTP sent to your email',
      email: forgotPasswordDto.email
    };
  }

  async resetPasswordEmail(resetPasswordDto: ResetPasswordEmailDto) {
    const resetRecord = await this.passwordResetModel.findOne({
      email: resetPasswordDto.email,
    });

    if (!resetRecord) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    if (new Date() > resetRecord.expiresAt) {
      await this.passwordResetModel.deleteOne({ _id: resetRecord._id });
      throw new BadRequestException('OTP has expired');
    }

    const isValidOtp = await bcrypt.compare(resetPasswordDto.token, resetRecord.token);
    if (!isValidOtp) {
      throw new BadRequestException('Invalid OTP');
    }

    // Update password
    const hashedPassword = await bcrypt.hash(resetPasswordDto.newPassword, 10);
    await this.userModel.updateOne(
      { email: resetPasswordDto.email },
      { password: hashedPassword }
    );

    // Delete used OTP
    await this.passwordResetModel.deleteOne({ _id: resetRecord._id });

    return { message: 'Password reset successful' };
  }

  async validateUser(userId: string, role: string) {
    try {
      const user = await this.userModel.findById(userId).select('-password');
      
      if (user && user.role !== role) {
        return null;
      }
      
      return user;
    } catch (error) {
      return null;
    }
  }

  async getProfile(userId: string) {
    const user = await this.userModel.findById(userId).select('-password');
    if (!user) throw new NotFoundException('User not found');

    let profile = null;
    
    if (user.role === 'worker') {
      profile = await this.workerProfileModel.findOne({ userId });
    } else if (user.role === 'customer') {
      profile = await this.customerProfileModel.findOne({ userId });
    } else if (user.role === 'admin') {
      profile = await this.adminProfileModel.findOne({ userId });
    }

    return { ...user.toObject(), profile };
  }
}
