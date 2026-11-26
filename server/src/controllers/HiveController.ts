import type { Request, Response } from 'express';
import {
    createHive as createHiveRecord,
    deleteHive as deleteHiveRecord,
    getHiveData as findHive,
    HiveError,
    listHives,
    updateHive as updateHiveRecord,
} from '../services/hiveService.js';
import type { HiveUpdate } from '../repositories/hiveRepository.js';

type JsonObject = Record<string, unknown>;

function isJsonObject(value: unknown): value is JsonObject {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function requireUserId(req: Request): number {
    if (!req.user) throw new HiveError('Authentication required', 401);
    return req.user.id;
}

function parseHiveId(value: unknown): number {
    const id = typeof value === 'string' && /^\d+$/.test(value) ? Number(value) : value;
    if (typeof id !== 'number' || !Number.isSafeInteger(id) || id < 1) {
        throw new HiveError('hiveId must be a positive integer', 400);
    }
    return id;
}

function requestHiveId(req: Request): number {
    const body = isJsonObject(req.body) ? req.body : undefined;
    return parseHiveId(req.params.hiveId ?? req.query.hiveId ?? body?.hiveId);
}

function parseHiveChanges(value: unknown): HiveUpdate {
    if (!isJsonObject(value)) {
        throw new HiveError('Hive data is required', 400);
    }

    const allowedFields = new Set([
        'hiveName',
        'hiveLat',
        'hiveLon',
        'favorite',
        'apiaryId',
        'gatewayId',
    ]);
    if (Object.keys(value).some((field) => !allowedFields.has(field))) {
        throw new HiveError('Request contains unsupported hive fields', 400);
    }

    const changes: HiveUpdate = {};
    if ('hiveName' in value) {
        if (value.hiveName !== null && typeof value.hiveName !== 'string') {
            throw new HiveError('hiveName must be a string or null', 400);
        }
        changes.hiveName = value.hiveName;
    }
    if ('hiveLat' in value) {
        if (value.hiveLat !== null && typeof value.hiveLat !== 'number') {
            throw new HiveError('hiveLat must be a number or null', 400);
        }
        changes.hiveLat = value.hiveLat;
    }
    if ('hiveLon' in value) {
        if (value.hiveLon !== null && typeof value.hiveLon !== 'number') {
            throw new HiveError('hiveLon must be a number or null', 400);
        }
        changes.hiveLon = value.hiveLon;
    }
    if ('favorite' in value) {
        if (typeof value.favorite !== 'boolean') {
            throw new HiveError('favorite must be a boolean', 400);
        }
        changes.favorite = value.favorite;
    }
    if ('apiaryId' in value) {
        if (value.apiaryId !== null && typeof value.apiaryId !== 'number') {
            throw new HiveError('apiaryId must be a number or null', 400);
        }
        changes.apiaryId = value.apiaryId;
    }
    if ('gatewayId' in value) {
        if (value.gatewayId !== null && typeof value.gatewayId !== 'number') {
            throw new HiveError('gatewayId must be a number or null', 400);
        }
        changes.gatewayId = value.gatewayId;
    }

    return changes;
}

function sendError(res: Response, error: unknown): void {
    if (error instanceof HiveError) {
        res.status(error.statusCode).json({ error: error.message });
        return;
    }

    console.error(error);
    res.status(500).json({ error: 'Server error' });
}

export async function getAllHives(req: Request, res: Response): Promise<void> {
    try {
        res.status(200).json(await listHives(requireUserId(req)));
    } catch (error) {
        sendError(res, error);
    }
}

export async function getHiveData(req: Request, res: Response): Promise<void> {
    try {
        res.status(200).json(await findHive(requestHiveId(req), requireUserId(req)));
    } catch (error) {
        sendError(res, error);
    }
}

export async function createHive(req: Request, res: Response): Promise<void> {
    try {
        if (!isJsonObject(req.body)) {
            throw new HiveError('Hive data is required', 400);
        }

        const { claimCode, paymentId } = req.body;
        if (typeof claimCode !== 'string' || typeof paymentId !== 'number') {
            throw new HiveError('claimCode and paymentId are required', 400);
        }

        const hive = await createHiveRecord(
            { claimCode, paymentId },
            requireUserId(req)
        );
        res.status(201).json(hive);
    } catch (error) {
        sendError(res, error);
    }
}

export async function updateHive(req: Request, res: Response): Promise<void> {
    try {
        const changes = isJsonObject(req.body) ? { ...req.body } : req.body;
        if (isJsonObject(changes)) delete changes.hiveId;

        const hive = await updateHiveRecord(
            requestHiveId(req),
            parseHiveChanges(changes),
            requireUserId(req)
        );
        res.status(200).json(hive);
    } catch (error) {
        sendError(res, error);
    }
}

export async function deleteHive(req: Request, res: Response): Promise<void> {
    try {
        await deleteHiveRecord(requestHiveId(req), requireUserId(req));
        res.status(204).end();
    } catch (error) {
        sendError(res, error);
    }
}
