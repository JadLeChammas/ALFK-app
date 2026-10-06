import { Feather } from '@expo/vector-icons';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, View } from 'react-native';

import { Flag } from '@/components/ui/Flag';
import { IconButton, Segmented, Tap } from '@/components/ui/primitives';
import { Txt } from '@/components/ui/Txt';
import { useI18n, visibleLanguages } from '@/i18n';
import { useTheme, type ThemePreference } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';

/**
 * Settings for visitors: language and light / dark mode only (both are kept on the device).
 * Everything tied to an account stays in the members' Settings page.
 */
export function PublicSettingsButton({ light, size = 36 }: { light?: boolean; size?: number }) {
  const { d } = useI18n();
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  return (
    <>
      <Tap
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={d.settings.title}
        style={{ width: size, height: size, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center', backgroundColor: light ? 'rgba(255,255,255,0.1)' : 'transparent' }}
        hoverStyle={{ opacity: 0.75 }}>
        <Feather name="settings" size={18} color={light ? '#fff' : colors.textMuted} />
      </Tap>
      <PublicSettings visible={open} onClose={() => setOpen(false)} />
    </>
  );
}

export function PublicSettings({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { d, lang, setLang } = useI18n();
  const { colors, preference, setPreference } = useTheme();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: colors.overlay, alignItems: 'center', justifyContent: 'center', padding: 16 }}>
        <Pressable onPress={() => {}} style={{ width: '100%', maxWidth: 480, maxHeight: '90%', backgroundColor: colors.surface, borderRadius: radius.hero, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderBottomColor: colors.border }}>
            <Txt variant="h2">{d.settings.title}</Txt>
            <IconButton icon="x" size={36} onPress={onClose} label={d.common.close} />
          </View>
          <ScrollView contentContainerStyle={{ padding: 20, gap: 22 }}>
            <View style={{ gap: 10 }}>
              <Txt variant="caption">{d.settings.appearance}</Txt>
              <Segmented<ThemePreference>
                value={preference}
                onChange={setPreference}
                options={[
                  { value: 'light', label: d.settings.light, icon: 'sun' },
                  { value: 'dark', label: d.settings.dark, icon: 'moon' },
                  { value: 'system', label: d.settings.system, icon: 'monitor' },
                ]}
              />
            </View>
            <View style={{ gap: 10 }}>
              <Txt variant="caption">{d.settings.language}</Txt>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {visibleLanguages().map((l) => {
                  const active = lang === l.code;
                  return (
                    <Tap
                      key={l.code}
                      onPress={() => setLang(l.code)}
                      accessibilityRole="radio"
                      aria-checked={active}
                      style={{ flexBasis: '47%', flexGrow: 1, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, height: 44, borderRadius: radius.input, borderWidth: 1.5, borderColor: active ? colors.primary : colors.border, backgroundColor: colors.surface }}
                      hoverStyle={!active && { borderColor: colors.borderStrong }}>
                      <Flag code={l.country} size={16} />
                      <Txt variant="bodyStrong" numberOfLines={1} style={{ flex: 1, fontSize: 14, color: active ? colors.primary : colors.text }}>{l.label}</Txt>
                      {active && <Feather name="check" size={16} color={colors.primary} />}
                    </Tap>
                  );
                })}
              </View>
            </View>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
