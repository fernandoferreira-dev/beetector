import { findHiveIdByDevEui, saveReading } from '../repositories/ttnRepository.js';
import type { TtnUplinkBody, UplinkResult } from '../types/ttn.js';

export class InvalidPayloadError extends Error { }

export async function processUplink(body: TtnUplinkBody): Promise<UplinkResult> {
    // Estes são os dados mínimos necessários para transformar o uplink numa leitura.
    const devEui = body?.end_device_ids?.dev_eui;
    const uplink = body?.uplink_message;
    const decoded = uplink?.decoded_payload;

    if (!devEui || !uplink || !decoded) {
        throw new InvalidPayloadError('Missing dev_eui, uplink_message or decoded_payload');
    }

    // O decoder atual agrupa as leituras dentro de hives; o formato antigo era plano.
    const reading = decoded.hives?.[0] ?? decoded;

    // Usamos o horário da mensagem; o horário do evento é o plano B.
    const receivedAt = new Date(uplink.received_at ?? body.received_at ?? '');
    if (Number.isNaN(receivedAt.getTime())) {
        throw new InvalidPayloadError('Invalid received_at');
    }

    // O dev_eui liga o dispositivo LoRa à colmeia cadastrada no sistema.
    const hiveId = await findHiveIdByDevEui(devEui.toUpperCase());
    if (hiveId === null) return 'unknown_device';

    // O primeiro gateway contém os dados de sinal usados nesta leitura.
    const gateway = uplink.rx_metadata?.[0];

    // Aqui o formato do TTN é convertido para o formato usado pelo banco.
    await saveReading({
        hiveId,
        receivedAt,
        fCnt: uplink.f_cnt ?? 0,
        temperatureC: reading.temperature ?? null,
        humidityPct: reading.humidity ?? null,
        beeCount: reading.beam_count ?? reading.bee_count ?? null,
        audioLevelDb: reading.sound_dbfs ?? null,
        audioFreqHz: reading.freq_hz ?? null,
        stateCode: reading.state_last_code ?? null,
        batteryMv: reading.battery_mv ?? null,
        rssi: gateway?.rssi ?? null,
        snr: gateway?.snr ?? null,
        gatewayId: gateway?.gateway_ids?.gateway_id ?? null,
    });

    return 'saved';
}