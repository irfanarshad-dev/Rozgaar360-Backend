import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from './auth.service';

interface JwtPayload {
  sub: string;
  iat?: number;
  exp?: number;
  [key: string]: any;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    const secret = process.env.JWT_SECRET || 'your_super_secret_jwt_key_change_in_production';
    console.log('JWT Strategy initialized with secret:', secret);
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: JwtPayload) {
    if (!payload || typeof payload.sub !== 'string' || !payload.role) {
      throw new UnauthorizedException('Invalid token payload');
    }
    
    if (!/^[0-9a-fA-F]{24}$/.test(payload.sub)) {
      throw new UnauthorizedException('Invalid user ID format');
    }
    
    const user = await this.authService.validateUser(payload.sub, payload.role);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return user;
  }
}