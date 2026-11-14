function requiredEnv(name: string): string {
    const value = process.env[name]?.trim();

    if (!value) {
        throw new Error(`Missing required environment variable: ${name}`);
    }

    return value;
}

function optionalEnv(name: string, fallback = ''): string {
    return process.env[name]?.trim() || fallback;
}

function requiredPort(name: string): number {
    const value = requiredEnv(name);
    const port = Number(value);

    if (!Number.isInteger(port) || port < 1 || port > 65535) {
        throw new Error(`Invalid ${name}: expected an integer between 1 and 65535`);
    }

    return port;
}

export const env = {
    serverPort: requiredPort('SERVER_PORT'),
    clientUrl: requiredEnv('CLIENT_URL'),
    sessionSecret: optionalEnv('SESSION_SECRET'),

    dbHost: requiredEnv('DB_HOST'),
    dbPort: requiredPort('DB_PORT'),
    dbUser: requiredEnv('DB_USER'),
    dbPassword: requiredEnv('DB_PASSWORD'),
    dbName: requiredEnv('DB_NAME'),

    ttnAppId: requiredEnv('TTN_APP_ID'),
    ttnEndDeviceId: requiredEnv('TTN_END_DEVICE_ID'),
    ttnAccessKey: requiredEnv('TTN_ACCESS_KEY'),

    googleClientId: optionalEnv('GOOGLE_CLIENT_ID'),
    googleClientSecret: optionalEnv('GOOGLE_CLIENT_SECRET'),
    googleCallbackUrl: optionalEnv('GOOGLE_CALLBACK_URL'),
} as const;