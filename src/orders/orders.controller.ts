import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto, UpdateOrderStatusDto } from './dto/create-order.dto';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  /**
   * List all orders (optionally filter by user_id or status)
   * GET /orders
   * GET /orders?user_id=11
   */
  @Get()
  getAll(
    @Query('user_id') userId?: string,
    @Query('status') status?: string,
  ) {
    const parsedUserId = userId ? parseInt(userId, 10) : undefined;
    return this.ordersService.getAll({
      user_id: parsedUserId,
      status,
    });
  }

  /**
   * Get orders for a specific user
   * GET /orders/user/:userId
   */
  @Get('user/:userId')
  getUserOrders(@Param('userId', ParseIntPipe) userId: number) {
    return this.ordersService.getByUserId(userId);
  }

  /**
   * Get single order by order_id
   * GET /orders/:id
   */
  @Get(':id')
  getOne(@Param('id', ParseIntPipe) id: number) {
    return this.ordersService.getOne(id);
  }

  /**
   * Place an order for a product
   * POST /orders
   * Body: { "user_id": 11, "product_id": 2, "quantity": 1 }
   */
  @Post()
  create(@Body() body: CreateOrderDto) {
    return this.ordersService.create(body);
  }

  /**
   * Place an order for a user by user_id param
   * POST /orders/user/:userId
   * Body: { "product_id": 2, "quantity": 1 }
   */
  @Post('user/:userId')
  createForUser(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() body: { product_id: number; quantity?: number; status?: string },
  ) {
    return this.ordersService.create({
      user_id: userId,
      product_id: body.product_id,
      quantity: body.quantity,
      status: body.status,
    });
  }

  /**
   * Update order status
   * PATCH /orders/:id/status
   */
  @Patch(':id/status')
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateStatus(id, body.status);
  }

  /**
   * Delete order
   * DELETE /orders/:id
   */
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.ordersService.delete(id);
  }
}
