import { Image } from 'expo-image';
import { useState, type ReactNode } from 'react';
import { View } from 'react-native';

import { useUniLogo } from '@/data/uniLogos';

/**
 * A university's logo, found automatically (data/uniLogos.ts). Until one is found — or when there
 * is none, or the image fails — `fallback` is shown instead (nothing by default).
 */
export function UniLogo({ name, size = 34, fallback = null }: { name?: string; size?: number; fallback?: ReactNode }) {
  const url = useUniLogo(name);
  const [failed, setFailed] = useState<string | null>(null);
  if (!url || failed === url) return <>{fallback}</>;
  const inner = Math.round(size * 0.76);
  return (
    <View style={{ width: size, height: size, borderRadius: Math.round(size * 0.26), backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
      <Image source={{ uri: url }} style={{ width: inner, height: inner }} contentFit="contain" transition={200} onError={() => setFailed(url)} accessibilityIgnoresInvertColors />
    </View>
  );
}
