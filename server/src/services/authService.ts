import bcrypt from 'bcrypt';
import { userRepository } from '../repositories/userRepository.js';

export class AuthError extends Error {
    constructor(
        public message: string,
        public statusCode: number
    ) {
        super(message);
    }
}

export class AuthService {
    async register(email: string, password: string) {
        const existingUser = await userRepository.findByEmail(email);
        if (existingUser) {
            throw new AuthError('Email already exists', 409);
        }

        const passwordHash = await bcrypt.hash(password, 10);
        return await userRepository.create(email, passwordHash);
    }

    async login(email: string, password: string) {
        const user = await userRepository.findByEmail(email);
        if (!user) {
            throw new AuthError('Invalid credentials', 401);
        }

        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) {
            throw new AuthError('Invalid credentials', 401);
        }

        return {
            id: user.id,
            email: user.email,
        };
    }
}

export const authService = new AuthService();