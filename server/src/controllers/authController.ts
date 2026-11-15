import type { Request, Response } from 'express';
import { authService, AuthError } from '../services/authService.js';

export const register = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            res.status(400).json({ error: 'Email and password are required' });
            return;
        }

        const newUser = await authService.register(email, password);
        res.status(201).json(newUser);
    } catch (error) {
        if (error instanceof AuthError) {
            res.status(error.statusCode).json({ error: error.message });
            return;
        }
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

export const login = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            res.status(400).json({ error: 'Email and password are required' });
            return;
        }

        const user = await authService.login(email, password);
        res.status(200).json({
            message: 'Login successful',
            user,
        });
    } catch (error) {
        if (error instanceof AuthError) {
            res.status(error.statusCode).json({ error: error.message });
            return;
        }
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};