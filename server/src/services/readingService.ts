import { findAllReadings, findReadingById } from '../repositories/readingRepository.js';
import type { Reading, ReadingFilters } from '../types/reading.js';

export class InvalidQueryError extends Error { }

const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 1000;

function toInteger(value: unknown, name: string, minimum: number): number | undefined {
    if (value === undefined || value === '') return undefined;

    const number = Number(value);
    if (!Number.isInteger(number) || number < minimum) {
        throw new InvalidQueryError(`Invalid ${name}`);
    }
    return number;
}

function toDate(value: unknown, name: string): Date | undefined {
    if (value === undefined || value === '') return undefined;

    const date = new Date(String(value));
    if (Number.isNaN(date.getTime())) {
        throw new InvalidQueryError(`Invalid ${name}`);
    }
    return date;
}

export async function getAllReadings(query: Record<string, unknown>): Promise<Reading[]> {
    const filters: ReadingFilters = {
        limit: Math.min(toInteger(query.limit, 'limit', 1) ?? DEFAULT_LIMIT, MAX_LIMIT),
        offset: toInteger(query.offset, 'offset', 0) ?? 0,
    };

    const hiveId = toInteger(query.hiveId, 'hiveId', 1);
    const from = toDate(query.from, 'from');
    const to = toDate(query.to, 'to');

    if (hiveId !== undefined) filters.hiveId = hiveId;
    if (from) filters.from = from;
    if (to) filters.to = to;

    return findAllReadings(filters);
}

export async function getReadingById(rawId: unknown): Promise<Reading | null> {
    const id = toInteger(rawId, 'id', 1);
    if (id === undefined) throw new InvalidQueryError('Invalid id');
    return findReadingById(id);
}