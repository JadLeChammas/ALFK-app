import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { forwardRef, type ComponentProps, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  Switch as RNSwitch,
  StyleSheet,
  TextInput,
  View,
  type PressableProps,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';

import { useLayout } from '@/theme/layout';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts, radius, space, type ColorToken, type Colors } from '@/theme/tokens';
import { Txt } from './Txt';

export type IconName = ComponentProps<typeof Feather>['name'];

/** Web-only CSS transition; ignored on native. */
export const transition = (props = 'all', ms = 180): ViewStyle =>
  (Platform.OS === 'web' ? { transitionProperty: props, transitionDuration: `${ms}ms`, transitionTimingFunction: 'ease-out' } : {}) as ViewStyle;

type PressState = { pressed: boolean; hovered?: boolean };

/** Pressable with subtle hover/press feedback. */
export function Tap({
  style,
  hoverStyle,
  children,
  ...rest
}: Omit<PressableProps, 'style'> & { style?: StyleProp<ViewStyle>; hoverStyle?: StyleProp<ViewStyle>; children?: ReactNode }) {
  return (
    <Pressable
      {...rest}
      style={(s) => {
        const { pressed, hovered } = s as PressState;
        return [transition(), style, hovered && hoverStyle, pressed && { opacity: 0.85, transform: [{ scale: 0.985 }] }];
      }}>
      {children}
    </Pressable>
  );
}

export function Card({
  children,
  style,
  padded = true,
  onPress,
  elevated = true,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  padded?: boolean;
  onPress?: () => void;
  elevated?: boolean;
}) {
  const { colors, scheme } = useTheme();
  const base: StyleProp<ViewStyle> = [
    {
      backgroundColor: colors.surface,
      borderRadius: radius.card,
      borderWidth: StyleSheet.hairlineWidth * 2,
      borderColor: colors.border,
      overflow: 'hidden',
    },
    elevated && scheme === 'light' && styles.shadow,
    padded && { padding: space.xl },
    style,
  ];
  if (onPress) {
    return (
      <Tap onPress={onPress} style={base} hoverStyle={{ borderColor: colors.borderStrong, transform: [{ translateY: -2 }] }}>
        {children}
      </Tap>
    );
  }
  return <View style={base}>{children}</View>;
}

type ButtonVariant = 'primary' | 'accent' | 'secondary' | 'ghost' | 'danger' | 'ink' | 'soft';

export function Button({
  label,
  onPress,
  variant = 'primary',
  icon,
  iconRight,
  size = 'md',
  loading,
  disabled,
  full,
  style,
}: {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  icon?: IconName;
  iconRight?: IconName;
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  full?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();
  const palette: Record<ButtonVariant, { bg: string; fg: string; border: string; hover: string }> = {
    primary: { bg: colors.primary, fg: colors.onPrimary, border: colors.primary, hover: colors.primaryPressed },
    accent: { bg: colors.accent, fg: colors.onAccent, border: colors.accent, hover: colors.accentPressed },
    ink: { bg: colors.ink, fg: colors.onInk, border: colors.ink, hover: colors.ink },
    secondary: { bg: colors.surface, fg: colors.text, border: colors.border, hover: colors.surfaceHover },
    ghost: { bg: 'transparent', fg: colors.text, border: 'transparent', hover: colors.surfaceAlt },
    soft: { bg: colors.primarySoft, fg: colors.primary, border: colors.primarySoft, hover: colors.primarySoft },
    danger: { bg: colors.dangerSoft, fg: colors.danger, border: colors.dangerSoft, hover: colors.dangerSoft },
  };
  const p = palette[variant];
  const h = size === 'sm' ? 34 : size === 'lg' ? 52 : 44;
  return (
    <Tap
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      style={[
        {
          height: h,
          paddingHorizontal: size === 'sm' ? 14 : 20,
          borderRadius: radius.pill,
          backgroundColor: p.bg,
          borderWidth: 1,
          borderColor: p.border,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          alignSelf: full ? 'stretch' : 'flex-start',
          opacity: disabled ? 0.5 : 1,
        },
        style,
      ]}
      hoverStyle={{ backgroundColor: p.hover }}>
      {loading ? (
        <ActivityIndicator color={p.fg} size="small" />
      ) : (
        <>
          {icon && <Feather name={icon} size={size === 'sm' ? 14 : 16} color={p.fg} />}
          <Txt variant={size === 'sm' ? 'smallStrong' : 'bodyStrong'} style={{ color: p.fg }} numberOfLines={1}>
            {label}
          </Txt>
          {iconRight && <Feather name={iconRight} size={size === 'sm' ? 14 : 16} color={p.fg} />}
        </>
      )}
    </Tap>
  );
}

export function IconButton({
  icon,
  onPress,
  badge,
  size = 40,
  variant = 'surface',
  color,
  label,
}: {
  icon: IconName;
  onPress?: () => void;
  badge?: number;
  size?: number;
  variant?: 'surface' | 'ghost' | 'primary' | 'overlay';
  color?: string;
  label?: string;
}) {
  const { colors } = useTheme();
  const bg = { surface: colors.surface, ghost: 'transparent', primary: colors.primary, overlay: 'rgba(0,0,0,0.45)' }[variant];
  const fg = color ?? (variant === 'primary' || variant === 'overlay' ? '#fff' : colors.text);
  return (
    <Tap
      onPress={onPress}
      accessibilityLabel={label}
      accessibilityRole="button"
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: bg,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: variant === 'surface' ? 1 : 0,
        borderColor: colors.border,
      }}
      hoverStyle={{ backgroundColor: variant === 'surface' || variant === 'ghost' ? colors.surfaceAlt : bg }}>
      <Feather name={icon} size={size * 0.45} color={fg} />
      {!!badge && badge > 0 && <CountBadge n={badge} style={{ position: 'absolute', top: -2, right: -2 }} />}
    </Tap>
  );
}

