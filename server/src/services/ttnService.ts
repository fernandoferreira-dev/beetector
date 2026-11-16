import { findHiveIdByDevEui, saveReading } from '../repositories/ttnRepository.js';

export class InvalidPayloadError extends Error { }

export type UplinkResult = 'saved' | 'unknown_device';

// Só os campos que usamos do corpo do webhook do TTN
interface TtnUplinkBody {
    end_device_ids?: { dev_eui?: string };
    received_at?: string;
    uplink_message?: {
        f_cnt?: number;
        received_at?: string;
        decoded_payload?: {
            temperature?: number | null;
            humidity?: number | null;
            sound_dbfs?: number | null;
        };
        rx_metadata?: {
            rssi?: number;
            snr?: number;
            gateway_ids?: { gateway_id?: string };
        }[];
    };
}

export const processUplink = async (body: TtnUplinkBody): Promise<UplinkResult> => {
    const devEui = body?.end_device_ids?.dev_eui;
    const up = body?.uplink_message;
    const decoded = up?.decoded_payload;

    if (!devEui || !up || !decoded) {
        throw new InvalidPayloadError('Missing dev_eui, uplink_message or decoded_payload');
    }

    const receivedAt = new Date(up.received_at ?? body.received_at ?? '');
    if (Number.isNaN(receivedAt.getTime())) {
        throw new InvalidPayloadError('Invalid received_at');
    }

    const hiveId = await findHiveIdByDevEui(devEui.toUpperCase());
    if (hiveId === null) return 'unknown_device';

    const rx = up.rx_metadata?.[0];

    await saveReading({
        hiveId,
        receivedAt,
        fCnt: up.f_cnt ?? 0, // o TTN omite f_cnt quando é 0
        temperatureC: decoded.temperature ?? null,
        humidityPct: decoded.humidity ?? null,
        audioLevelDb: decoded.sound_dbfs ?? null,
        rssi: rx?.rssi ?? null,
        snr: rx?.snr ?? null,
        gatewayId: rx?.gateway_ids?.gateway_id ?? null,
    });

    return 'saved';
};