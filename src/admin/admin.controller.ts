import { Controller, Get, Put, Delete, Param, Body, UseGuards, ValidationPipe } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AdminService } from './admin.service';
import { RolesGuard, Roles } from '../auth/roles.guard';

@Controller('api/admin')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(['admin'])
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('dashboard')
  async getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  @Get('users')
  async getAllUsers() {
    return this.adminService.getAllUsers();
  }

  @Get('workers')
  async getAllWorkers() {
    return this.adminService.getAllWorkers();
  }

  @Get('verifications/pending')
  async getPendingVerifications() {
    return this.adminService.getPendingVerifications();
  }

  @Put('verify/:id')
  async verifyUser(
    @Param('id') id: string,
    @Body('status', ValidationPipe) status: 'approved' | 'rejected'
  ) {
    return this.adminService.verifyUser(id, status);
  }

  @Delete('users/:id')
  async deleteUser(@Param('id') id: string) {
    return this.adminService.deleteUser(id);
  }
}