export function CountBadge({ n, style }: { n: number; style?: StyleProp<ViewStyle> }) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        { minWidth: 18, height: 18, borderRadius: 9, paddingHorizontal: 5, backgroundColor: colors.danger, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.surface },
        style,
      ]}>
      <Txt style={{ color: '#fff', fontFamily: fonts.bold, fontSize: 10, lineHeight: 12 }}>{n > 99 ? '99+' : n}</Txt>
    </View>
  );
}

export const Input = forwardRef<TextInput, TextInputProps & { label?: string; icon?: IconName; hint?: string; error?: string; right?: ReactNode; containerStyle?: StyleProp<ViewStyle> }>(
  function Input({ label, icon, hint, error, right, style, containerStyle, editable = true, ...rest }, ref) {
    const { colors } = useTheme();
    return (
      <View style={[{ gap: 6, minWidth: 0 }, containerStyle]}>
        {label && <Txt variant="smallStrong" color="textMuted">{label}</Txt>}
        <View
          style={{
            minWidth: 0,
            flexDirection: 'row',
            alignItems: rest.multiline ? 'flex-start' : 'center',
            minHeight: 48,
            borderRadius: radius.input,
            backgroundColor: editable ? colors.surfaceAlt : colors.bg,
            borderWidth: 1,
            borderColor: error ? colors.danger : colors.border,
            paddingHorizontal: 14,
            gap: 10,
          }}>
          {icon && <Feather name={icon} size={17} color={colors.textSubtle} style={rest.multiline ? { marginTop: 15 } : undefined} />}
          <TextInput
            ref={ref}
            placeholderTextColor={colors.textSubtle}
            editable={editable}
            {...rest}
            style={[
              {
                flex: 1,
                minWidth: 0,
                color: editable ? colors.text : colors.textMuted,
                fontFamily: fonts.medium,
                fontSize: 15,
                paddingVertical: 12,
                minHeight: rest.multiline ? 110 : undefined,
                textAlignVertical: rest.multiline ? 'top' : 'center',
              },
              Platform.OS === 'web' && ({ outlineStyle: 'none' } as object),
              style,
            ]}
          />
          {right}
        </View>
        {(error || hint) && <Txt variant="small" color={error ? 'danger' : 'textSubtle'}>{error || hint}</Txt>}
      </View>
    );
  }
);

export function SearchBar({ value, onChangeText, placeholder, style, autoFocus, onFocus }: { value: string; onChangeText: (s: string) => void; placeholder: string; style?: StyleProp<ViewStyle>; autoFocus?: boolean; onFocus?: () => void }) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        { flexDirection: 'row', alignItems: 'center', height: 46, borderRadius: radius.pill, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 16, gap: 10 },
        style,
      ]}>
      <Feather name="search" size={17} color={colors.textSubtle} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textSubtle}
        autoFocus={autoFocus}
        onFocus={onFocus}
        style={[{ flex: 1, color: colors.text, fontFamily: fonts.medium, fontSize: 14, height: '100%' }, Platform.OS === 'web' && ({ outlineStyle: 'none' } as object)]}
      />
      {value.length > 0 && (
        <Tap onPress={() => onChangeText('')} hitSlop={10}>
          <Feather name="x-circle" size={16} color={colors.textSubtle} />
        </Tap>
      )}
    </View>
  );
}

