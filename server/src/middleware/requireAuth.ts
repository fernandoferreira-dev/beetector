import type { RequestHandler } from 'express';
import { verifyAccessToken } from '../services/accessTokenService.js';

export const requireAuth: RequestHandler = (req, res, next) => {
    const authorization = req.get('authorization');
    const token = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
    const user = token ? verifyAccessToken(token) : null;

    if (!user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
    }

    req.user = user;
    next();
};
