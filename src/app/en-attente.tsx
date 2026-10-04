import { Feather } from '@expo/vector-icons';
import { useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { AuthFrame } from '@/components/AuthFrame';
import { ProofPicker } from '@/components/ProofPicker';
import { useDialogs } from '@/components/ui/Dialogs';
import { Badge, Button, Row } from '@/components/ui/primitives';
import { Txt } from '@/components/ui/Txt';
import type { PickedDoc } from '@/data/remote';
import { useStore } from '@/data/store';
import { useI18n } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';

export default function Pending() {
  const { d, f } = useI18n();
  const { colors } = useTheme();
  const { me, actions, sendingSignupFiles } = useStore();
  const { toast } = useDialogs();
  const [doc, setDoc] = useState<PickedDoc | null>(null);
  const [busy, setBusy] = useState(false);
  const hasProof = !!me?.proof || !!me?.createdByAdmin;
  const send = async () => {
    if (!doc) return;
    setBusy(true);
    const r = await actions.submitProof(doc);
    setBusy(false);
    if (!r.ok) return toast(d.auth.errors.unknown, 'danger');
    setDoc(null);
    toast(d.proof.sent);
  };
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
      {!hasProof && sendingSignupFiles ? (
        // Just signed up: the proof chosen in the form is still on its way.
        <Row gap={10} style={{ padding: 14, borderRadius: 16, backgroundColor: colors.surfaceAlt }}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Txt variant="smallStrong" style={{ flex: 1 }}>{d.proof.sending}</Txt>
        </Row>
      ) : hasProof ? (
        <Row gap={10} style={{ padding: 14, borderRadius: 16, backgroundColor: colors.successSoft }}>
          <Feather name="file-text" size={18} color={colors.success} />
          <Txt variant="smallStrong" style={{ flex: 1 }} numberOfLines={1}>{me?.proof?.name ?? d.proof.adminCreated}</Txt>
          <Badge label={d.proof.received} tone="success" />
        </Row>
      ) : (
        <View style={{ gap: 12 }}>
          <Row gap={8} style={{ padding: 12, borderRadius: 12, backgroundColor: colors.warningSoft }}>
            <Feather name="alert-triangle" size={16} color={colors.warning} />
            <Txt variant="smallStrong" style={{ flex: 1 }}>{d.proof.pendingHint}</Txt>
          </Row>
          <ProofPicker value={doc} onChange={setDoc} />
          <Button label={d.proof.send} icon="send" full size="lg" onPress={send} disabled={!doc} loading={busy} />
        </View>
      )}
      <Button label={d.common.signOut} variant="secondary" icon="log-out" full size="lg" onPress={actions.signOut} />
    </AuthFrame>
  );
}