export function Avatar({ uri, name, size = 44, ring, online }: { uri?: string; name: string; size?: number; ring?: boolean; online?: boolean }) {
  const { colors } = useTheme();
  const initials = name
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
  return (
    <View style={{ width: size, height: size }}>
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          overflow: 'hidden',
          backgroundColor: colors.primarySoft,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: ring ? 3 : 0,
          borderColor: colors.surface,
        }}>
        {uri ? (
          <Image source={{ uri }} style={{ width: '100%', height: '100%' }} contentFit="cover" transition={200} />
        ) : (
          <Txt style={{ color: colors.primary, fontFamily: fonts.bold, fontSize: size * 0.36 }}>{initials}</Txt>
        )}
      </View>
      {online && (
        <View style={{ position: 'absolute', right: 0, bottom: 0, width: size * 0.28, height: size * 0.28, borderRadius: size, backgroundColor: colors.success, borderWidth: 2, borderColor: colors.surface }} />
      )}
    </View>
  );
}

export type Tone = 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'violet' | 'neutral' | 'ink';

export function toneColors(colors: Colors, tone: Tone) {
  switch (tone) {
    case 'primary': return { bg: colors.primarySoft, fg: colors.primary };
    case 'success': return { bg: colors.successSoft, fg: colors.success };
    case 'warning': return { bg: colors.warningSoft, fg: colors.warning };
    case 'danger': return { bg: colors.dangerSoft, fg: colors.danger };
    case 'info': return { bg: colors.infoSoft, fg: colors.info };
    case 'violet': return { bg: colors.violetSoft, fg: colors.violet };
    case 'ink': return { bg: colors.ink, fg: colors.onInk };
    default: return { bg: colors.surfaceAlt, fg: colors.textMuted };
  }
}

export function Badge({ label, tone = 'neutral', icon, style }: { label: string; tone?: Tone; icon?: IconName; style?: StyleProp<ViewStyle> }) {
  const { colors } = useTheme();
  const t = toneColors(colors, tone);
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', backgroundColor: t.bg, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4 }, style]}>
      {icon && <Feather name={icon} size={11} color={t.fg} />}
      <Txt style={{ color: t.fg, fontFamily: fonts.bold, fontSize: 11, lineHeight: 14 }}>{label}</Txt>
    </View>
  );
}

export function Chip({ label, active, onPress, icon, count, leading }: { label: string; active?: boolean; onPress?: () => void; icon?: IconName; count?: number; leading?: ReactNode }) {
  const { colors } = useTheme();
  return (
    <Tap
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        height: 36,
        paddingHorizontal: 16,
        borderRadius: radius.pill,
        backgroundColor: active ? colors.ink : colors.surface,
        borderWidth: 1,
        borderColor: active ? colors.ink : colors.border,
      }}
      hoverStyle={!active && { backgroundColor: colors.surfaceAlt }}>
      {icon && <Feather name={icon} size={14} color={active ? colors.onInk : colors.textMuted} />}
      {leading}
      <Txt variant="smallStrong" style={{ color: active ? colors.onInk : colors.text }}>{label}</Txt>
      {count !== undefined && <Txt variant="small" style={{ color: active ? colors.onInk : colors.textSubtle, opacity: 0.8 }}>{count}</Txt>}
    </Tap>
  );
}

export function Segmented<T extends string>({ value, options, onChange, style }: { value: T; options: { value: T; label: string; icon?: IconName }[]; onChange: (v: T) => void; style?: StyleProp<ViewStyle> }) {
  const { colors, scheme } = useTheme();
  return (
    <View style={[{ flexDirection: 'row', backgroundColor: colors.surfaceAlt, borderRadius: radius.pill, padding: 4, alignSelf: 'flex-start', borderWidth: 1, borderColor: colors.border }, style]}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Tap
            key={o.value}
            onPress={() => onChange(o.value)}
            style={[
              { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, height: 34, borderRadius: radius.pill, justifyContent: 'center', flexGrow: 1 },
              active && { backgroundColor: colors.surface },
              active && scheme === 'light' && styles.shadow,
            ]}>
            {o.icon && <Feather name={o.icon} size={14} color={active ? colors.text : colors.textMuted} />}
            <Txt variant="smallStrong" color={active ? 'text' : 'textMuted'}>{o.label}</Txt>
          </Tap>
        );
      })}
    </View>
  );
}

