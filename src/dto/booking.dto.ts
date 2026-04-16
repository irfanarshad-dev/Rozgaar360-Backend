import { IsString, IsDateString, IsMongoId, IsOptional, IsNumber } from 'class-validator';

export class CreateBookingDto {
  @IsMongoId()
  workerId: string;

  @IsString()
  service: string;

  @IsDateString()
  date: string;

  @IsString()
  time: string;

  @IsString()
  address: string;

  @IsString()
  description: string;

  @IsOptional()
  @IsNumber()
  estimatedCost?: number;
}

export class UpdateBookingStatusDto {
  @IsString()
  status: 'confirmed' | 'in_progress' | 'completed' | 'cancelled';

  @IsOptional()
  @IsString()
  cancellationReason?: string;
}
