import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { View } from 'react-native';

import { AdminNav } from '@/components/AdminNav';
import { useDialogs } from '@/components/ui/Dialogs';
import { Badge, Button, Card, EmptyState, Row, Switch } from '@/components/ui/primitives';
import { PageHeader, Screen } from '@/components/ui/Screen';
import { Txt } from '@/components/ui/Txt';
import { partnerLogo, sortPartners } from '@/data/partners';
import { useStore } from '@/data/store';
import { useI18n } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';

/**
 * Admins: show or hide each partner. A hidden one (e.g. until the partnership is signed) is left out of
 * the public page and the members' Partners page; only the admins still see it, marked « Masqué ».
 */
export default function AdminPartners() {
  const { d, f } = useI18n();
  const p = d.adminPartners;
  const { colors } = useTheme();
  const { db, actions } = useStore();
  const { toast } = useDialogs();
  const partners = sortPartners(db.institutions);
  const shown = partners.filter((i) => !i.hidden).length;

  return (
    <Screen maxWidth={900}>
      <PageHeader
        title={p.title}
        subtitle={f(p.subtitle, { n: shown, total: partners.length })}
        right={<Button label={d.honorary.title} icon="external-link" variant="secondary" size="sm" onPress={() => router.push('/partenaires')} />}
      />
      <AdminNav />
      {partners.length === 0 ? (
        <EmptyState icon="home" title={d.common.noResults} />
      ) : (
        <Card style={{ gap: 4, paddingVertical: 8 }}>
          {partners.map((inst, i) => {
            const logo = partnerLogo(inst);
            return (
              <Row key={inst.id} gap={14} style={{ paddingVertical: 12, borderBottomWidth: i === partners.length - 1 ? 0 : 1, borderBottomColor: colors.border }}>
                <View style={{ width: 52, height: 52, borderRadius: 14, backgroundColor: '#fff', borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', opacity: inst.hidden ? 0.5 : 1 }}>
                  {logo ? <Image source={logo} style={{ width: 44, height: 44 }} contentFit="contain" /> : <Feather name="home" size={20} color={colors.primary} />}
                </View>
                <View style={{ flex: 1, gap: 4 }}>
                  <Txt variant="bodyStrong" color={inst.hidden ? 'textMuted' : 'text'}>{inst.name}</Txt>
                  {inst.hidden ? <Badge label={p.hiddenBadge} icon="eye-off" tone="neutral" style={{ alignSelf: 'flex-start' }} /> : <Txt variant="small" color="textSubtle">{p.visible}</Txt>}
                </View>
                <Switch
                  value={!inst.hidden}
                  onValueChange={(visible) => {
                    actions.setInstitutionHidden(inst.id, !visible);
                    toast(f(visible ? p.shownToast : p.hiddenToast, { name: inst.name }), 'success');
                  }}
                />
              </Row>
            );
          })}
        </Card>
      )}
      <Row gap={8} style={{ alignItems: 'flex-start' }}>
        <Feather name="info" size={14} color={colors.textSubtle} style={{ marginTop: 2 }} />
        <Txt variant="small" color="textSubtle" style={{ flex: 1 }}>{p.note}</Txt>
      </Row>
    </Screen>
  );
}
