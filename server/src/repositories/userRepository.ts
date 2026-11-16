import { pool } from '../config/database.js';
import type { UserEntity, UserRow } from '../types/user.js';

export class UserRepository {
    async findByEmail(email: string): Promise<UserEntity | null> {
        const rows = await pool.query<UserRow[]>(
            'SELECT id, user_email, user_password_hash FROM users WHERE user_email = ?',
            [email]
        );

        const row = rows[0];
        if (!row) return null;

        return {
            id: row.id,
            email: row.user_email,
            passwordHash: row.user_password_hash,
        };
    }

    async create(email: string, passwordHash: string): Promise<{ id: number; email: string }> {
        const result = await pool.query<{ insertId: number }>(
            'INSERT INTO users (user_email, user_password_hash) VALUES (?, ?)',
            [email, passwordHash]
        );

        return {
            id: Number(result.insertId), // Number() previne problemas caso o driver MariaDB devolva BigInt
            email,
        };
    }
}

export const userRepository = new UserRepository();