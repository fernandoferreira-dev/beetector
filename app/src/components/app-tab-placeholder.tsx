import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface AppTabPlaceholderProps {
    title: string;
}

export function AppTabPlaceholder({ title }: AppTabPlaceholderProps) {
    return (
        <SafeAreaView
            edges={["left", "right"]}
            className="flex-1 bg-[#faf9f6] px-5"
        >
            <View className="flex-1 items-center justify-center">
                <Text className="text-2xl font-bold text-[#171717]">
                    {title}
                </Text>
            </View>
        </SafeAreaView>
    );
}
