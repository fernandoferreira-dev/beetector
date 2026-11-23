export type UplinkResult = 'saved' | 'unknown_device';

export interface TtnUplinkBody {
    end_device_ids?: { dev_eui?: string };
    received_at?: string;
    uplink_message?: {
        f_cnt?: number;
        received_at?: string;
        decoded_payload?: {
            hive_count?: number;
            hives?: {
                hive_id?: string;
                temperature?: number | null;
                humidity?: number | null;
                bee_count?: number | null;
                beam_count?: number | null;
                sound_dbfs?: number | null;
                state_last?: string | null;
                state_last_code?: number | null;
                freq_hz?: number | null;
                battery_mv?: number | null;
            }[];
            temperature?: number | null;
            humidity?: number | null;
            beam_count?: number | null;
            bee_count?: number | null;
            sound_dbfs?: number | null;
            state_last?: string | null;
            state_last_code?: number | null;
            freq_hz?: number | null;
            battery_mv?: number | null;
        };
        rx_metadata?: {
            rssi?: number;
            snr?: number;
            gateway_ids?: { gateway_id?: string };
        }[];
    };
}
