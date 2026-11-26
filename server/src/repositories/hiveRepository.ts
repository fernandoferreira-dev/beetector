import { pool } from '../config/database.js';

export interface HiveRow {
    hive_id: number;
    hive_claim_code: string;
    payment_id: number;
    user_id: number | null;
    apiary_id: number | null;
    gateway_id: number | null;
    hive_name: string | null;
    hive_serial: string | null;
    c6_id: string | null;
    hive_lat: number | string | null;
    hive_lon: number | string | null;
    battery_percentage: number | null;
    hive_activated_at: Date | null;
    favorite: boolean | number;
}

export interface NewHive {
    claimCode: string;
    paymentId: number;
    userId: number;
}

export interface HiveUpdate {
    hiveName?: string | null;
    hiveLat?: number | null;
    hiveLon?: number | null;
    favorite?: boolean;
    apiaryId?: number | null;
    gatewayId?: number | null;
}

interface MutationResult {
    affectedRows: number;
    insertId: number;
}

export async function getHiveData(hiveId: number, userId: number): Promise<HiveRow | null> {
    const rows = await pool.query<HiveRow[]>(
        `SELECT hive_id, hive_claim_code, payment_id, user_id, apiary_id, gateway_id,
                hive_name, hive_serial, c6_id, hive_lat, hive_lon, battery_percentage,
                hive_activated_at, favorite
         FROM hives
         WHERE hive_id = ? AND user_id = ?
         LIMIT 1`,
        [hiveId, userId]
    );

    return rows[0] ?? null;
}

export async function getHivesByUser(userId: number): Promise<HiveRow[]> {
    return pool.query<HiveRow[]>(
        `SELECT hive_id, hive_claim_code, payment_id, user_id, apiary_id, gateway_id,
                hive_name, hive_serial, c6_id, hive_lat, hive_lon, battery_percentage,
                hive_activated_at, favorite
         FROM hives
         WHERE user_id = ?
         ORDER BY hive_id`,
        [userId]
    );
}

export async function userOwnsApiary(apiaryId: number, userId: number): Promise<boolean> {
    const rows = await pool.query<{ apiary_id: number }[]>(
        'SELECT apiary_id FROM apiaries WHERE apiary_id = ? AND user_id = ? LIMIT 1',
        [apiaryId, userId]
    );
    return rows.length > 0;
}

export async function userOwnsGateway(gatewayId: number, userId: number): Promise<boolean> {
    const rows = await pool.query<{ gateway_id: number }[]>(
        'SELECT gateway_id FROM gateways WHERE gateway_id = ? AND user_id = ? LIMIT 1',
        [gatewayId, userId]
    );
    return rows.length > 0;
}

export async function registerHive(hive: NewHive): Promise<MutationResult> {
    return pool.query<MutationResult>(
        `INSERT INTO hives (hive_claim_code, payment_id, user_id)
         SELECT ?, payment_id, user_id
         FROM payments
         WHERE payment_id = ? AND user_id = ?`,
        [hive.claimCode, hive.paymentId, hive.userId]
    );
}

export async function associateHive(
    hiveId: number,
    userId: number,
    hiveData: { apiaryId: number | null; gatewayId: number | null }
): Promise<MutationResult> {
    return pool.query<MutationResult>(
        `UPDATE hives
         SET apiary_id = ?, gateway_id = ?
         WHERE hive_id = ? AND user_id = ?`,
        [hiveData.apiaryId, hiveData.gatewayId, hiveId, userId]
    );
}

export async function updateHive(
    hiveId: number,
    userId: number,
    hiveData: HiveUpdate
): Promise<MutationResult> {
    const entries: [string, string | number | boolean | null][] = [];
    if (hiveData.hiveName !== undefined) entries.push(['hive_name', hiveData.hiveName]);
    if (hiveData.hiveLat !== undefined) entries.push(['hive_lat', hiveData.hiveLat]);
    if (hiveData.hiveLon !== undefined) entries.push(['hive_lon', hiveData.hiveLon]);
    if (hiveData.favorite !== undefined) entries.push(['favorite', hiveData.favorite]);
    if (hiveData.apiaryId !== undefined) entries.push(['apiary_id', hiveData.apiaryId]);
    if (hiveData.gatewayId !== undefined) entries.push(['gateway_id', hiveData.gatewayId]);

    if (entries.length === 0) {
        throw new Error('At least one hive field must be provided');
    }

    const assignments = entries.map(([column]) => `${column} = ?`).join(', ');
    const values = entries.map(([, value]) => value);

    return pool.query<MutationResult>(
        `UPDATE hives
         SET ${assignments}
         WHERE hive_id = ? AND user_id = ?`,
        [...values, hiveId, userId]
    );
}

export async function deleteHive(hiveId: number, userId: number): Promise<MutationResult> {
    return pool.query<MutationResult>(
        'DELETE FROM hives WHERE hive_id = ? AND user_id = ?',
        [hiveId, userId]
    );
}
