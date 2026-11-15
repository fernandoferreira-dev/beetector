import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

type AppHeaderProps = {
    /** Message shown next to the avatar. Can change per screen. */
    title?: string;
    /** Frontend only for now: wire these up later. */
    onProfilePress?: () => void;
    onSettingsPress?: () => void;
};

export default function AppHeader({
    title = "Bem vindo",
    onProfilePress,
    onSettingsPress,
}: AppHeaderProps) {
    const insets = useSafeAreaInsets();

    return (
        <View style={{ paddingTop: insets.top }} className="bg-neutral-100">
            <View className="mx-3 mb-2 mt-2 flex-row items-center rounded-sm border border-neutral-500 bg-neutral-300 px-3 py-3">
                {/* Left: profile avatar with outer ring */}
                <Pressable
                    onPress={onProfilePress}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel="Perfil"
                    className="h-14 w-14 items-center justify-center rounded-full border-2 border-neutral-800 active:opacity-70"
                >
                    <View className="h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-sky-300">
                        <Ionicons name="person" size={26} color="#e0f2fe" />
                    </View>
                </Pressable>

                {/* Center: message */}
                <Text
                    numberOfLines={1}
                    className="ml-3 flex-1 text-lg text-neutral-900"
                >
                    {title}
                </Text>

                {/* Right: settings */}
                <Pressable
                    onPress={onSettingsPress}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel="Definições"
                    className="h-14 w-14 items-center justify-center active:opacity-70"
                >
                    <Ionicons name="settings" size={44} color="#facc15" />
                </Pressable>
            </View>
        </View>
    );
}

/*
 * Usage with React Navigation / Expo Router: pass it as the custom `header`
 * and change `title` per screen from options.
 *
 * <Stack
 *   screenOptions={{
 *     header: ({ options }) => (
 *       <AppHeader title={(options.title as string) ?? undefined} />
 *     ),
 *   }}
 * />
 */
