import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import readings from "../../../../demoData.json";

export default function DemoDataScreen() {
    return (
        <SafeAreaView className="flex-1 bg-neutral-50">
            <ScrollView className="flex-1" contentContainerClassName="gap-4 px-5 py-6">
                <View className="gap-1">
                    <Text className="text-2xl font-bold text-neutral-900">
                        Leituras dos sensores
                    </Text>
                    <Text className="text-sm text-neutral-600">
                        Dados de demonstração
                    </Text>
                </View>
                {readings.map((reading) => (
                    <View
                        key={`${reading.sensor_id}-${reading.time}`} 
                        className="gap-4 rounded-2xl border border-neutral-200 bg-white p-4">
                        <View className="gap-1">
                            <Text className="text-base font-semibold text-neutral-900">
                                {reading.sensor_id}
                            </Text>
                            <Text className="text-sm text-neutral-500">
                                {new Date(reading.time).toLocaleString("pt-PT")}
                            </Text>
                        </View>
                        <View className="flex-row gap-3">
                            <View className="flex-1 rounded-xl bg-orange-50 p-3">
                                <Text className="text-sm text-neutral-600">
                                    Temperatura
                                </Text>
                                <Text className="mt-1 text-xl font-bold text-neutral-900">
                                    {reading.temperature} °C
                                </Text>
                            </View>
                            <View className="flex-1 rounded-xl bg-sky-50 p-3">
                                <Text className="text-sm text-neutral-600">
                                    Humidade
                                </Text>
                                <Text className="mt-1 text-xl font-bold text-neutral-900">
                                    {reading.humidity}%
                                </Text>
                            </View>
                        </View>
                    </View>
                ))}
            </ScrollView>
        </SafeAreaView>
    );
}
