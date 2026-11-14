import { Link } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import BeeIcon from '../../../assets/images/bee.svg';

export default function HomeScreen() {
    return (
        <SafeAreaView className="flex-1 bg-[#faf9f6] px-5">
            <View className="flex-1 items-center justify-center">
                <BeeIcon width={96} height={96} style={{ marginBottom: 20 }} />
                <Text className="text-center text-4xl font-bold text-[#171717]">Beetector</Text>
                <Text className="mt-3 text-center text-base text-[#806c0b]">
                    Monitoriza a saúde das tuas colmeias
                </Text>

                <Link href="/login" asChild>
                    <Pressable className="mt-10 h-14 w-full max-w-[360px] items-center justify-center rounded-xl bg-[#f99d08] active:opacity-70">
                        <Text className="text-base font-bold text-white">Entrar na aplicação</Text>
                    </Pressable>
                </Link>
            </View>
        </SafeAreaView>
    );
}
