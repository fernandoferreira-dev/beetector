function required(name: string): string {
    const value = process.env[name]?.trim();
    if (!value) throw new Error(`Missing environment variable: ${name}`);
    return value;
}

function optional(name: string, fallback = ''): string {
    return process.env[name]?.trim() || fallback;
}

function secret(name: string): string {
    const value = required(name);
    if (Buffer.byteLength(value, 'utf8') < 32) {
        throw new Error(`${name} must be at least 32 bytes`);
    }
    return value;
}

function port(name: string): number {
    const value = Number(required(name));
    if (!Number.isInteger(value) || value < 1 || value > 65535) {
        throw new Error(`${name} must be a number between 1 and 65535`);
    }
    return value;
}

export const env = {
    serverPort: port('SERVER_PORT'),
    clientUrl: required('CLIENT_URL'),
    sessionSecret: secret('SESSION_SECRET'),

    dbHost: required('DB_HOST'),
    dbPort: port('DB_PORT'),
    dbUser: required('DB_USER'),
    dbPassword: required('DB_PASSWORD'),
    dbName: required('DB_NAME'),

    ttnAppId: required('TTN_APP_ID'),
    ttnEndDeviceId: required('TTN_END_DEVICE_ID'),
    ttnAccessKey: required('TTN_ACCESS_KEY'),
    ttnWebhookSecret: required('TTN_WEBHOOK_SECRET'),

    googleClientId: optional('GOOGLE_CLIENT_ID'),
    googleClientSecret: optional('GOOGLE_CLIENT_SECRET'),
    googleCallbackUrl: optional('GOOGLE_CALLBACK_URL'),
};