import { router } from 'expo-router';
import { View } from 'react-native';
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, Stop, Text as SvgText } from 'react-native-svg';

import { PublicPage } from '@/components/PublicPage';
import { Button } from '@/components/ui/primitives';
import { Txt } from '@/components/ui/Txt';
import { useI18n } from '@/i18n';
import { useLayout } from '@/theme/layout';
import { fonts } from '@/theme/tokens';

/**
 * « Page not found »: a camel lost in the desert (easter egg n° 10, EASTER_EGGS.md). Its line changes
 * with the language — « Ma le2ina el page… » in the hidden Lebanese mode, a Kuwaiti joke in Kuwaiti.
 */
export default function NotFound() {
  const { d } = useI18n();
  const { isMobile } = useLayout();
  return (
    <PublicPage title="">
      <View style={{ alignItems: 'center', gap: 14, paddingVertical: isMobile ? 24 : 40 }}>
        <LostCamel width={isMobile ? 320 : 520} />
        <Txt style={{ fontFamily: fonts.display, fontSize: isMobile ? 72 : 104, lineHeight: isMobile ? 76 : 108 }} color="primary">404</Txt>
        <Txt variant="h1" align="center">{d.legal.notFound}</Txt>
        <Txt color="textMuted" align="center" style={{ maxWidth: 520 }}>{d.legal.notFoundJoke}</Txt>
        <Txt variant="small" color="textSubtle" align="center">{d.legal.notFoundSub}</Txt>
        <Button label={d.legal.goHome} icon="home" onPress={() => router.replace('/')} style={{ marginTop: 6 }} />
      </View>
    </PublicPage>
  );
}

/** Dunes under a hot sky, a camel looking around with a « ? », and its footprints going in circles. */
function LostCamel({ width }: { width: number }) {
  const height = width * 0.56;
  return (
    <Svg width={width} height={height} viewBox="0 0 500 280" accessibilityLabel="🐪">
      <Defs>
        <LinearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#F6C177" />
          <Stop offset="1" stopColor="#FBE3B6" />
        </LinearGradient>
        <LinearGradient id="dune1" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#E7B36A" />
          <Stop offset="1" stopColor="#D49A4E" />
        </LinearGradient>
        <LinearGradient id="dune2" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#F0C584" />
          <Stop offset="1" stopColor="#E2AE66" />
        </LinearGradient>
      </Defs>
      {/* sky, sun and its haze */}
      <Path d="M0 0 H500 V280 H0 Z" fill="url(#sky)" />
      <Circle cx={400} cy={62} r={34} fill="#FFF3D6" opacity={0.55} />
      <Circle cx={400} cy={62} r={24} fill="#FFF8E7" />
      {/* far dunes, then near dunes */}
      <Path d="M0 170 Q90 120 190 165 T380 150 T500 160 V280 H0 Z" fill="url(#dune1)" opacity={0.8} />
      <Path d="M0 210 Q120 165 250 205 T500 195 V280 H0 Z" fill="url(#dune2)" />
      {/* footprints going round in circles */}
      <G fill="#C08A45" opacity={0.55}>
        {[
          [70, 250], [92, 244], [116, 247], [138, 240], [160, 246], [182, 239], [196, 228], [186, 216], [164, 220], [142, 226], [124, 232],
        ].map(([x, y], i) => (
          <Ellipse key={i} cx={x} cy={y} rx={4} ry={2.2} />
        ))}
      </G>
      {/* the camel, looking back over its shoulder */}
      <G transform="translate(250 112)">
        <Ellipse cx={58} cy={112} rx={70} ry={7} fill="#B9844A" opacity={0.35} />
        {/* legs */}
        <Path d="M20 70 L16 112 M34 72 L34 112 M78 72 L82 112 M92 68 L98 112" stroke="#8A5A2B" strokeWidth={7} strokeLinecap="round" />
        {/* body with two humps */}
        <Path d="M8 70 Q4 46 22 40 Q30 14 46 36 Q56 12 72 36 Q96 34 102 52 Q106 74 86 78 L20 78 Q10 78 8 70 Z" fill="#B07A3F" />
        {/* tail */}
        <Path d="M8 56 Q-4 62 0 76" stroke="#8A5A2B" strokeWidth={3} fill="none" strokeLinecap="round" />
        {/* neck and head turned back */}
        <Path d="M96 52 Q118 36 116 10 Q114 -2 124 -4 Q138 -6 140 6 Q142 14 132 16 Q128 30 112 56 Z" fill="#B07A3F" />
        <Circle cx={130} cy={2} r={2.2} fill="#2B1A0C" />
        <Path d="M120 -4 L118 -11" stroke="#8A5A2B" strokeWidth={3} strokeLinecap="round" />
        {/* saddle blanket in the LFK colours */}
        <Path d="M36 40 Q56 34 74 40 L76 56 Q56 60 34 56 Z" fill="#0E2A47" />
        <Path d="M34 50 Q56 54 76 50" stroke="#C53B3E" strokeWidth={3} fill="none" />
        {/* the question mark */}
        <SvgText x={150} y={-14} fontSize={34} fontWeight="bold" fill="#0E2A47">?</SvgText>
      </G>
    </Svg>
  );
}
