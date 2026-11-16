import { pool } from '../config/database.js';

export interface NewReading {
    hiveId: number;
    receivedAt: Date;
    fCnt: number;
    temperatureC: number | null;
    humidityPct: number | null;
    audioLevelDb: number | null;
    rssi: number | null;
    snr: number | null;
    gatewayId: string | null;
}

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
                audio_level_db, rssi, snr, gateway_id)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                r.hiveId, r.receivedAt, r.fCnt, r.temperatureC, r.humidityPct,
                r.audioLevelDb, r.rssi, r.snr, r.gatewayId,
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