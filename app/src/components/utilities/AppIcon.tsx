// components/AppIcon.tsx
import React from 'react';
import { SvgXml } from 'react-native-svg';
import type { IconifyIcon } from '@iconify/types';

interface AppIconProps {
  icon: IconifyIcon;
  size?: number;
  color?: string;
}

export function AppIcon({ icon, size = 24, color = '#000000' }: AppIconProps) {
  const width = icon.width ?? 24;
  const height = icon.height ?? 24;

  // Iconify uses "currentColor" for monotone icons; replace it with the passed color prop
  const body = icon.body.replace(/currentColor/g, color);

  const xml = `<svg viewBox="0 0 ${width} ${height}" width="${size}" height="${size}">${body}</svg>`;

  return <SvgXml xml={xml} width={size} height={size} />;
}