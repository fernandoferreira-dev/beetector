import MapIcon from '@iconify-icons/at-icons/map';
import HomeIcon from '@iconify-icons/bxs/home';
import BeeIcon from '@iconify-icons/roentgen/bee';
import HiveIcon from '@iconify-icons/mdi/beehive-outline';

export const appTabs = [
    { href: '/tabs', path: '/tabs', label: 'Início', icon: HomeIcon },
    { href: '/tabs/map', path: '/tabs/map', label: 'Mapa', icon: MapIcon },
    { href: '/tabs/apiaries', path: '/tabs/apiaries', label: 'Apiários', icon: BeeIcon },
    { href: '/tabs/hive', path: '/tabs/hive', label: 'Colmeia', icon: HiveIcon },
] as const;
