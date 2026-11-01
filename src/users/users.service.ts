import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { RowDataPacket, OkPacket } from 'mysql2';
const bcrypt = require('bcryptjs') as {
    hash(password: string, rounds: number): Promise<string>;
};

@Injectable()
export class UsersService {
  constructor(private db: DatabaseService) {}

  private pool = () => this.db.getPool();

  async createUser(username: string, password: string, role = 'user') {
    const hashed = await bcrypt.hash(password, 10);
    const [result] = await this.pool().execute<OkPacket>(
      'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
      [username, hashed, role],
    );
    return { id: result.insertId, username, role };
  }

  async findByUsername(username: string) {
    const [rows] = await this.pool().execute<RowDataPacket[]>(
      'SELECT id, username, password, role, refresh_token FROM users WHERE username = ?',
      [username],
    );
    return rows[0];
}

async findById(id: number) {
    const [rows] = await this.pool().execute<RowDataPacket[]>(
        'SELECT id, username, role, created_at FROM users WHERE id = ?',
        [id],
    );
    return rows[0];
}

async getAll() {
    const [rows] = await this.pool().execute<RowDataPacket[]>(
        'SELECT id, username, role, created_at FROM users',
    );
    return rows;
}

async updateUser(id: number, partial: { username?: string; password?: string; role?: string }) {
    const fields: string[] = [];
    const values: any[] = [];
    if (partial.username) {
        fields.push('username = ?');
        values.push(partial.username);
    }
        if (partial.password) {
            const hashed = await bcrypt.hash(partial.password, 10);
            fields.push('password = ?');
            values.push(hashed);
        }
        if (partial.role) {
            fields.push('role = ?');
            values.push(partial.role);
        }
        if (fields.length === 0) return await this.findById(id);
        values.push(id);
        const sql = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
        await this.pool().execute(sql, values);
        return this.findById(id);
    }

    async deleteUser(id: number) {
        const [res] = await this.pool().execute<OkPacket>('DELETE FROM users WHERE id = ?', [id]);
        return res.affectedRows > 0;
    }

    async setRefreshToken(id: number, refreshToken: string | null) {
        await this.pool().execute('UPDATE users SET refresh_token = ? WHERE id = ?', [refreshToken, id]);
    }

    async findByRefreshToken(refreshToken: string) {
        const [rows] = await this.pool().execute<RowDataPacket[]>(
            'SELECT id, username, role FROM users WHERE refresh_token = ?',
            [refreshToken],
        );
        return rows[0];
    }
}
