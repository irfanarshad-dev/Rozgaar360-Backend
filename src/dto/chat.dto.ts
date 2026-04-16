import { IsMongoId, IsString } from 'class-validator';

export class CreateConversationDto {
  @IsMongoId({ message: 'jobId must be a valid MongoDB ObjectId' })
  jobId: string;

  @IsMongoId({ message: 'workerId must be a valid MongoDB ObjectId' })
  workerId: string;

  @IsMongoId({ message: 'customerId must be a valid MongoDB ObjectId' })
  customerId: string;
}
