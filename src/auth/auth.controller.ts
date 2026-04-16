import { Controller, Post, Body, Res } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, ForgotPasswordEmailDto, ResetPasswordEmailDto } from '../dto/auth.dto';

@Controller('api/auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async login(@Body() loginDto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.login(loginDto);
    
    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('token', result.token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'strict' : 'lax',
      maxAge: 24 * 60 * 60 * 1000,
    });
    
    return result;
  }

  @Post('logout')
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('token');
    return { message: 'Logged out successfully' };
  }

  @Post('forgot-password-email')
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  async forgotPasswordEmail(@Body() forgotPasswordDto: ForgotPasswordEmailDto) {
    return this.authService.forgotPasswordEmail(forgotPasswordDto);
  }

  @Post('reset-password-email')
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  async resetPasswordEmail(@Body() resetPasswordDto: ResetPasswordEmailDto) {
    return this.authService.resetPasswordEmail(resetPasswordDto);
  }
}
