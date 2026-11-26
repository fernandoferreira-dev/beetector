import {
    deleteHive as deleteHiveRecord,
    getHiveData as findHive,
    getHivesByUser,
    registerHive,
    updateHive as updateHiveRecord,
    userOwnsApiary,
    userOwnsGateway,
    type HiveUpdate,
} from '../repositories/hiveRepository.js';

export class HiveError extends Error {
    constructor(message: string, public statusCode: number) {
        super(message);
        this.name = 'HiveError';
    }
}

function assertId(id: number, field: string): void {
    if (!Number.isSafeInteger(id) || id < 1) {
        throw new HiveError(`${field} must be a positive integer`, 400);
    }
}

function validateLocation(
    value: number | null | undefined,
    field: string,
    min: number,
    max: number
): void {
    if (
        value !== undefined &&
        value !== null &&
        (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max)
    ) {
        throw new HiveError(`${field} must be between ${min} and ${max}`, 400);
    }
}

function validateChanges(changes: HiveUpdate): void {
    const allowedFields = new Set([
        'hiveName',
        'hiveLat',
        'hiveLon',
        'favorite',
        'apiaryId',
        'gatewayId',
    ]);
    if (Object.keys(changes).some((field) => !allowedFields.has(field))) {
        throw new HiveError('Request contains unsupported hive fields', 400);
    }

    if (changes.hiveName !== undefined && changes.hiveName !== null) {
        if (
            typeof changes.hiveName !== 'string' ||
            changes.hiveName.trim().length === 0 ||
            changes.hiveName.length > 100
        ) {
            throw new HiveError('hiveName must contain 1 to 100 characters, or be null', 400);
        }
    }
    validateLocation(changes.hiveLat, 'hiveLat', -90, 90);
    validateLocation(changes.hiveLon, 'hiveLon', -180, 180);
    if (changes.favorite !== undefined && typeof changes.favorite !== 'boolean') {
        throw new HiveError('favorite must be a boolean', 400);
    }
    if (changes.apiaryId !== undefined && changes.apiaryId !== null) {
        assertId(changes.apiaryId, 'apiaryId');
    }
    if (changes.gatewayId !== undefined && changes.gatewayId !== null) {
        assertId(changes.gatewayId, 'gatewayId');
    }
    if (Object.values(changes).every((value) => value === undefined)) {
        throw new HiveError('At least one hive field must be provided', 400);
    }
}

function isDuplicateEntryError(error: unknown): boolean {
    return (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 'ER_DUP_ENTRY'
    );
}

async function requireOwnedHive(hiveId: number, userId: number) {
    assertId(hiveId, 'hiveId');
    assertId(userId, 'userId');
    const hive = await findHive(hiveId, userId);
    if (!hive) throw new HiveError('Hive not found', 404);
    return hive;
}

export async function listHives(userId: number) {
    assertId(userId, 'userId');
    return getHivesByUser(userId);
}

export async function getHiveData(hiveId: number, userId: number) {
    return requireOwnedHive(hiveId, userId);
}

export async function createHive(
    input: { claimCode: string; paymentId: number },
    userId: number
) {
    assertId(userId, 'userId');
    if (typeof input !== 'object' || input === null || Array.isArray(input)) {
        throw new HiveError('Os dados da colmeia são obrigatórios', 400);
    }
    assertId(input.paymentId, 'paymentId');
    if (
        typeof input.claimCode !== 'string' ||
        input.claimCode.trim().length === 0 ||
        input.claimCode.length > 50
    ) {
        throw new HiveError('O código deve conter entre 1 e 50 caracteres', 400);
    }

    const result = await registerHive({
        claimCode: input.claimCode.trim(),
        paymentId: input.paymentId,
        userId,
    }).catch((error: unknown) => {
        if (isDuplicateEntryError(error)) {
            throw new HiveError('Código de reivindicação já registado', 409);
        }
        throw error;
    });

    if (result.affectedRows === 0) {
        throw new HiveError('Pagamento não encontrado para este utilizador', 404);
    }

    return findHive(Number(result.insertId), userId);
}

export async function updateHive(hiveId: number, changes: HiveUpdate, userId: number) {
    await requireOwnedHive(hiveId, userId);
    if (typeof changes !== 'object' || changes === null || Array.isArray(changes)) {
        throw new HiveError('Os dados da colmeia são obrigatórios', 400);
    }
    validateChanges(changes);

    if (changes.apiaryId !== undefined && changes.apiaryId !== null &&
        !(await userOwnsApiary(changes.apiaryId, userId))) {
        throw new HiveError('Apiário não encontrado para este utilizador', 404);
    }
    if (changes.gatewayId !== undefined && changes.gatewayId !== null &&
        !(await userOwnsGateway(changes.gatewayId, userId))) {
        throw new HiveError('Gateway não encontrado para este utilizador', 404);
    }

    const normalizedChanges: HiveUpdate = {
        ...changes,
        ...(changes.hiveName !== undefined && changes.hiveName !== null
            ? { hiveName: changes.hiveName.trim() }
            : {}),
    };
    await updateHiveRecord(hiveId, userId, normalizedChanges);
    return requireOwnedHive(hiveId, userId);
}

export async function deleteHive(hiveId: number, userId: number): Promise<void> {
    await requireOwnedHive(hiveId, userId);
    const result = await deleteHiveRecord(hiveId, userId);
    if (result.affectedRows === 0) throw new HiveError('Colmeia não encontrada', 404);
}
