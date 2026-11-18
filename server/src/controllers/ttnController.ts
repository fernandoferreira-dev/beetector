import type { Request, Response } from "express";
import { timingSafeEqual } from "node:crypto";
import { env } from "../config/env.js";
import {
    findHiveIdsWithReadings,
    findReadingsByHiveId,
} from "../repositories/ttnRepository.js";
import { InvalidPayloadError, processUplink } from "../services/ttnService.js";

function serializeJsonValue(value: unknown): unknown {
    if (typeof value === "bigint") {
        return Number.isSafeInteger(Number(value)) ? Number(value) : value.toString();
    }
    if (Array.isArray(value)) {
        return value.map(serializeJsonValue);
    }
    if (value && typeof value === "object") {
        return Object.fromEntries(
            Object.entries(value).map(([key, nestedValue]) => [
                key,
                serializeJsonValue(nestedValue),
            ]),
        );
    }
    return value;
}

export const listReadingHiveIds = async (_req: Request, res: Response) => {
    try {
        const hiveIds = await findHiveIdsWithReadings();
        res.json(serializeJsonValue({ hiveIds }));
    } catch (error) {
        console.error("ttn - failed to fetch reading hive IDs:", error);
        res.status(500).json({ error: "failed to fetch reading hive IDs" });
    }
};

export const listReadings = async (req: Request, res: Response) => {
    const rawHiveId = req.query.hive_id;
    if (typeof rawHiveId !== "string" || !/^[1-9]\d*$/.test(rawHiveId)) {
        // /^[1-9]\d*$/ expressão para verificar se é um número inteiro positivo 
        res.status(400).json({ error: "A valid hive_id is required" });
        return;
    }

    const hiveId = Number(rawHiveId);
    if (!Number.isSafeInteger(hiveId)) {
        res.status(400).json({ error: "A valid hive_id is required" });
        return;
    }

    try {
        const readings = await findReadingsByHiveId(hiveId);
        res.json(serializeJsonValue({ readings }));
    } catch (error) {
        console.error("ttn - failed to fetch readings:", error);
        res.status(500).json({ error: "failed to fetch readings" });
    }
};

function secretOk(received: string): boolean {
    const a = Buffer.from(received);
    const b = Buffer.from(env.ttnWebhookSecret);
    return a.length === b.length && timingSafeEqual(a, b);
}

export const uplink = async (req: Request, res: Response) => {
    if (!secretOk(req.header("x-webhook-secret") ?? "")) {
        res.status(401).json({ error: "Unauthorized" });
        return;
    }

    console.log("[TTN] Uplink received:", req.body);

    try {
        const result = await processUplink(req.body);

        if (result === "unknown_device") {
            // 200 para o TTN não repetir o pedido
            res.status(200).json({ ignored: "unknown device" });
            return;
        }

        res.sendStatus(200);
    } catch (error) {
        if (error instanceof InvalidPayloadError) {
            res.status(400).json({ error: error.message });
            return;
        }
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
};
