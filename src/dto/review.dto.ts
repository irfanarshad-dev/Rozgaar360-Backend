import { IsNumber, IsString, IsMongoId, Min, Max } from 'class-validator';

export class CreateReviewDto {
  @IsMongoId()
  bookingId: string;

  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @IsString()
  comment: string;
}
