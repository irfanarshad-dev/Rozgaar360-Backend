import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
} from 'class-validator';

export class PaginationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

export class SearchPaginationQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  search?: string = '';
}

export class MongoIdParamDto {
  @IsMongoId()
  id: string;
}

export class WorkersQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(['pending', 'active', 'suspended'])
  status?: 'pending' | 'active' | 'suspended';
}

export class BookingsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'])
  status?: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
}

export class CancelBookingDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  reason?: string;
}

export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  name: string;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateCategoryDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class CollectionParamDto {
  @IsString()
  @IsNotEmpty()
  collection: string;
}

export class CollectionDocumentParamDto extends CollectionParamDto {
  @IsMongoId()
  id: string;
}

export class VerifyWorkerDto {
  @IsEnum(['approved', 'rejected'])
  status: 'approved' | 'rejected';
}