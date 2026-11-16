export type UplinkResult = 'saved' | 'unknown_device';

export interface TtnUplinkBody {
    end_device_ids?: { dev_eui?: string };
    received_at?: string;
    uplink_message?: {
        f_cnt?: number;
        received_at?: string;
        decoded_payload?: {
            temperature?: number | null;
            humidity?: number | null;
            bee_count?: number | null;
            sound_dbfs?: number | null;
        };
        rx_metadata?: {
            rssi?: number;
            snr?: number;
            gateway_ids?: { gateway_id?: string };
        }[];
    };
}
