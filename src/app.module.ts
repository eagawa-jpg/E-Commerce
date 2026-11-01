import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { DatabaseModule } from './database/database.module';
import { ProductsModule } from './users/products/products.module';
import { OrdersModule } from './orders/orders.module';

@Module({
  imports: [
    DatabaseModule,
    UsersModule,
    AuthModule,
    ProductsModule,
    OrdersModule,
  ],
})
export class AppModule {}
