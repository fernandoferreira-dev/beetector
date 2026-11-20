import type { Request, Response } from 'express';
import {
    getAllReadings as findReadings,
    getReadingById,
    InvalidQueryError,
} from '../services/readingService.js';

export async function getAllReadings(req: Request, res: Response): Promise<void> {
    try {
        res.status(200).json(await findReadings(req.query));
    } catch (error) {
        if (error instanceof InvalidQueryError) {
            res.status(400).json({ error: error.message });
            return;
        }
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
}

export async function getReading(req: Request, res: Response): Promise<void> {
    try {
        const reading = await getReadingById(req.params.id);
        if (!reading) {
            res.status(404).json({ error: 'Reading not found' });
            return;
        }
        res.status(200).json(reading);
    } catch (error) {
        if (error instanceof InvalidQueryError) {
            res.status(400).json({ error: error.message });
            return;
        }
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
}