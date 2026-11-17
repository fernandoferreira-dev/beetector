import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Reading = Record<string, unknown>;

const API_URL = process.env.EXPO_PUBLIC_API_URL?.trim().replace(/\/+$/, "");
const READING_COLUMNS = [
    "reading_id",
    "hive_id",
    "received_at",
    "f_cnt",
    "temperature_c",
    "humidity_pct",
    "bee_count",
    "audio_level_db",
    "audio_base_db",
    "audio_freq_hz",
    "audio_high_ratio",
    "audio_spectrum",
    "state_code",
    "battery_mv",
    "rssi",
    "snr",
    "gateway_id",
];

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isReadingsResponse(value: unknown): value is { readings: Reading[] } {
    return (
        isRecord(value) &&
        Array.isArray(value.readings) &&
        value.readings.every(isRecord)
    );
}

async function fetchPayload(
    url: string,
    signal?: AbortSignal,
): Promise<unknown> {
    const response = await fetch(url, {
        headers: { Accept: "application/json" },
        signal,
    });

    const text = await response.text();
    let payload: unknown = null;

    if (text) {
        try {
            payload = JSON.parse(text) as unknown;
        } catch {
            throw new Error("O servidor devolveu uma resposta inválida.");
        }
    }

    if (!response.ok) {
        const message =
            isRecord(payload) && typeof payload.error === "string"
                ? payload.error
                : `Pedido falhou (${response.status}).`;
        throw new Error(message);
    }

    return payload;
}

function formatCell(value: unknown): string {
    if (value === null || value === undefined) return "—";
    if (typeof value === "object") return JSON.stringify(value);
    return String(value);
}

