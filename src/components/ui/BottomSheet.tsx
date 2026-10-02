import { Feather } from '@expo/vector-icons';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Modal, Pressable, ScrollView, useWindowDimensions, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useI18n } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';
import { Tap } from './primitives';
import { Txt } from './Txt';

const EASE = Easing.bezier(0.23, 1, 0.32, 1);

/**
 * Port of 21st.dev "Drawer" (wensity), bottom side: a floating sheet 16 px from the screen edges,
 * slides up (0.5 s, ease [0.23, 1, 0.32, 1]) over a dimmed backdrop, grab handle, title and
 * description above a hairline, close button top-right, scrolling body and an optional sticky
 * footer. Drag the handle/header down (or tap the backdrop) to dismiss.
 */
type SheetProps = {
  visible: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  headerRight?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
};

export function BottomSheet(props: SheetProps) {
  const { visible } = props;
  // Stays mounted while the closing slide plays, then unmounts (a fresh sheet on every opening).
  const [mounted, setMounted] = useState(visible);
  if (visible && !mounted) setMounted(true);
  useEffect(() => {
    if (visible || !mounted) return;
    const t = setTimeout(() => setMounted(false), 260);
    return () => clearTimeout(t);
  }, [visible, mounted]);
  return mounted ? <Sheet {...props} /> : null;
}

function Sheet({ visible, onClose, title, description, headerRight, footer, children }: SheetProps) {
  const { colors } = useTheme();
  const { d } = useI18n();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const reduced = useReducedMotion();
  const p = useSharedValue(0);
  const drag = useSharedValue(0);
  const start = useRef(0);

  useEffect(() => {
    p.value = withTiming(visible ? 1 : 0, { duration: reduced ? 0 : visible ? 500 : 250, easing: EASE });
  }, [visible, reduced, p]);

  const backdrop = useAnimatedStyle(() => ({ opacity: p.value * (1 - Math.min(0.6, drag.value / 600)) }));
  const sheet = useAnimatedStyle(() => ({ transform: [{ translateY: (1 - p.value) * height + drag.value }] }));

  // Drag down on the handle/header: follows the finger, closes past 90 px.
  type Gesture = { nativeEvent: { pageY: number } };
  const grab = {
    onStartShouldSetResponder: () => true,
    onMoveShouldSetResponder: () => true,
    onResponderGrant: (e: Gesture) => {
      start.current = e.nativeEvent.pageY;
    },
    onResponderMove: (e: Gesture) => {
      drag.value = Math.max(0, e.nativeEvent.pageY - start.current);
    },
    onResponderRelease: (e: Gesture) => {
      if (e.nativeEvent.pageY - start.current > 90) onClose();
      else drag.value = withSpring(0, { damping: 22, stiffness: 260 });
    },
  };

  return (
    <Modal visible transparent animationType="none" statusBarTranslucent onRequestClose={onClose}>
      <Animated.View style={[{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.overlay }, backdrop]}>
        <Pressable accessibilityLabel={title} onPress={onClose} style={{ flex: 1 }} />
      </Animated.View>
      <View pointerEvents="box-none" style={{ flex: 1, justifyContent: 'flex-end', alignItems: 'center', paddingHorizontal: 12, paddingBottom: Math.max(12, insets.bottom + 8) }}>
        <Animated.View
          role="dialog"
          aria-label={title}
          style={[
            {
              width: '100%',
              maxWidth: 520,
              maxHeight: height * 0.82,
              backgroundColor: colors.surface,
              borderRadius: radius.hero + 4,
              borderWidth: 1,
              borderColor: colors.border,
              overflow: 'hidden',
              shadowColor: '#000',
              shadowOpacity: 0.28,
              shadowRadius: 40,
              shadowOffset: { width: 0, height: 24 },
              elevation: 16,
            },
            sheet,
          ]}>
          <View {...grab} style={{ borderBottomWidth: 1, borderBottomColor: colors.border, paddingBottom: 14 }}>
            <View style={{ alignItems: 'center', paddingTop: 10, paddingBottom: 8 }}>
              <View style={{ width: 40, height: 5, borderRadius: 3, backgroundColor: colors.borderStrong }} />
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingLeft: 20, paddingRight: 12 }}>
              <View style={{ flex: 1, gap: 2 }}>
                <Txt variant="h3">{title}</Txt>
                {!!description && <Txt variant="small" color="textMuted">{description}</Txt>}
              </View>
              {headerRight}
              <Tap
                onPress={onClose}
                accessibilityLabel={d.common.close}
                style={{ width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' }}
                hoverStyle={{ backgroundColor: colors.surfaceAlt }}>
                <Feather name="x" size={18} color={colors.textMuted} />
              </Tap>
            </View>
          </View>
          <ScrollView style={{ flexShrink: 1 }} contentContainerStyle={{ padding: 20, gap: 22 }} keyboardShouldPersistTaps="handled">
            {children}
          </ScrollView>
          {footer && <View style={{ padding: 16, borderTopWidth: 1, borderTopColor: colors.border }}>{footer}</View>}
        </Animated.View>
      </View>
    </Modal>
  );
}
