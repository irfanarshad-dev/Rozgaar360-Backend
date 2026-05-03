import { IsString, IsEnum, IsOptional, IsNumber, MinLength, Matches, IsEmail, IsBoolean, Min, Max, IsDateString, IsArray } from 'class-validator';

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

  // Worker fields - Required for workers
  @IsOptional()
  @IsString()
  skill?: string;

  @IsOptional()
  @IsNumber()
  experience?: number;

  @IsOptional()
  @IsString()
  workerAddress?: string;

  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  workerLatitude?: number;

  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  workerLongitude?: number;

  @IsOptional()
  @IsString()
  workerAddress?: string;

  @IsOptional()
  @IsBoolean()
  isAvailableNow?: boolean;

  @IsOptional()
  @IsString()
  workStartTime?: string;

  @IsOptional()
  @IsString()
  workEndTime?: string;

  @IsOptional()
  @IsDateString()
  nextAvailableAt?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  responseRate?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  serviceRadiusKm?: number;

  @IsOptional()
  @IsArray()
  weeklySchedule?: Array<{
    day: string;
    enabled: boolean;
    start: string;
    end: string;
  }>;

  // Customer fields
  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  customerLatitude?: number;

  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  customerLongitude?: number;
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

  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  workerLatitude?: number;

  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  workerLongitude?: number;

  @IsOptional()
  @IsString()
  workerAddress?: string;

  @IsOptional()
  @IsBoolean()
  isAvailableNow?: boolean;

  @IsOptional()
  @IsString()
  workStartTime?: string;

  @IsOptional()
  @IsString()
  workEndTime?: string;

  @IsOptional()
  @IsDateString()
  nextAvailableAt?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  responseRate?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  serviceRadiusKm?: number;

  @IsOptional()
  @IsArray()
  weeklySchedule?: Array<{
    day: string;
    enabled: boolean;
    start: string;
    end: string;
  }>;

  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  customerLatitude?: number;

  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  customerLongitude?: number;
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
