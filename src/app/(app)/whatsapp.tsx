import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Linking, View } from 'react-native';

import { useDialogs } from '@/components/ui/Dialogs';
import { Badge, Button, Card, EmptyState, Row, SectionHeader, Tap } from '@/components/ui/primitives';
import { Grid, PageHeader, Screen } from '@/components/ui/Screen';
import { Txt } from '@/components/ui/Txt';
import { useMe, useStore } from '@/data/store';
import { useI18n } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';

const WHATSAPP = '#25D366';
export const isWhatsappLink = (url: string) => /^https:\/\/(chat\.whatsapp\.com|wa\.me|whatsapp\.com)\//i.test(url.trim());

/** WhatsApp: the Amicale community (announcements) and each Promo LFK group. */
export default function Whatsapp() {
  const { d, f } = useI18n();
  const { colors } = useTheme();
  const { db, actions } = useStore();
  const { prompt, toast } = useDialogs();
  const me = useMe();
  const admin = me.role === 'admin';
  // Promo groups are for former students; lycée students only get the community (announcements).
  const alumni = me.role === 'alumni' || me.role === 'admin';
  const community = db.settings.whatsappCommunity;
  const myPromo = me.promo ? db.promos.find((p) => p.year === me.promo) : undefined;
  const groups = [...db.promos].filter((p) => p.whatsapp).sort((a, b) => b.year - a.year);

  const editCommunity = async () => {
    const url = await prompt({ title: d.whatsapp.editCommunity, placeholder: 'https://chat.whatsapp.com/…', initial: community });
    if (url === null) return;
    if (url.trim() && !isWhatsappLink(url)) return toast(d.whatsapp.invalidLink, 'danger');
    actions.setWhatsappCommunity(url);
    toast(d.common.saved);
  };

  return (
    <Screen maxWidth={1040}>
      <PageHeader title={d.whatsapp.title} subtitle={d.whatsapp.subtitle} />

      <Card style={{ gap: 16, borderColor: WHATSAPP }}>
        <Row gap={14} style={{ alignItems: 'flex-start' }}>
          <View style={{ width: 52, height: 52, borderRadius: 16, backgroundColor: WHATSAPP, alignItems: 'center', justifyContent: 'center' }}>
            <Feather name="radio" size={24} color="#fff" />
          </View>
          <View style={{ flex: 1, gap: 4 }}>
            <Txt variant="h2">{d.whatsapp.communityTitle}</Txt>
            <Txt color="textMuted">{d.whatsapp.communitySub}</Txt>
          </View>
        </Row>
        <Row gap={10} wrap>
          {community ? (
            <Button label={d.whatsapp.join} icon="external-link" onPress={() => Linking.openURL(community)} style={{ backgroundColor: WHATSAPP, borderColor: WHATSAPP }} />
          ) : (
            <Badge label={d.whatsapp.noCommunity} tone="neutral" icon="clock" />
          )}
          {admin && <Button label={d.whatsapp.editCommunity} icon="edit-2" variant="secondary" size="sm" onPress={editCommunity} />}
        </Row>
      </Card>

      {alumni && (
        <Card style={{ gap: 14 }}>
          <SectionHeader title={d.whatsapp.myPromo} icon="award" />
          {!me.promo ? (
            <EmptyState icon="award" title={d.home.noPromo} action={<Button label={d.profile.edit} size="sm" variant="secondary" onPress={() => router.push('/profil/modifier')} />} />
          ) : myPromo?.whatsapp ? (
            <Row gap={12} wrap>
              <Txt variant="h3" style={{ flex: 1 }}>{f(d.common.promo, { year: me.promo })}</Txt>
              <Button label={d.promo.whatsapp} icon="message-square" onPress={() => Linking.openURL(myPromo.whatsapp!)} style={{ backgroundColor: WHATSAPP, borderColor: WHATSAPP }} />
            </Row>
          ) : (
            <View style={{ gap: 10 }}>
              <Txt color="textMuted">{d.whatsapp.noGroup}</Txt>
              <Txt variant="small" color="textSubtle">{d.whatsapp.askAdmin}</Txt>
              <Button label={f(d.common.promo, { year: me.promo })} icon="arrow-right" size="sm" variant="secondary" style={{ alignSelf: 'flex-start' }} onPress={() => router.push(`/annuaire/promo/${me.promo}`)} />
            </View>
          )}
        </Card>
      )}

      {alumni && (
        <View style={{ gap: 14 }}>
          <SectionHeader title={d.whatsapp.allGroups} icon="message-circle" count={String(groups.length)} />
          {groups.length === 0 ? (
            <EmptyState icon="message-circle" title={d.whatsapp.noGroup} />
          ) : (
            <Grid min={200} gap={12}>
              {groups.map((p) => (
                <Tap
                  key={p.year}
                  onPress={() => Linking.openURL(p.whatsapp!)}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: p.year === me.promo ? WHATSAPP : colors.border }}
                  hoverStyle={{ borderColor: WHATSAPP }}>
                  <Feather name="message-square" size={18} color={WHATSAPP} />
                  <Txt variant="bodyStrong" style={{ flex: 1 }}>{f(d.common.promo, { year: p.year })}</Txt>
                  <Feather name="external-link" size={14} color={colors.textSubtle} />
                </Tap>
              ))}
            </Grid>
          )}
        </View>
      )}
    </Screen>
  );
}
