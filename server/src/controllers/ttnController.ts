import type { Request, Response } from 'express';
import { timingSafeEqual } from 'node:crypto';
import { env } from '../config/env.js';
import { InvalidPayloadError, processUplink } from '../services/ttnService.js';

function secretOk(received: string): boolean {
    const a = Buffer.from(received);
    const b = Buffer.from(env.ttnWebhookSecret);
    // Além de comparar o segredo, evitamos uma comparação que revele o seu valor pelo tempo de resposta.
    return a.length === b.length && timingSafeEqual(a, b);
}

export const uplink = async (req: Request, res: Response) => {
    // Só aceitamos mensagens do webhook configurado no TTN.
    if (!secretOk(req.header('x-webhook-secret') ?? '')) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }

    console.log('[TTN] Uplink received:', req.body);

    try {
        const result = await processUplink(req.body);

        if (result === 'unknown_device') {
            // O payload está correto, mas não conhecemos o dispositivo. O 200 evita um novo envio do TTN.
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