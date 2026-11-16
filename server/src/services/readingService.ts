import * as readingRepository from '../repositories/readingRepository.js';
import type { Reading, ReadingFilters } from '../types/reading.js';

export class InvalidQueryError extends Error { }

const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 1000;

const toInt = (value: unknown, name: string, min: number): number | undefined => {
    if (value === undefined || value === '') return undefined;
    const n = Number(value);
    if (!Number.isInteger(n) || n < min) throw new InvalidQueryError(`Invalid ${name}`);
    return n;
};

const toDate = (value: unknown, name: string): Date | undefined => {
    if (value === undefined || value === '') return undefined;
    const d = new Date(String(value));
    if (Number.isNaN(d.getTime())) throw new InvalidQueryError(`Invalid ${name}`);
    return d;
};

export const getAll = async (query: Record<string, unknown>): Promise<Reading[]> => {
    const filters: ReadingFilters = {
        limit: Math.min(toInt(query.limit, 'limit', 1) ?? DEFAULT_LIMIT, MAX_LIMIT),
        offset: toInt(query.offset, 'offset', 0) ?? 0,
    };

    const hiveId = toInt(query.hiveId, 'hiveId', 1);
    const from = toDate(query.from, 'from');
    const to = toDate(query.to, 'to');
    if (hiveId !== undefined) filters.hiveId = hiveId;
    if (from) filters.from = from;
    if (to) filters.to = to;

    return readingRepository.findAll(filters);
};

export const getById = async (rawId: unknown): Promise<Reading | null> => {
    const id = toInt(rawId, 'id', 1);
    if (id === undefined) throw new InvalidQueryError('Invalid id');
    return readingRepository.findById(id);
};