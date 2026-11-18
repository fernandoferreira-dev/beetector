import { pool } from '../config/database.js';

export interface UserEntity {
    id: number;
    email: string;
    passwordHash: string;
}

interface UserRow {
    user_id: number;
    user_email: string;
    user_password: string;
}

export class UserRepository {
    async findByEmail(email: string): Promise<UserEntity | null> {
        const rows = await pool.query<UserRow[]>(
            'SELECT user_id, user_email, user_password FROM users WHERE user_email = ?',
            [email]
        );

        const row = rows[0];
        if (!row) return null;

        return {
            id: Number(row.user_id),
            email: row.user_email,
            passwordHash: row.user_password,
        };
    }

    async create(email: string, passwordHash: string): Promise<{ id: number; email: string }> {
        const result = await pool.query<{ insertId: number }>(
            'INSERT INTO users (user_email, user_password) VALUES (?, ?)',
            [email, passwordHash]
        );

        return {
            id: Number(result.insertId), // Number() previne problemas caso o driver MariaDB devolva BigInt
            email,
        };
    }
}

export const userRepository = new UserRepository();