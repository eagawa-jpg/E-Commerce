import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  ParseIntPipe,
} from '@nestjs/common';

import { OrdersService } from './orders.service';
import {
  CreateOrderDto,
  UpdateOrderStatusDto,
} from './dto/create-order.dto';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // GET all orders
  @Get()
  getAll(
    @Query('user_id') userId?: string,
    @Query('status') status?: string,
  ) {
    const parsedUserId = userId
      ? parseInt(userId, 10)
      : undefined;

    return this.ordersService.getAll({
      user_id: parsedUserId,
      status,
    });
  }

  // GET orders by user
  @Get('user/:userId')
  getUserOrders(
    @Param('userId', ParseIntPipe) userId: number,
  ) {
    return this.ordersService.getByUserId(userId);
  }

  // GET one order
  @Get(':id')
  getOne(@Param('id', ParseIntPipe) id: number) {
    return this.ordersService.getOne(id);
  }

  // POST create order
  @Post()
  create(@Body() body: CreateOrderDto) {
    return this.ordersService.create(body);
  }

  // POST create order for a user
  @Post('user/:userId')
  createForUser(
    @Param('userId', ParseIntPipe) userId: number,
    @Body()
    body: {
      product_id: number;
      quantity?: number;
      status?: string;
    },
  ) {
    return this.ordersService.create({
      user_id: userId,
      product_id: body.product_id,
      quantity: body.quantity,
      status: body.status,
    });
  }

  // PUT update order status
 @Put(':id')
update(
  @Param('id', ParseIntPipe) id: number,
  @Body() body: UpdateOrderStatusDto,
) {
  console.log('PUT ORDER BODY:', body);
  console.log('STATUS VALUE:', body?.status);

  return this.ordersService.updateStatus(id, body?.status);
}

  // PATCH update order status
  @Patch(':id/status')
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateStatus(id, body.status);
  }

  // DELETE order
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.ordersService.delete(id);
  }
}