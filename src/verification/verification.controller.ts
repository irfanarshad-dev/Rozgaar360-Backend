import { 
  Controller, 
  Post, 
  UseGuards, 
  UseInterceptors, 
  UploadedFiles, 
  Body,
  Request 
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { VerificationService } from './verification.service';
import { RolesGuard, Roles } from '../auth/roles.guard';

@Controller('api/verification')
export class VerificationController {
  constructor(private verificationService: VerificationService) {}

  @Post('upload')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(['worker'])
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'cnicFront', maxCount: 1 },
    { name: 'cnicBack', maxCount: 1 },
  ]))
  async uploadCNIC(
    @UploadedFiles() files: { cnicFront: Express.Multer.File[], cnicBack: Express.Multer.File[] },
    @Request() req
  ) {
    // Use authenticated user's ID from JWT token for security
    return this.verificationService.uploadCNIC(req.user._id, files);
  }
}
