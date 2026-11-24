import { Slot } from 'expo-router';
import { View } from 'react-native';

import AppTabs from '@/components/app-tabs';

export default function TabLayout() {
    return (
        <View className="flex-1 bg-[#faf9f6]">
            <Slot />
            <AppTabs />
        </View>
    );
}

