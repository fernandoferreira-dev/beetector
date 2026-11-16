#!/usr/bin/env bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/../../.env"

WEBHOOK_URL=$(grep -E '^WEBHOOK_URL=' "$ENV_FILE" | cut -d '=' -f2- | tr -d "\"'")
TTN_WEBHOOK_SECRET=$(grep -E '^TTN_WEBHOOK_SECRET=' "$ENV_FILE" | cut -d '=' -f2- | tr -d "\"'")

curl -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Secret: $TTN_WEBHOOK_SECRET" \
  -d '{
    "end_device_ids": {
      "device_id": "beetectorlora1",
      "application_ids": {
        "application_id": "beetector"
      },
      "dev_eui": "70B3D57ED0079CA6",
      "join_eui": "0000000000000000",
      "dev_addr": "260BB452"
    },
    "correlation_ids": [
      "gs:uplink:01M7JNBSDY4ZWWMWP6XV0D93H1"
    ],
    "received_at": "2026-11-16T17:09:34.476641531Z",
    "uplink_message": {
      "session_key_id": "AaHk49xL0JH790AuP4xyHg==",
      "f_port": 1,
      "f_cnt": 9,
      "frm_payload": "4QBO4TgAESc=",
      "decoded_payload": {
        "bee_count": 56,
        "freq_hz": 156,
        "humidity": 78,
        "sound_dbfs": -31,
        "state_last": "CALMA",
        "state_last_code": 1,
        "state_worst": "CALMA",
        "state_worst_code": 1,
        "temperature": 22.5
      },
      "rx_metadata": [
        {
          "gateway_ids": {
            "gateway_id": "id-7076ff0056082d11",
            "eui": "7076FF0056082D11"
          },
          "time": "2026-11-16T17:09:34.231Z",
          "timestamp": 434890116,
          "rssi": -98,
          "channel_rssi": -98,
          "snr": 8.7,
          "location": {
            "latitude": 38.5211906433105,
            "longitude": -8.83887577056885,
            "altitude": 34,
            "source": "SOURCE_REGISTRY"
          },
          "uplink_token": "CiEKHwoTaWQtNzA3NmZmMDA1NjA4MmQxMRIIcHb/AFYILREQhMuvzwEaDAjO8ezXBhDYk8CAASCgl+KL1NOPASoLCM7x7NcGEMCPk24=",
          "channel_index": 6,
          "gps_time": "2026-11-16T17:09:34.231Z",
          "received_at": "2026-11-16T17:09:34.269486552Z"
        }
      ],
      "settings": {
        "data_rate": {
          "lora": {
            "bandwidth": 125000,
            "spreading_factor": 7,
            "coding_rate": "4/5"
          }
        },
        "frequency": "868300000",
        "timestamp": 434890116,
        "time": "2026-11-16T17:09:34.231Z"
      },
      "received_at": "2026-11-16T17:09:34.271274380Z",
      "consumed_airtime": "0.056576s",
      "packet_error_rate": 0.16666667,
      "network_ids": {
        "net_id": "000013",
        "ns_id": "EC656E0000000181",
        "tenant_id": "ttn",
        "cluster_id": "eu1",
        "cluster_address": "eu1.cloud.thethings.network"
      }
    }
  }'