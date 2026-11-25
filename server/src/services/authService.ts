import bcrypt from 'bcrypt';
import { createUser, findUserByEmail } from '../repositories/userRepository.js';
import { createAccessToken } from './accessTokenService.js';

export class AuthError extends Error {
    constructor(message: string, public statusCode: number) {
        super(message);
    }
}

export async function registerUser(email: string, password: string) {
    const existingUser = await findUserByEmail(email);
    if (existingUser) throw new AuthError('Email already exists', 409);

    const passwordHash = await bcrypt.hash(password, 10);
    return createUser(email, passwordHash);
}

export async function loginUser(email: string, password: string) {
    const user = await findUserByEmail(email);
    if (!user) throw new AuthError('Invalid credentials', 401);

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatches) throw new AuthError('Invalid credentials', 401);

    const authenticatedUser = { id: user.id, email: user.email };
    return {
        user: authenticatedUser,
        accessToken: createAccessToken(authenticatedUser),
    };
}