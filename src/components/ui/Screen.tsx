import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Children, useState, type ReactNode } from 'react';
import { ScrollView, View, type StyleProp, type ViewStyle } from 'react-native';

import { useI18n } from '@/i18n';
import { useLayout } from '@/theme/layout';
import { useTheme } from '@/theme/ThemeProvider';
import { space } from '@/theme/tokens';
import { eggs } from '@/lib/eggs';
import { Tap } from './primitives';
import { Txt } from './Txt';

export const MAX_CONTENT = 1240;

export function useGutter() {
  const { isDesktop, isTablet } = useLayout();
  return isDesktop ? 36 : isTablet ? 28 : 16;
}

/** `background`: drawn behind the whole page and still while it scrolls (e.g. the Partners page's animated lines). */
export function Screen({ children, scroll = true, maxWidth = MAX_CONTENT, contentStyle, background }: { children: ReactNode; scroll?: boolean; maxWidth?: number; contentStyle?: StyleProp<ViewStyle>; background?: ReactNode }) {
  const { colors } = useTheme();
  const { isMobile } = useLayout();
  const gutter = useGutter();
  // Narrower pages (settings, notifications…) share the standard column's left edge instead of centring on their own.
  const column = <View style={[{ width: '100%', maxWidth, gap: isMobile ? space.xxl : space.xxxl }, contentStyle]}>{children}</View>;
  const inner = <View style={{ width: '100%', maxWidth: MAX_CONTENT, alignSelf: 'center' }}>{column}</View>;
  if (!scroll) return <View style={{ flex: 1, backgroundColor: colors.bg, padding: gutter }}>{inner}</View>;
  const page = (
    <ScrollView
      style={{ flex: 1, backgroundColor: background ? 'transparent' : colors.bg }}
      contentContainerStyle={{ paddingHorizontal: gutter, paddingTop: isMobile ? space.lg : space.xxl, paddingBottom: isMobile ? 120 : space.huge }}
      keyboardShouldPersistTaps="handled">
      {inner}
      {/* Easter egg: the © rolls the end credits. */}
      <Txt variant="small" color="textSubtle" align="center" onPress={() => eggs.emit('credits')} suppressHighlighting style={{ marginTop: space.xxxl, opacity: 0.7 }}>
        {`© ${new Date().getFullYear()} Amicale LFK`}
      </Txt>
    </ScrollView>
  );
  if (!background) return page;
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {background}
      {page}
    </View>
  );
}

export function BackLink({ label, href }: { label?: string; href?: string }) {
  const { colors } = useTheme();
  const { d } = useI18n();
  return (
    <Tap
      onPress={() => (router.canGoBack() ? router.back() : router.replace((href ?? '/') as never))}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 999, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }}>
      <Feather name="arrow-left" size={14} color={colors.text} />
      <Txt variant="smallStrong">{label ?? d.nav.back}</Txt>
    </Tap>
  );
}

export function PageHeader({ title, subtitle, right, icon, eyebrow }: { title: string; subtitle?: string; right?: ReactNode; icon?: ReactNode; eyebrow?: ReactNode }) {
  const { isMobile } = useLayout();
  return (
    <View style={{ flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'stretch' : 'flex-end', justifyContent: 'space-between', gap: 16 }}>
      <View style={{ gap: 6, flexShrink: 1 }}>
        {eyebrow}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          {icon}
          <Txt variant={isMobile ? 'h1' : 'display'}>{title}</Txt>
        </View>
        {subtitle && <Txt color="textMuted" style={{ maxWidth: 640 }}>{subtitle}</Txt>}
      </View>
      {right && <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>{right}</View>}
    </View>
  );
}

/** Responsive grid: fits as many columns of at least `min` px as the width allows. */
export function Grid({ children, min = 240, gap = 16, max }: { children: ReactNode; min?: number; gap?: number; max?: number }) {
  const [w, setW] = useState(0);
  let cols = Math.max(1, Math.floor((w + gap) / (min + gap)));
  if (max) cols = Math.min(cols, max);
  const itemW = w ? (w - gap * (cols - 1)) / cols : undefined;
  return (
    <View onLayout={(e) => setW(e.nativeEvent.layout.width)} style={{ flexDirection: 'row', flexWrap: 'wrap', gap }}>
      {Children.toArray(children).map((c, i) => (
        // Until measured, fall back to plain flex-wrap so content is never blank.
        <View key={i} style={itemW ? { width: itemW } : { flexGrow: 1, flexBasis: min }}>
          {c}
        </View>
      ))}
    </View>
  );
}

/** Two-column layout on desktop (main + aside), stacked on smaller screens. */
export function Columns({ main, aside, asideWidth = 340 }: { main: ReactNode; aside: ReactNode; asideWidth?: number }) {
  const { isDesktop } = useLayout();
  if (!isDesktop) return <View style={{ gap: space.xxl }}>{main}{aside}</View>;
  return (
    <View style={{ flexDirection: 'row', gap: space.xxl, alignItems: 'flex-start' }}>
      <View style={{ flex: 1, minWidth: 0, gap: space.xxl }}>{main}</View>
      <View style={{ width: asideWidth, gap: space.xxl }}>{aside}</View>
    </View>
  );
}
