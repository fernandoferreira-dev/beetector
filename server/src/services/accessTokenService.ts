import { createHmac, timingSafeEqual } from 'node:crypto';
import { env } from '../config/env.js';
import type { AuthenticatedUser } from '../types/auth.js';

const ACCESS_TOKEN_TTL_SECONDS = 60 * 60;
const MAX_TOKEN_LENGTH = 4096;

function encodeJson(value: object): string {
    return Buffer.from(JSON.stringify(value)).toString('base64url');
}

function parseJsonSegment(segment: string): Record<string, unknown> | null {
    try {
        const value: unknown = JSON.parse(Buffer.from(segment, 'base64url').toString('utf8'));
        if (typeof value !== 'object' || value === null || Array.isArray(value)) return null;
        return value as Record<string, unknown>;
    } catch {
        return null;
    }
}

export function createAccessToken(user: AuthenticatedUser): string {
    const issuedAt = Math.floor(Date.now() / 1000);
    const header = encodeJson({ alg: 'HS256', typ: 'JWT' });
    const payload = encodeJson({
        sub: String(user.id),
        email: user.email,
        iat: issuedAt,
        exp: issuedAt + ACCESS_TOKEN_TTL_SECONDS,
    });
    const signingInput = `${header}.${payload}`;
    const signature = createHmac('sha256', env.sessionSecret)
        .update(signingInput)
        .digest('base64url');

    return `${signingInput}.${signature}`;
}

export function verifyAccessToken(token: string): AuthenticatedUser | null {
    if (token.length > MAX_TOKEN_LENGTH) return null;

    const parts = token.split('.');
    if (parts.length !== 3 || parts.some((part) => !/^[A-Za-z0-9_-]+$/.test(part))) {
        return null;
    }

    const [encodedHeader, encodedPayload, encodedSignature] = parts;
    if (!encodedHeader || !encodedPayload || !encodedSignature) return null;

    const signingInput = `${encodedHeader}.${encodedPayload}`;
    const expectedSignature = createHmac('sha256', env.sessionSecret)
        .update(signingInput)
        .digest();
    const suppliedSignature = Buffer.from(encodedSignature, 'base64url');

    if (
        suppliedSignature.length !== expectedSignature.length ||
        !timingSafeEqual(suppliedSignature, expectedSignature)
    ) {
        return null;
    }

    const header = parseJsonSegment(encodedHeader);
    const payload = parseJsonSegment(encodedPayload);
    if (header?.alg !== 'HS256' || header.typ !== 'JWT' || !payload) return null;

    const userId = Number(payload.sub);
    const now = Math.floor(Date.now() / 1000);
    if (
        !Number.isSafeInteger(userId) ||
        userId < 1 ||
        String(userId) !== payload.sub ||
        typeof payload.email !== 'string' ||
        payload.email.length === 0 ||
        typeof payload.iat !== 'number' ||
        !Number.isInteger(payload.iat) ||
        payload.iat > now + 60 ||
        typeof payload.exp !== 'number' ||
        !Number.isInteger(payload.exp) ||
        payload.exp <= now ||
        payload.exp <= payload.iat ||
        payload.exp - payload.iat > ACCESS_TOKEN_TTL_SECONDS
    ) {
        return null;
    }

    return { id: userId, email: payload.email };
}
