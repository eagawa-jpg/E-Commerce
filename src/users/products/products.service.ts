import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

@Injectable()
export class ProductsService {
  constructor(private readonly db: DatabaseService) {}

  async getAll() {
    const [rows] = await this.db.getPool().execute<RowDataPacket[]>(
      'SELECT * FROM products',
    );
    return rows;
  }

  async getOne(id: number) {
    const [rows] = await this.db.getPool().execute<RowDataPacket[]>(
      'SELECT * FROM products WHERE product_id = ?',
      [id],
    );

    if (rows.length === 0) {
      throw new NotFoundException('Product not found');
    }

    return rows[0];
  }

  async create(body: { product_name: string; price: number }) {
    const [result] = await this.db.getPool().execute<ResultSetHeader>(
      'INSERT INTO products (product_name, price) VALUES (?, ?)',
      [body.product_name, body.price],
    );

    return {
      message: 'Product created successfully',
      product_id: result.insertId,
      ...body,
    };
  }

  async update(
    id: number,
    body: { product_name?: string; price?: number },
  ) {
    await this.getOne(id);

    const fields: string[] = [];
    const values: (string | number)[] = [];

    if (body.product_name !== undefined) {
      fields.push('product_name = ?');
      values.push(body.product_name);
    }

    if (body.price !== undefined) {
      fields.push('price = ?');
      values.push(body.price);
    }

    if (fields.length > 0) {
      values.push(id);

      await this.db.getPool().execute(
        `UPDATE products SET ${fields.join(', ')} WHERE product_id = ?`,
        values,
      );
    }

    return this.getOne(id);
  }

  async delete(id: number) {
    await this.getOne(id);

    await this.db.getPool().execute(
      'DELETE FROM products WHERE product_id = ?',
      [id],
    );

    return { message: 'Product deleted successfully' };
  }
}