import { usePathname } from "expo-router";
import { Image, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { appTabs } from "@/constants/app-tabs";

interface AppHeaderProps {
    onProfilePress?: () => void;
}

export default function AppHeader({ onProfilePress }: AppHeaderProps) {
    const pathname = usePathname();
    //this is to display the name of the page on the header
    const currentTab = appTabs.find(({ path }) =>
        path === "/tabs"
            ? pathname === path || pathname === `${path}/`
            : pathname === path || pathname.startsWith(`${path}/`),
    );

    return (
        <SafeAreaView edges={["top"]} className="bg-[#f59e0b]">
            <View className="h-[72px] flex-row items-center justify-between px-5">
                <Text className="text-2xl font-bold text-white">
                    {currentTab?.label ?? ""}
                </Text>
                <Pressable
                    accessibilityLabel="Perfil"
                    accessibilityRole="button"
                    onPress={onProfilePress}
                    className="h-11 w-11 items-center justify-center rounded-full bg-white/20 active:opacity-70"
                >
                    <Image
                        source={require("../../assets/images/user.png")}
                        className="h-6 w-6"
                        resizeMode="contain"
                    />
                </Pressable>
            </View>
        </SafeAreaView>
    );
}
