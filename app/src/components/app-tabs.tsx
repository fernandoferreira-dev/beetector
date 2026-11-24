import MapIcon from '@iconify-icons/at-icons/map';
import HomeIcon from '@iconify-icons/bxs/home';
import BeeIcon from '@iconify-icons/roentgen/bee';
import HiveIcon from '@iconify-icons/mdi/beehive-outline';
import { Link, usePathname } from 'expo-router';
import { Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppIcon } from '@/components/utilities/AppIcon';

const tabs = [
    { href: '/tabs', path: '/tabs', label: 'Início', icon: HomeIcon },
    { href: '/tabs/map', path: '/tabs/map', label: 'Mapa', icon: MapIcon },
    { href: '/tabs/apiaries', path: '/tabs/apiaries', label: 'Apiários', icon: BeeIcon },
    { href: '/tabs/hive', path: '/tabs/hive', label: 'Colmeia', icon: HiveIcon },
] as const;

export default function AppTabs() {
    const pathname = usePathname();

    return (
        <SafeAreaView edges={['bottom']} className="border-t border-[#e7e5df] bg-white">
            <View className="h-[72px] flex-row items-center justify-around px-3">
                {tabs.map(({ href, path, label, icon }) => {
                    const selected = path === '/tabs'
                        ? pathname === '/tabs' || pathname === '/tabs/'
                        : pathname === path;

                    return (
                        <Link key={path} href={href} asChild>
                            <Pressable
                                accessibilityLabel={label}
                                accessibilityRole="tab"
                                accessibilityState={{ selected }}
                                className="h-[60px] flex-1 items-center justify-center">
                                <View className={`h-[60px] w-[84%] max-w-[88px] items-center justify-center rounded-[16px] ${selected ? 'bg-[#a8d1b8]' : 'bg-transparent'}`}>
                                    <AppIcon icon={icon} size={48} color="#18334f" />
                                </View>
                            </Pressable>
                        </Link>
                    );
                })}
            </View>
        </SafeAreaView>
    );
}
