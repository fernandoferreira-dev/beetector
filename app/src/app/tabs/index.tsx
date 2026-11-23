import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import BeeIcon from "../../../assets/images/hiveStatus.svg";

export default function HomeScreen() {
    return (
        <SafeAreaView className="flex-1 bg-[#faf9f6] px-5">
            <View className="flex-1 items-center justify-top size-100">
                <View className="relative">
                    <BeeIcon width={220} height={213} />
                    <View pointerEvents="none" className="absolute inset-0 items-center justify-center">
                        <Text className="text-center text-4xl font-bold text-[#171717]">
                            Estado:
                        </Text>
                    </View>
                </View>
            </View>
        </SafeAreaView>
    );
}
