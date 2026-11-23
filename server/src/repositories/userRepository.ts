import { pool } from '../config/database.js';
import type { UserEntity, UserRow } from '../types/user.js';

export async function findUserByEmail(email: string): Promise<UserEntity | null> {
    const rows = await pool.query<UserRow[]>(
        'SELECT user_id, user_email, user_password FROM users WHERE user_email = ?',
        [email]
    );

    const row = rows[0];
    if (!row) return null;

    return {
        id: row.user_id,
        email: row.user_email,
        passwordHash: row.user_password,
    };
}

export async function createUser(email: string, passwordHash: string): Promise<{ id: number; email: string }> {
    const result = await pool.query<{ insertId: number }>(
        'INSERT INTO users (user_email, user_password) VALUES (?, ?)',
        [email, passwordHash]
    );

    return { id: Number(result.insertId), email };
}