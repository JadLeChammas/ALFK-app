import { Feather } from '@expo/vector-icons';
import { View } from 'react-native';

import { AuthFrame } from '@/components/AuthFrame';
import { Button } from '@/components/ui/primitives';
import { Txt } from '@/components/ui/Txt';
import { useStore } from '@/data/store';
import { useI18n } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';

export default function Pending() {
  const { d, f } = useI18n();
  const { colors } = useTheme();
  const { me, actions } = useStore();
  const steps = [
    { label: d.auth.pendingStep1, state: 'done' },
    { label: d.auth.pendingStep2, state: 'current' },
    { label: d.auth.pendingStep3, state: 'todo' },
  ] as const;

  return (
    <AuthFrame title={d.auth.pendingTitle} subtitle={f(d.auth.pendingSub, { name: me?.firstName ?? '' })}>
      <View style={{ gap: 0, padding: 20, borderRadius: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }}>
        {steps.map((s, i) => {
          const color = s.state === 'done' ? colors.success : s.state === 'current' ? colors.warning : colors.borderStrong;
          return (
            <View key={s.label} style={{ flexDirection: 'row', gap: 14 }}>
              <View style={{ alignItems: 'center' }}>
                <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: s.state === 'todo' ? colors.surfaceAlt : color, alignItems: 'center', justifyContent: 'center' }}>
                  <Feather name={s.state === 'done' ? 'check' : s.state === 'current' ? 'clock' : 'unlock'} size={14} color={s.state === 'todo' ? colors.textSubtle : '#fff'} />
                </View>
                {i < steps.length - 1 && <View style={{ width: 2, height: 26, backgroundColor: colors.border }} />}
              </View>
              <Txt variant="bodyStrong" color={s.state === 'todo' ? 'textSubtle' : 'text'} style={{ marginTop: 3 }}>{s.label}</Txt>
            </View>
          );
        })}
      </View>
      <Button label={d.common.signOut} variant="secondary" icon="log-out" full size="lg" onPress={actions.signOut} />
    </AuthFrame>
  );
}
