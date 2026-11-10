const express = require('express');
const app = express();

// Middleware to parse incoming JSON payloads
app.use(express.json());

// Endpoint to receive TTN uplinks
app.post('/api/lora/uplink', (req, res) => {
    try {
        const body = req.body;

        // 1. Extract device information
        const endDeviceId = body.end_device_ids?.device_id;
        const applicationId = body.end_device_ids?.application_ids?.application_id;

        // 2. Extract decoded payload (if a Payload Formatter is used on TTN)
        const decodedPayload = body.uplink_message?.decoded_payload;

        // 3. Extract raw base64 payload (fallback if no formatter is used)
        const rawPayloadBase64 = body.uplink_message?.frm_payload;

        // 4. Extract signal quality metadata
        const rxMetadata = body.uplink_message?.rx_metadata?.[0];
        const rssi = rxMetadata?.rssi;
        const snr = rxMetadata?.snr;

        console.log(`[${new Date().toISOString()}] Uplink from device: ${endDeviceId}`);
        console.log('Decoded Data:', decodedPayload);

        // TODO: Save data to your database (e.g., MariaDB, PostgreSQL, MongoDB)

        // 5. Always send a 200 OK status back to TTN to acknowledge receipt
        res.status(200).send({ status: 'success' });
    } catch (error) {
        console.error('Error processing TTN uplink:', error);
        res.status(500).send({ status: 'error' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`API server listening on port ${PORT}`);
});