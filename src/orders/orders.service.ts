
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  OnModuleInit,
} from '@nestjs/common';

import { DatabaseService } from '../database/database.service';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class OrdersService implements OnModuleInit {
  constructor(private readonly db: DatabaseService) {}

  async onModuleInit() {
    await this.initDatabaseTables();
  }

  async initDatabaseTables() {
    const pool = this.db.getPool();

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS orders (
        order_id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NULL,
        product_id INT NULL,
        quantity INT NOT NULL DEFAULT 1,
        total_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
        customer_name VARCHAR(150) NULL,
        customer_email VARCHAR(150) NULL,
        total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
        status VARCHAR(50) NOT NULL DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
        CONSTRAINT fk_orders_product FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE SET NULL
      )
    `);

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS order_items (
        item_id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT NOT NULL,
        product_id INT NULL,
        product_name VARCHAR(150) NOT NULL,
        price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
        quantity INT NOT NULL DEFAULT 1,
        subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
        CONSTRAINT fk_order_items_product FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE SET NULL
      )
    `);
  }

  // GET all orders
  async getAll(filters?: { user_id?: number; status?: string }) {
    const pool = this.db.getPool();
    const conditions: string[] = [];
    const values: any[] = [];

    if (filters?.user_id !== undefined && !isNaN(filters.user_id)) {
      conditions.push('o.user_id = ?');
      values.push(filters.user_id);
    }

    if (filters?.status) {
      conditions.push('o.status = ?');
      values.push(filters.status);
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const sql = `
      SELECT
        o.order_id,
        o.user_id,
        u.username,
        o.product_id,
        p.product_name,
        p.price AS unit_price,
        o.quantity,
        o.total_price,
        o.total_amount,
        o.customer_name,
        o.customer_email,
        o.status,
        o.created_at,
        o.updated_at
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN products p ON o.product_id = p.product_id
      ${whereClause}
      ORDER BY o.order_id DESC
    `;

    const [orders] = await pool.execute<RowDataPacket[]>(sql, values);
    return orders;
  }

  // GET one order
  async getOne(id: number) {
    const pool = this.db.getPool();

    const [orders] = await pool.execute<RowDataPacket[]>(
      `SELECT
        o.order_id,
        o.user_id,
        u.username,
        o.product_id,
        p.product_name,
        p.price AS unit_price,
        o.quantity,
        o.total_price,
        o.total_amount,
        o.customer_name,
        o.customer_email,
        o.status,
        o.created_at,
        o.updated_at
       FROM orders o
       LEFT JOIN users u ON o.user_id = u.id
       LEFT JOIN products p ON o.product_id = p.product_id
       WHERE o.order_id = ?`,
      [id],
    );

    if (orders.length === 0) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    return orders[0];
  }

  // GET orders by user
  async getByUserId(userId: number) {
    return this.getAll({ user_id: userId });
  }

  // POST create order
  async create(dto: CreateOrderDto) {
    const conn = await this.db.getPool().getConnection();

    try {
      await conn.beginTransaction();

      let username: string | null = null;
      const userId =
        dto.user_id !== undefined ? Number(dto.user_id) : null;

      if (userId !== null) {
        const [userRows] = await conn.execute<RowDataPacket[]>(
          'SELECT id, username FROM users WHERE id = ?',
          [userId],
        );

        if (userRows.length === 0) {
          throw new NotFoundException(`User with ID ${userId} not found`);
        }

        username = userRows[0].username;
      }

      const productOrdersToCreate: {
        productId: number;
        quantity: number;
      }[] = [];

      if (dto.product_id !== undefined) {
        productOrdersToCreate.push({
          productId: Number(dto.product_id),
          quantity: dto.quantity && dto.quantity > 0
            ? Number(dto.quantity)
            : 1,
        });
      } else if (dto.items && Array.isArray(dto.items)) {
        for (const item of dto.items) {
          if (item.product_id) {
            productOrdersToCreate.push({
              productId: Number(item.product_id),
              quantity: item.quantity && item.quantity > 0
                ? Number(item.quantity)
                : 1,
            });
          }
        }
      }

      if (productOrdersToCreate.length === 0) {
        throw new BadRequestException(
          'Please provide product_id to place an order',
        );
      }

      const createdOrderIds: number[] = [];
      const status = dto.status || 'pending';
      const customerName = dto.customer_name || username || null;
      const customerEmail = dto.customer_email || null;

      for (const item of productOrdersToCreate) {
        const [productRows] = await conn.execute<RowDataPacket[]>(
          'SELECT product_id, product_name, price FROM products WHERE product_id = ?',
          [item.productId],
        );

        if (productRows.length === 0) {
          throw new NotFoundException(
            `Product with ID ${item.productId} not found`,
          );
        }

        const product = productRows[0];
        const unitPrice = Number(product.price);
        const totalPrice = Number(
          (unitPrice * item.quantity).toFixed(2),
        );

        const [orderResult] = await conn.execute<ResultSetHeader>(
          `INSERT INTO orders
           (user_id, product_id, quantity, total_price, total_amount,
            customer_name, customer_email, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            userId,
            product.product_id,
            item.quantity,
            totalPrice,
            totalPrice,
            customerName,
            customerEmail,
            status,
          ],
        );

        const orderId = orderResult.insertId;
        createdOrderIds.push(orderId);

        await conn.execute<ResultSetHeader>(
          `INSERT INTO order_items
           (order_id, product_id, product_name, price, quantity, subtotal)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            orderId,
            product.product_id,
            product.product_name,
            unitPrice,
            item.quantity,
            totalPrice,
          ],
        );
      }

      await conn.commit();

      if (createdOrderIds.length === 1) {
        return {
          message: 'Order placed successfully',
          order: await this.getOne(createdOrderIds[0]),
        };
      }

      const createdList: any[] = [];

      for (const orderId of createdOrderIds) {
        createdList.push(await this.getOne(orderId));
      }

      return {
        message: 'Orders placed successfully',
        orders: createdList,
      };
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  }

  // PUT/PATCH update order status
  async updateStatus(id: number, status: string) {
    const orderId = Number(id);

    if (!Number.isInteger(orderId) || orderId <= 0) {
      throw new BadRequestException('Valid Order ID is required');
    }

    if (typeof status !== 'string' || status.trim() === '') {
      throw new BadRequestException('Valid status is required');
    }

    const cleanStatus = status.trim();

    await this.getOne(orderId);

    await this.db.getPool().execute(
      'UPDATE orders SET status = ? WHERE order_id = ?',
      [cleanStatus, orderId],
    );

    return this.getOne(orderId);
  }

  // DELETE order
  async delete(id: number) {
    await this.getOne(id);

    await this.db.getPool().execute(
      'DELETE FROM orders WHERE order_id = ?',
      [id],
    );

    return { message: 'Order deleted successfully' };
  }
}
