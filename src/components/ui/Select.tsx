import { Feather } from '@expo/vector-icons';
import { useMemo, useState, type ReactNode } from 'react';
import { Modal, Pressable, ScrollView, View } from 'react-native';

import { useI18n } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';
import { norm } from '../shell/GlobalSearch';
import { SearchBar, Tap } from './primitives';
import { Txt } from './Txt';

/** `short`: what the closed field shows once picked (e.g. « +965 » for « Koweït (+965) »). */
export type Option<T extends string | number> = { value: T; label: string; leading?: ReactNode; short?: string };

export function Select<T extends string | number>({
  label,
  value,
  options,
  onChange,
  placeholder,
  searchable,
  compact,
}: {
  label?: string;
  value: T | undefined;
  options: Option<T>[];
  onChange: (v: T) => void;
  placeholder?: string;
  searchable?: boolean;
  compact?: boolean;
}) {
  const { colors } = useTheme();
  const { d } = useI18n();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const selected = options.find((o) => o.value === value);
  const filtered = useMemo(() => (q ? options.filter((o) => norm(o.label).includes(norm(q))) : options), [q, options]);

  return (
    <View style={{ gap: 6 }}>
      {label && <Txt variant="smallStrong" color="textMuted">{label}</Txt>}
      <Tap
        onPress={() => setOpen(true)}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          height: compact ? 36 : 48,
          paddingHorizontal: compact ? 14 : 14,
          borderRadius: compact ? radius.pill : radius.input,
          backgroundColor: compact ? colors.surface : colors.surfaceAlt,
          borderWidth: 1,
          borderColor: colors.border,
        }}
        hoverStyle={{ borderColor: colors.borderStrong }}>
        {selected?.leading}
        <Txt variant={compact ? 'smallStrong' : 'body'} color={selected ? 'text' : 'textSubtle'} numberOfLines={1} style={{ flex: compact ? undefined : 1 }}>
          {selected?.short ?? selected?.label ?? placeholder ?? '—'}
        </Txt>
        <Feather name="chevron-down" size={compact ? 14 : 16} color={colors.textSubtle} />
      </Tap>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable onPress={() => setOpen(false)} style={{ flex: 1, backgroundColor: colors.overlay, alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <Pressable onPress={() => {}} style={{ width: '100%', maxWidth: 420, maxHeight: '75%', backgroundColor: colors.surface, borderRadius: radius.hero, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' }}>
            <View style={{ padding: 16, gap: 12, borderBottomWidth: 1, borderBottomColor: colors.border }}>
              <Txt variant="h3">{label ?? placeholder}</Txt>
              {searchable && <SearchBar value={q} onChangeText={setQ} placeholder={d.common.search} style={{ backgroundColor: colors.surfaceAlt }} />}
            </View>
            <ScrollView contentContainerStyle={{ padding: 8 }}>
              {filtered.map((o) => {
                const active = o.value === value;
                return (
                  <Tap
                    key={String(o.value)}
                    onPress={() => {
                      onChange(o.value);
                      setOpen(false);
                      setQ('');
                    }}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 12, backgroundColor: active ? colors.primarySoft : 'transparent' }}
                    hoverStyle={!active && { backgroundColor: colors.surfaceAlt }}>
                    {o.leading}
                    <Txt variant="bodyStrong" style={{ flex: 1, color: active ? colors.primary : colors.text }}>{o.label}</Txt>
                    {active && <Feather name="check" size={16} color={colors.primary} />}
                  </Tap>
                );
              })}
              {filtered.length === 0 && <Txt color="textSubtle" style={{ padding: 12 }}>{d.common.noResults}</Txt>}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
