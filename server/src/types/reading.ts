export interface ReadingRow {
    reading_id: bigint | number;
    hive_id: number;
    received_at: Date;
    f_cnt: number | null;
    temperature_c: string | number | null;
    humidity_pct: string | number | null;
    bee_count: number | null;
    audio_level_db: string | number | null;
    audio_freq_hz: number | null;
    state_code: number | null;
    state_code_string: string | null;
    battery_mv: number | null;
    rssi: number | null;
    snr: string | number | null;
    gateway_id: string | null;
}

export interface Reading {
    id: number;
    hiveId: number;
    receivedAt: Date;
    fCnt: number | null;
    temperatureC: number | null;
    humidityPct: number | null;
    beeCount: number | null;
    audioLevelDb: number | null;
    audioFreqHz: number | null;
    stateCode: number | null;
    stateCodeString: string | null;
    batteryMv: number | null;
    rssi: number | null;
    snr: number | null;
    gatewayId: string | null;
}

export interface ReadingFilters {
    hiveId?: number;
    from?: Date;
    to?: Date;
    limit: number;
    offset: number;
}

export interface NewReading {
    hiveId: number;
    receivedAt: Date;
    fCnt: number;
    temperatureC: number | null;
    humidityPct: number | null;
    beeCount: number | null;
    audioLevelDb: number | null;
    audioFreqHz: number | null;
    stateCode: number | null;
    stateCodeString: string | null;
    rssi: number | null;
    snr: number | null;
    gatewayId: string | null;
}