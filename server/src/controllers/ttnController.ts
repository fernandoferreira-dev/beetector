import type { Request, Response } from 'express';
import { timingSafeEqual } from 'node:crypto';
import { env } from '../config/env.js';
import { InvalidPayloadError, processUplink } from '../services/ttnService.js';

function secretOk(received: string): boolean {
    const a = Buffer.from(received);
    const b = Buffer.from(env.ttnWebhookSecret);
    return a.length === b.length && timingSafeEqual(a, b);
}

export const uplink = async (req: Request, res: Response) => {
    if (!secretOk(req.header('x-webhook-secret') ?? '')) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }

    console.log('[TTN] Uplink received:', req.body);

    try {
        const result = await processUplink(req.body);

        if (result === 'unknown_device') {
            // 200 para o TTN não repetir o pedido
            res.status(200).json({ ignored: 'unknown device' });
            return;
        }

        res.sendStatus(200);
    } catch (error) {
        if (error instanceof InvalidPayloadError) {
            res.status(400).json({ error: error.message });
            return;
        }
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};