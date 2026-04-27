import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Put,
  Post,
  Query,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AdminService } from './admin.service';
import { RolesGuard } from './roles.guard';
import { Roles } from './roles.decorator';
import {
  BookingsQueryDto,
  CancelBookingDto,
  CollectionParamDto,
  CollectionDocumentParamDto,
  CreateCategoryDto,
  MongoIdParamDto,
  PaginationQueryDto,
  SearchPaginationQueryDto,
  UpdateCategoryDto,
  VerifyWorkerDto,
  WorkersQueryDto,
} from './admin.dto';

@Controller(['admin', 'api/admin'])
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // USERS
  @Get('users')
  async getUsers(@Query(new ValidationPipe({ transform: true })) query: SearchPaginationQueryDto) {
    return this.adminService.getUsers(query.page, query.limit, query.search);
  }

  @Patch('users/:id/suspend')
  async suspendUser(@Param(new ValidationPipe({ transform: true })) params: MongoIdParamDto) {
    return this.adminService.toggleUserSuspend(params.id);
  }

  @Delete('users/:id')
  async deleteUser(@Param(new ValidationPipe({ transform: true })) params: MongoIdParamDto) {
    return this.adminService.deleteUser(params.id);
  }

  // WORKERS
  @Get('workers')
  async getWorkers(@Query(new ValidationPipe({ transform: true })) query: WorkersQueryDto) {
    return this.adminService.getWorkers(query.status, query.page, query.limit);
  }

  @Patch('workers/:id/approve')
  async approveWorker(@Param(new ValidationPipe({ transform: true })) params: MongoIdParamDto) {
    return this.adminService.approveWorker(params.id);
  }

  @Patch('workers/:id/suspend')
  async suspendWorker(@Param(new ValidationPipe({ transform: true })) params: MongoIdParamDto) {
    return this.adminService.suspendWorker(params.id);
  }

  @Delete('workers/:id')
  async deleteWorker(@Param(new ValidationPipe({ transform: true })) params: MongoIdParamDto) {
    return this.adminService.deleteWorker(params.id);
  }

  // BOOKINGS
  @Get('bookings')
  async getBookings(@Query(new ValidationPipe({ transform: true })) query: BookingsQueryDto) {
    return this.adminService.getBookings(query.page, query.limit, query.status);
  }

  @Get('bookings/:id')
  async getBookingById(@Param(new ValidationPipe({ transform: true })) params: MongoIdParamDto) {
    return this.adminService.getBookingById(params.id);
  }

  @Patch('bookings/:id/cancel')
  async cancelBooking(
    @Param(new ValidationPipe({ transform: true })) params: MongoIdParamDto,
    @Body(new ValidationPipe({ transform: true })) body: CancelBookingDto,
  ) {
    return this.adminService.cancelBooking(params.id, body.reason);
  }

  // CATEGORIES
  @Get('categories')
  async getCategories(@Query(new ValidationPipe({ transform: true })) query: SearchPaginationQueryDto) {
    return this.adminService.getCategories(query.page, query.limit, query.search);
  }

  @Post('categories')
  async createCategory(@Body(new ValidationPipe({ transform: true })) body: CreateCategoryDto) {
    return this.adminService.createCategory(body);
  }

  @Patch('categories/:id')
  async updateCategory(
    @Param(new ValidationPipe({ transform: true })) params: MongoIdParamDto,
    @Body(new ValidationPipe({ transform: true })) body: UpdateCategoryDto,
  ) {
    return this.adminService.updateCategory(params.id, body);
  }

  @Delete('categories/:id')
  async deleteCategory(@Param(new ValidationPipe({ transform: true })) params: MongoIdParamDto) {
    return this.adminService.deleteCategory(params.id);
  }

  // REVIEWS
  @Get('reviews')
  async getReviews(@Query(new ValidationPipe({ transform: true })) query: PaginationQueryDto) {
    return this.adminService.getReviews(query.page, query.limit);
  }

  @Delete('reviews/:id')
  async deleteReview(@Param(new ValidationPipe({ transform: true })) params: MongoIdParamDto) {
    return this.adminService.deleteReview(params.id);
  }

  // DASHBOARD STATS
  @Get('stats')
  async getStats() {
    return this.adminService.getStats();
  }

  // Backward compatibility for existing dashboard
  @Get('dashboard')
  async getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  @Get('verifications/pending')
  async getPendingVerifications() {
    return this.adminService.getPendingVerifications();
  }

  @Put('verify/:id')
  async verifyUser(
    @Param(new ValidationPipe({ transform: true })) params: MongoIdParamDto,
    @Body(new ValidationPipe({ transform: true })) body: VerifyWorkerDto,
  ) {
    return this.adminService.verifyUser(params.id, body.status);
  }

  // Generic DB CRUD panel endpoints
  @Get('database/:collection')
  async listCollection(
    @Param(new ValidationPipe({ transform: true })) params: CollectionParamDto,
    @Query(new ValidationPipe({ transform: true })) query: SearchPaginationQueryDto,
  ) {
    return this.adminService.listCollection(params.collection, query.page, query.limit, query.search || '');
  }

  @Post('database/:collection')
  async createCollectionDocument(
    @Param(new ValidationPipe({ transform: true })) params: CollectionParamDto,
    @Body() payload: Record<string, any>,
  ) {
    return this.adminService.createCollectionDocument(params.collection, payload);
  }

  @Put('database/:collection/:id')
  async updateCollectionDocument(
    @Param(new ValidationPipe({ transform: true })) params: CollectionDocumentParamDto,
    @Body() payload: Record<string, any>,
  ) {
    return this.adminService.updateCollectionDocument(params.collection, params.id, payload);
  }

  @Delete('database/:collection/:id')
  async deleteCollectionDocument(
    @Param(new ValidationPipe({ transform: true })) params: CollectionDocumentParamDto,
  ) {
    return this.adminService.deleteCollectionDocument(params.collection, params.id);
  }
}
