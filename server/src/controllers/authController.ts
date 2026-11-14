import type { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { pool } from '../config/database.js';

interface UserRow {
    id: number;
    email: string;
    password_hash: string;
}

export const register = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            res.status(400).json({ error: 'Email and password are required' });
            return;
        }

        const existing = await pool.query<UserRow[]>(
            'SELECT id FROM users WHERE user_email = ?',
            [email]
        );

        if (existing.length > 0) {
            res.status(409).json({ error: 'Email already exists' });
            return;
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const result = await pool.query<{ insertId: number }>(
            'INSERT INTO users (user_email, user_password_hash) VALUES (?, ?)',
            [email, passwordHash]
        );

        res.status(201).json({ id: result.insertId, email });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            res.status(400).json({ error: 'Email and password are required' });
            return;
        }

        // 1. Procurar utilizador
        const users = await pool.query<UserRow[]>(
            'SELECT * FROM users WHERE user_email = ?',
            [email]
        );

        if (users.length === 0) {
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }

        // 2. Comparar password escrita com a hash da BD
        const user = users[0];
        if (!user) {
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }
        const isValid = await bcrypt.compare(password, user.password_hash);

        if (!isValid) {
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }

        res.status(200).json({
            message: 'Login successful',
            user: { id: user.id, email: user.email },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};