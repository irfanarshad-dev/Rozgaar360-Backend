import { IsString, IsEnum, IsOptional, IsNumber, MinLength, Matches, IsEmail } from 'class-validator';

export class RegisterDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsString()
  @Matches(/^03[0-9]{9}$/, { message: 'Phone must be valid Pakistani format (03xxxxxxxxx)' })
  phone: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  @IsEnum(['worker', 'customer', 'admin'])
  role: string;

  @IsString()
  city: string;

  // Worker fields
  @IsOptional()
  @IsString()
  skill?: string;

  @IsOptional()
  @IsNumber()
  experience?: number;

  // Customer fields
  @IsOptional()
  @IsString()
  address?: string;
}

export class LoginDto {
  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsString()
  password: string;

  @IsString()
  @IsEnum(['worker', 'customer', 'admin'])
  role: string;
}

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  skill?: string;

  @IsOptional()
  @IsNumber()
  experience?: number;

  @IsOptional()
  @IsString()
  address?: string;
}

export class ForgotPasswordDto {
  @IsString()
  @Matches(/^03[0-9]{9}$/, { message: 'Phone must be valid Pakistani format (03xxxxxxxxx)' })
  phone: string;

  @IsString()
  role: string;
}

export class ResetPasswordDto {
  @IsString()
  @Matches(/^03[0-9]{9}$/, { message: 'Phone must be valid Pakistani format (03xxxxxxxxx)' })
  phone: string;

  @IsString()
  token: string;

  @IsString()
  @MinLength(6)
  newPassword: string;

  @IsString()
  role: string;
}


export class ForgotPasswordEmailDto {
  @IsEmail()
  email: string;
}

export class ResetPasswordEmailDto {
  @IsEmail()
  email: string;

  @IsString()
  token: string;

  @IsString()
  @MinLength(6)
  newPassword: string;
}
