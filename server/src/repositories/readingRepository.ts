import { pool } from '../config/database.js';
import type { Reading, ReadingFilters, ReadingRow } from '../types/reading.js';

const COLUMNS = `reading_id, hive_id, received_at, f_cnt, temperature_c, humidity_pct,
    bee_count, audio_level_db, audio_freq_hz, state_code, state_code_string,
    battery_mv, rssi, snr, gateway_id`;

// O driver devolve BIGINT como BigInt e DECIMAL como string, o que rebenta no JSON.stringify
const num = (v: unknown): number | null => (v === null || v === undefined ? null : Number(v));

const toReading = (r: ReadingRow): Reading => ({
    id: Number(r.reading_id),
    hiveId: r.hive_id,
    receivedAt: r.received_at,
    fCnt: r.f_cnt,
    temperatureC: num(r.temperature_c),
    humidityPct: num(r.humidity_pct),
    beeCount: r.bee_count,
    audioLevelDb: num(r.audio_level_db),
    audioFreqHz: r.audio_freq_hz,
    stateCode: r.state_code,
    stateCodeString: r.state_code_string,
    batteryMv: r.battery_mv,
    rssi: r.rssi,
    snr: num(r.snr),
    gatewayId: r.gateway_id,
});

export const findAll = async (f: ReadingFilters): Promise<Reading[]> => {
    const where: string[] = [];
    const params: unknown[] = [];

    if (f.hiveId !== undefined) { where.push('hive_id = ?'); params.push(f.hiveId); }
    if (f.from) { where.push('received_at >= ?'); params.push(f.from); }
    if (f.to) { where.push('received_at <= ?'); params.push(f.to); }

    const sql = `SELECT ${COLUMNS} FROM readings
                 ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
                 ORDER BY received_at DESC
                 LIMIT ? OFFSET ?`;

    const rows = await pool.query<ReadingRow[]>(sql, [...params, f.limit, f.offset]);
    return rows.map(toReading);
};

export const findById = async (id: number): Promise<Reading | null> => {
    const rows = await pool.query<ReadingRow[]>(
        `SELECT ${COLUMNS} FROM readings WHERE reading_id = ?`,
        [id]
    );
    const row = rows[0];
    return row ? toReading(row) : null;
};