import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
    return (
        <SafeAreaView edges={['left', 'right']} className="flex-1 bg-[#faf9f6] px-5">

            <View className="bg-white rounded-xl mb-4 overflow-hidden">
                <Text>Colmeias Afixadas:</Text>
            </View>
        </SafeAreaView>
    );
}