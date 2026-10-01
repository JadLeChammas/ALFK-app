import { useEffect, useState } from 'react';
import { Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';

import { useInView } from './useInView';

/**
 * Port of 21st.dev "Text Reveal (Mask)" (soralabs), word mode: each word sits in its own
 * clipping box and slides up from 110 % when the block scrolls into view
 * (expo-out [0.19, 1, 0.22, 1], 0.6 s, 0.06 s stagger).
 * Wrap words in *asterisks* to emphasise them (rendered with `emphasisStyle`).
 */
export function MaskedText({
  text,
  style,
  emphasisStyle,
  containerStyle,
  align = 'left',
  delay = 0,
  stagger = 0.06,
  duration = 0.6,
}: {
  text: string;
  style: StyleProp<TextStyle>;
  emphasisStyle?: StyleProp<TextStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  align?: 'left' | 'center';
  delay?: number;
  stagger?: number;
  duration?: number;
}) {
  const [ref, inView] = useInView();
  const reduced = useReducedMotion();
  const lines = text.split('\n');
  let index = 0;

  if (reduced) {
    return <Text style={[style, { textAlign: align }]}>{text.replace(/\*/g, '')}</Text>;
  }

  return (
    <View ref={ref} accessibilityLabel={text.replace(/\*/g, '')} style={containerStyle}>
      {lines.map((line, li) => (
        <View key={li} style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: align === 'center' ? 'center' : 'flex-start' }}>
          {line.split(/\s+/).filter(Boolean).map((raw, wi, arr) => {
            const emph = /^\*.*\*[.,;:!?]?$/.test(raw);
            const word = raw.replace(/\*/g, '');
            const i = index++;
            return (
              <Word key={`${li}-${wi}`} text={word + (wi < arr.length - 1 ? ' ' : '')} style={[style, emph && emphasisStyle]} show={inView} delay={delay + i * stagger} duration={duration} />
            );
          })}
        </View>
      ))}
    </View>
  );
}

function Word({ text, style, show, delay, duration }: { text: string; style: StyleProp<TextStyle>; show: boolean; delay: number; duration: number }) {
  const [h, setH] = useState(0);
  const y = useSharedValue(1.1);
  useEffect(() => {
    if (show && h) y.value = withDelay(delay * 1000, withTiming(0, { duration: duration * 1000, easing: Easing.bezier(0.19, 1, 0.22, 1) }));
  }, [show, h, delay, duration, y]);
  const anim = useAnimatedStyle(() => ({ opacity: h ? 1 : 0, transform: [{ translateY: y.value * h }] }));
  return (
    <View style={{ overflow: 'hidden' }} onLayout={(e) => setH(e.nativeEvent.layout.height)}>
      <Animated.Text style={[style, anim]}>{text}</Animated.Text>
    </View>
  );
}
