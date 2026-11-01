import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OrdersService } from '../orders/orders.service';

@Controller('users')
export class UsersController {
  constructor(
    private usersService: UsersService,
    private ordersService: OrdersService,
  ) {}

  // Get all users (protected)
  @UseGuards(JwtAuthGuard)
  @Get()
  async getAll() {
    return this.usersService.getAll();
  }

  // Get single user by id (protected)
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getOne(@Param('id') id: string) {
    return this.usersService.findById(+id);
  }

  // Create user (open - for demo)
  @Post()
  async create(@Body() body: { username: string; password: string }) {
    return this.usersService.createUser(body.username, body.password);
  }

  // Update user (protected)
  @UseGuards(JwtAuthGuard)
  @Put(':id')
  async update(@Param('id') id: string, @Body() body: any) {
    return this.usersService.updateUser(+id, body);
  }

  // Delete user (protected)
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.usersService.deleteUser(+id);
  }

  // Place order for product_id for this user
  @Post(':id/orders')
  async placeOrder(
    @Param('id') id: string,
    @Body() body: { product_id: number; quantity?: number; status?: string },
  ) {
    return this.ordersService.create({
      user_id: +id,
      product_id: body.product_id,
      quantity: body.quantity,
      status: body.status,
    });
  }

  // Get orders placed by this user
  @Get(':id/orders')
  async getUserOrders(@Param('id') id: string) {
    return this.ordersService.getByUserId(+id);
  }
}
