import { Controller, Get, Put, Post, Param, Body, UseGuards, ValidationPipe, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from './users.service';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('api/users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  async getProfile(@CurrentUser() user: any) {
    return this.usersService.getProfile(user._id);
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'))
  async updateProfile(
    @Param('id') id: string,
    @Body(ValidationPipe) updateData: any,
    @CurrentUser() user: any
  ) {
    if (user._id.toString() !== id) {
      throw new Error('Unauthorized: Cannot update other user profiles');
    }
    return this.usersService.updateProfile(id, updateData);
  }

  @Post('upload-photo')
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(FileInterceptor('profilePhoto'))
  async uploadPhoto(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: any
  ) {
    return this.usersService.uploadProfilePhoto(user._id, file);
  }

  @Get('workers/:id')
  async getWorker(@Param('id') id: string) {
    return this.usersService.getWorker(id);
  }
}
