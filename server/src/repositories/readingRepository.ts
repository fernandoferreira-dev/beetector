import { pool } from '../config/database.js';
import type { Reading, ReadingFilters, ReadingRow } from '../types/reading.js';

const COLUMNS = `reading_id, hive_id, received_at, f_cnt, temperature_c, humidity_pct,
    bee_count, audio_level_db, audio_freq_hz, state_code,
    battery_mv, rssi, snr, gateway_id`;

function toNumber(value: unknown): number | null {
    if (value === null || value === undefined) return null;
    return Number(value);
}

function toReading(row: ReadingRow): Reading {
    return {
        id: Number(row.reading_id),
        hiveId: row.hive_id,
        receivedAt: row.received_at,
        fCnt: row.f_cnt,
        temperatureC: toNumber(row.temperature_c),
        humidityPct: toNumber(row.humidity_pct),
        beeCount: row.bee_count,
        audioLevelDb: toNumber(row.audio_level_db),
        audioFreqHz: row.audio_freq_hz,
        stateCode: row.state_code,
        batteryMv: row.battery_mv,
        rssi: row.rssi,
        snr: toNumber(row.snr),
        gatewayId: row.gateway_id,
    };
}

export async function findAllReadings(filters: ReadingFilters): Promise<Reading[]> {
    const conditions: string[] = [];
    const values: unknown[] = [];

    if (filters.hiveId !== undefined) {
        conditions.push('hive_id = ?');
        values.push(filters.hiveId);
    }
    if (filters.from) {
        conditions.push('received_at >= ?');
        values.push(filters.from);
    }
    if (filters.to) {
        conditions.push('received_at <= ?');
        values.push(filters.to);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const sql = `SELECT ${COLUMNS} FROM readings ${where}
        ORDER BY received_at DESC LIMIT ? OFFSET ?`;

    const rows = await pool.query<ReadingRow[]>(sql, [...values, filters.limit, filters.offset]);
    return rows.map(toReading);
}

export async function findReadingById(id: number): Promise<Reading | null> {
    const rows = await pool.query<ReadingRow[]>(
        `SELECT ${COLUMNS} FROM readings WHERE reading_id = ?`,
        [id]
    );
    return rows[0] ? toReading(rows[0]) : null;
}