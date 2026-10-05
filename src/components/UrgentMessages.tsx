import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Modal, ScrollView, View } from 'react-native';

import { Button, Card, Row } from '@/components/ui/primitives';
import { Txt } from '@/components/ui/Txt';
import { useStore } from '@/data/store';
import { urgentReason } from '@/data/urgentReasons';
import { useI18n } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';

/**
 * The admins' urgent messages to the signed-in member: a pop-up over every page (from the moment they
 * sign in) that stays until they click « J'ai compris » — one message at a time, the oldest first.
 */
export function UrgentMessages() {
  const { d, f, formatDate } = useI18n();
  const u = d.urgent;
  const { colors } = useTheme();
  const { db, me, session, actions } = useStore();
  const active = !!me?.approved && !me.needsCompletion && !session?.recovery;
  const pending = active ? (db?.urgentMessages ?? []).filter((m) => m.userId === me!.id && !m.acknowledgedAt) : [];
  const m = pending[0];
  if (!m) return null;
  const reasons = m.reasons.map((key) => ({ key, def: urgentReason(key) })).filter((r) => r.def && u.reasons[r.key as keyof typeof u.reasons]);
  const done = () => actions.acknowledgeUrgentMessage(m.id);

  return (
    <Modal visible transparent animationType="fade" onRequestClose={() => {}}>
      <View style={{ flex: 1, backgroundColor: 'rgba(5, 15, 30, 0.72)', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
        <View style={{ width: '100%', maxWidth: 520, maxHeight: '92%', borderRadius: 24, overflow: 'hidden', backgroundColor: colors.surface }}>
          {/* A red band: impossible to miss. */}
          <Row gap={12} style={{ backgroundColor: colors.primary, paddingHorizontal: 22, paddingVertical: 18 }}>
            <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' }}>
              <Feather name="alert-triangle" size={22} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Txt variant="h3" style={{ color: '#fff' }}>{u.popupTitle}</Txt>
              <Txt variant="small" style={{ color: 'rgba(255,255,255,0.85)' }}>{`${u.from} · ${formatDate(m.createdAt)}`}</Txt>
            </View>
            {pending.length > 1 && <Txt variant="smallStrong" style={{ color: '#fff' }}>{f(u.counter, { i: 1, n: pending.length })}</Txt>}
          </Row>

          <ScrollView contentContainerStyle={{ padding: 22, gap: 16 }}>
            {!!m.title && <Txt variant="h2">{m.title}</Txt>}
            {!!m.body && <Txt>{m.body}</Txt>}
            {reasons.map(({ key, def }) => {
              const r = u.reasons[key as keyof typeof u.reasons];
              return (
                <Card key={key} style={{ gap: 10, borderColor: colors.primary, borderWidth: 1 }}>
                  <Row gap={10}>
                    <Feather name={def!.icon} size={18} color={colors.primary} />
                    <Txt variant="bodyStrong" style={{ flex: 1 }}>{r.title}</Txt>
                  </Row>
                  <Txt color="textMuted">{r.body}</Txt>
                  {def!.href && (
                    <Button
                      label={r.action}
                      icon={def!.icon}
                      size="sm"
                      style={{ alignSelf: 'flex-start' }}
                      onPress={() => {
                        done();
                        router.push(def!.href as never);
                      }}
                    />
                  )}
                </Card>
              );
            })}
          </ScrollView>

          <View style={{ padding: 22, paddingTop: 0 }}>
            <Button label={u.understood} icon="check" variant="secondary" onPress={done} />
          </View>
        </View>
      </View>
    </Modal>
  );
}
