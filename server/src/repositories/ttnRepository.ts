import { pool } from '../config/database.js';
import type { NewReading } from '../types/reading.js';

export async function findHiveIdByDevEui(devEui: string): Promise<number | null> {
    // Antes de guardar a leitura, descobrimos a colmeia dona do dispositivo.
    const rows = await pool.query<{ hive_id: number }[]>(
        'SELECT hive_id FROM hives WHERE dev_eui = ?',
        [devEui]
    );
    return rows[0]?.hive_id ?? null;
}

export async function saveReading(reading: NewReading): Promise<void> {
    const connection = await pool.getConnection();

    try {
        // A leitura e o horário da última leitura da colmeia precisam ser atualizados juntos.
        await connection.beginTransaction();

        await connection.query(
            `INSERT IGNORE INTO readings
                (hive_id, received_at, f_cnt, temperature_c, humidity_pct,
                 bee_count, audio_level_db, audio_freq_hz, state_code,
                 battery_mv, rssi, snr, gateway_id)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                reading.hiveId,
                reading.receivedAt,
                reading.fCnt,
                reading.temperatureC,
                reading.humidityPct,
                reading.beeCount,
                reading.audioLevelDb,
                reading.audioFreqHz,
                reading.stateCode,
                reading.batteryMv,
                reading.rssi,
                reading.snr,
                reading.gatewayId,
            ]
        );

        await connection.query(
            'UPDATE hives SET last_reading_at = ? WHERE hive_id = ?',
            [reading.receivedAt, reading.hiveId]
        );

        await connection.commit();
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}