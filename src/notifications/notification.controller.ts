import { Controller, Get, Patch, Delete, Param, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { NotificationService } from '../services/notification.service';

@Controller('api/notifications')
@UseGuards(AuthGuard('jwt'))
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  async getNotifications(@Request() req) {
    return this.notificationService.getUserNotifications(req.user._id);
  }

  @Get('unread-count')
  async getUnreadCount(@Request() req) {
    const count = await this.notificationService.getUnreadCount(req.user._id);
    return { count };
  }

  @Patch(':id/read')
  async markAsRead(@Param('id') id: string, @Request() req) {
    return this.notificationService.markAsRead(id, req.user._id);
  }

  @Patch('read-all')
  async markAllAsRead(@Request() req) {
    return this.notificationService.markAllAsRead(req.user._id);
  }

  @Delete(':id')
  async deleteNotification(@Param('id') id: string, @Request() req) {
    return this.notificationService.deleteNotification(id, req.user._id);
  }
}
