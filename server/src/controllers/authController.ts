import type { Request, Response } from 'express';
import { AuthError, loginUser, registerUser } from '../services/authService.js';

export async function register(req: Request, res: Response): Promise<void> {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            res.status(400).json({ error: 'Email and password are required' });
            return;
        }

        res.status(201).json(await registerUser(email, password));
    } catch (error) {
        if (error instanceof AuthError) {
            res.status(error.statusCode).json({ error: error.message });
            return;
        }
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
}

export async function login(req: Request, res: Response): Promise<void> {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            res.status(400).json({ error: 'Email and password are required' });
            return;
        }

        const authentication = await loginUser(email, password);
        res.status(200).json({
            message: 'Login successful',
            ...authentication,
        });
    } catch (error) {
        if (error instanceof AuthError) {
            res.status(error.statusCode).json({ error: error.message });
            return;
        }
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
}