export default function ReadingsScreen() {
    const [hiveIds, setHiveIds] = useState<number[]>([]);
    const [selectedHiveId, setSelectedHiveId] = useState<number | null>(null);
    const [readings, setReadings] = useState<Reading[]>([]);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isLoadingIds, setIsLoadingIds] = useState(true);
    const [isLoadingReadings, setIsLoadingReadings] = useState(false);
    const [idsError, setIdsError] = useState("");
    const [readingsError, setReadingsError] = useState("");

    useEffect(() => {
        let isActive = true;

        async function loadHiveIds() {
            if (!API_URL) {
                setIdsError("O URL da API não está configurado.");
                setIsLoadingIds(false);
                return;
            }

            try {
                const payload = await fetchPayload(
                    `${API_URL}/api/sensors/readings/hives`,
                );
                if (!isRecord(payload) || !Array.isArray(payload.hiveIds)) {
                    throw new Error(
                        "A resposta do servidor não contém IDs válidos.",
                    );
                }
                if (isActive) setHiveIds(payload.hiveIds);
            } 
            catch (error) {
                if (isActive) {
                    setIdsError(
                        error instanceof Error
                            ? error.message
                            : "Não foi possível carregar os IDs.",
                    );
                }
            } 
            finally {
                if (isActive) setIsLoadingIds(false);
            }
        }

        void loadHiveIds();
        return () => {
            isActive = false;
        };
    }, 
    []);

    useEffect(() => {
        if (!API_URL || selectedHiveId === null) {
            setReadings([]);
            setIsLoadingReadings(false);
            setReadingsError("");
            return;
        }

        const controller = new AbortController();
        let isActive = true;

        async function loadReadings() {
            setIsLoadingReadings(true);
            setReadings([]);
            setReadingsError("");
            try {
                const payload = await fetchPayload(
                    `${API_URL}/api/sensors/readings?hive_id=${selectedHiveId}`,
                    controller.signal,
                );
                if (!isReadingsResponse(payload)) {
                    throw new Error(
                        "A resposta do servidor não contém leituras válidas.",
                    );
                }
                if (isActive) setReadings(payload.readings);
            } catch (error) {
                if (
                    isActive &&
                    !(error instanceof Error && error.name === "AbortError")
                ) {
                    setReadingsError(
                        error instanceof Error
                            ? error.message
                            : "Não foi possível carregar as leituras.",
                    );
                    setReadings([]);
                }
            } finally {
                if (isActive) setIsLoadingReadings(false);
            }
        }

        void loadReadings();
        return () => {
            isActive = false;
            controller.abort();
        };
    }, [selectedHiveId]);

    return (
        <SafeAreaView className="flex-1 bg-neutral-50">
            <ScrollView contentContainerClassName="gap-3 px-5 py-6">
                <View className="mb-2 gap-1">
                    <Text className="text-2xl font-bold text-neutral-900">
                        Leituras dos sensores
                    </Text>
                    <Text className="text-sm text-neutral-600">
                        Dados recebidos via TTN
                    </Text>
                </View>

                <Text className="text-sm font-semibold text-neutral-800">
                    ID da colmeia
                </Text>
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Escolher ID da colmeia"
                    accessibilityState={{ expanded: isDropdownOpen }}
                    className="min-h-12 flex-row items-center justify-between rounded-xl border border-neutral-300 bg-white px-3.5"
                    onPress={() => setIsDropdownOpen((open) => !open)}
                    disabled={
                        isLoadingIds ||
                        Boolean(idsError) ||
                        hiveIds.length === 0
                    }
                >
                    <Text className="text-base text-neutral-900">
                        {isLoadingIds
                            ? "A carregar IDs..."
                            : selectedHiveId === null
                              ? "Selecionar ID"
                              : String(selectedHiveId)}
                    </Text>
                    <Text className="text-xs text-neutral-600">
                        {isDropdownOpen ? "▲" : "▼"}
                    </Text>
                </Pressable>

                {isLoadingIds && (
                    <ActivityIndicator className="my-2" color="#c2410c" />
                )}
                {idsError ? (
                    <Text className="text-sm text-red-700">{idsError}</Text>
                ) : null}
                {!isLoadingIds && !idsError && hiveIds.length === 0 ? (
                    <Text className="py-2 text-sm text-neutral-600">
                        Ainda não existem leituras guardadas.
                    </Text>
                ) : null}

                {isDropdownOpen && hiveIds.length > 0 ? (
                    <ScrollView
                        className="max-h-56 rounded-xl border border-neutral-200 bg-white"
                        nestedScrollEnabled
                    >
                        {hiveIds.map((hiveId) => (
                            <Pressable
                                key={hiveId}
                                accessibilityRole="button"
                                className={`min-h-11 justify-center border-b border-neutral-200 px-3.5 ${
                                    selectedHiveId === hiveId
                                        ? "bg-orange-50"
                                        : ""
                                }`}
                                onPress={() => {
                                    setSelectedHiveId(hiveId);
                                    setIsDropdownOpen(false);
                                }}
                            >
                                <Text className="text-base text-neutral-900">
                                    {hiveId}
                                </Text>
                            </Pressable>
                        ))}
                    </ScrollView>
                ) : null}

                {selectedHiveId !== null ? (
                    <View className="mt-4 gap-3">
                        <Text className="text-lg font-semibold text-neutral-900">
                            Leituras da colmeia {selectedHiveId}
                        </Text>
                        {isLoadingReadings ? (
                            <ActivityIndicator color="#c2410c" />
                        ) : null}
                        {readingsError ? (
                            <Text className="text-sm text-red-700">
                                {readingsError}
                            </Text>
                        ) : null}
                        {!isLoadingReadings &&
                        !readingsError &&
                        readings.length === 0 ? (
                            <Text className="py-2 text-sm text-neutral-600">
                                Não existem leituras para este ID.
                            </Text>
                        ) : null}
                        {readings.length > 0 ? (
                            <ScrollView
                                horizontal
                                className="rounded-xl border border-neutral-200 bg-white"
                            >
                                <View>
                                    <View className="flex-row">
                                        {READING_COLUMNS.map((column) => (
                                            <Text
                                                key={column}
                                                className="w-[140px] min-h-11 border-b border-r border-neutral-200 bg-neutral-100 px-2 py-2.5 text-xs font-bold text-neutral-900"
                                            >
                                                {column}
                                            </Text>
                                        ))}
                                    </View>
                                    {readings.map((reading, index) => (
                                        <View
                                            key={
                                                formatCell(
                                                    reading.reading_id,
                                                ) || index
                                            }
                                            className={`flex-row ${index % 2 === 1 ? "bg-neutral-50" : ""}`}
                                        >
                                            {READING_COLUMNS.map((column) => (
                                                <Text
                                                    key={column}
                                                    className="w-[140px] min-h-11 border-b border-r border-neutral-200 px-2 py-2.5 text-xs text-neutral-800"
                                                    numberOfLines={3}
                                                >
                                                    {formatCell(
                                                        reading[column],
                                                    )}
                                                </Text>
                                            ))}
                                        </View>
                                    ))}
                                </View>
                            </ScrollView>
                        ) : null}
                    </View>
                ) : null}
            </ScrollView>
        </SafeAreaView>
    );
}
