export interface NewReading {
    hiveId: number;
    receivedAt: Date;
    fCnt: number;
    temperatureC: number | null;
    humidityPct: number | null;
    beeCount: number | null;
    audioLevelDb: number | null;
    rssi: number | null;
    snr: number | null;
    gatewayId: string | null;
}
