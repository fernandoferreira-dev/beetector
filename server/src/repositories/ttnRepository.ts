import { pool } from '../config/database.js';
import type { NewReading } from '../types/reading.js';

export const findHiveIdByDevEui = async (devEui: string): Promise<number | null> => {
    const rows = await pool.query<{ hive_id: number }[]>(
        'SELECT hive_id FROM hives WHERE dev_eui = ?',
        [devEui]
    );
    return rows[0]?.hive_id ?? null;
};

// Insere a leitura e atualiza a colmeia na mesma transação
export const saveReading = async (r: NewReading): Promise<void> => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        await conn.query(
            `INSERT IGNORE INTO readings
       (hive_id, received_at, f_cnt, temperature_c, humidity_pct,
        bee_count, audio_level_db, audio_freq_hz, state_code,
        state_code_string, rssi, snr, gateway_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                r.hiveId, r.receivedAt, r.fCnt, r.temperatureC, r.humidityPct,
                r.beeCount, r.audioLevelDb, r.audioFreqHz, r.stateCode,
                r.stateCodeString, r.rssi, r.snr, r.gatewayId,
            ]
        );

        await conn.query(
            'UPDATE hives SET last_reading_at = ? WHERE hive_id = ?',
            [r.receivedAt, r.hiveId]
        );

        await conn.commit();
    } catch (error) {
        await conn.rollback();
        throw error;
    } finally {
        conn.release();
    }
};