export function SectionHeader({ title, icon, action, onAction, count, style }: { title: string; icon?: IconName; action?: string; onAction?: () => void; count?: string; style?: StyleProp<ViewStyle> }) {
  const { colors } = useTheme();
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: space.lg }, style]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flexShrink: 1 }}>
        {icon && (
          <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
            <Feather name={icon} size={16} color={colors.primary} />
          </View>
        )}
        <Txt variant="h3" numberOfLines={1} style={{ flexShrink: 1 }}>{title}</Txt>
        {count && <Txt variant="small" color="textSubtle">{count}</Txt>}
      </View>
      {action && (
        <Tap onPress={onAction} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Txt variant="smallStrong" color="primary">{action}</Txt>
          <Feather name="arrow-right" size={14} color={colors.primary} />
        </Tap>
      )}
    </View>
  );
}

export function ListRow({ icon, title, subtitle, right, onPress, danger, tone = 'primary', last }: { icon?: IconName; title: string; subtitle?: string; right?: ReactNode; onPress?: () => void; danger?: boolean; tone?: Tone; last?: boolean }) {
  const { colors } = useTheme();
  const t = toneColors(colors, danger ? 'danger' : tone);
  const content = (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, borderBottomWidth: last ? 0 : 1, borderBottomColor: colors.border }}>
      {icon && (
        <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: t.bg, alignItems: 'center', justifyContent: 'center' }}>
          <Feather name={icon} size={17} color={t.fg} />
        </View>
      )}
      <View style={{ flex: 1, gap: 2 }}>
        <Txt variant="bodyStrong" style={danger && { color: colors.danger }}>{title}</Txt>
        {subtitle && <Txt variant="small" color="textMuted">{subtitle}</Txt>}
      </View>
      {right ?? (onPress && <Feather name="chevron-right" size={18} color={colors.textSubtle} />)}
    </View>
  );
  return onPress ? <Tap onPress={onPress}>{content}</Tap> : content;
}

export function Switch({ value, onValueChange }: { value: boolean; onValueChange: (v: boolean) => void }) {
  const { colors } = useTheme();
  return (
    <RNSwitch
      value={value}
      onValueChange={onValueChange}
      trackColor={{ false: colors.borderStrong, true: colors.primary }}
      thumbColor="#fff"
      {...(Platform.OS === 'web' ? ({ activeThumbColor: '#fff' } as object) : {})}
    />
  );
}

export function EmptyState({ icon, title, subtitle, action }: { icon: IconName; title: string; subtitle?: string; action?: ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={{ alignItems: 'center', paddingVertical: space.huge, paddingHorizontal: space.xl, gap: 10 }}>
      <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', marginBottom: 6 }}>
        <Feather name={icon} size={26} color={colors.primary} />
      </View>
      <Txt variant="h3" align="center">{title}</Txt>
      {subtitle && <Txt color="textMuted" align="center" style={{ maxWidth: 360 }}>{subtitle}</Txt>}
      {action}
    </View>
  );
}

export function Divider({ style }: { style?: StyleProp<ViewStyle> }) {
  const { colors } = useTheme();
  return <View style={[{ height: 1, backgroundColor: colors.border }, style]} />;
}

export function Row({ children, gap = 12, style, wrap }: { children: ReactNode; gap?: number; style?: StyleProp<ViewStyle>; wrap?: boolean }) {
  return <View style={[{ flexDirection: 'row', alignItems: 'center', gap, flexWrap: wrap ? 'wrap' : 'nowrap' }, style]}>{children}</View>;
}

/** Side-by-side form fields on tablet/desktop, stacked on phones. */
export function FieldRow({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const { isMobile } = useLayout();
  return <View style={[{ flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 16 : 12 }, style]}>{children}</View>;
}

export function MetaLine({ icon, text, color = 'textMuted' }: { icon: IconName; text: string; color?: ColorToken }) {
  const { colors } = useTheme();
  return (
    <Row gap={6}>
      <Feather name={icon} size={13} color={colors[color]} />
      <Txt variant="small" color={color} numberOfLines={1} style={{ flexShrink: 1 }}>{text}</Txt>
    </Row>
  );
}

const styles = StyleSheet.create({
  shadow: {
    shadowColor: '#111726',
    shadowOpacity: 0.05,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
});
