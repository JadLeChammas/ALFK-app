import { Image } from 'expo-image';
import { Text, View } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';

/**
 * Country flag as an image — emoji flags don't render on Windows (they show as "FR", "KW"…).
 * `code` is an ISO 3166-1 alpha-2 code.
 */
export function Flag({ code, size = 16 }: { code: string; size?: number }) {
  const { colors } = useTheme();
  const w = Math.round(size * 1.4);
  if (code === 'PIRATE') {
    // The Jolly Roger, for the Pirate language.
    return (
      <View style={{ width: w, height: size, borderRadius: 3, backgroundColor: '#111', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: '#fff', fontSize: Math.round(size * 0.75), lineHeight: size }}>☠</Text>
      </View>
    );
  }
  return (
    <View style={{ width: w, height: size, borderRadius: 3, overflow: 'hidden', backgroundColor: colors.surfaceAlt, borderWidth: 0.5, borderColor: colors.border }}>
      <Image source={{ uri: `https://flagcdn.com/w80/${code.toLowerCase()}.png` }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
    </View>
  );
}
