import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { View } from 'react-native';

import { AdminNav } from '@/components/AdminNav';
import { CommunityStats } from '@/components/CommunityStats';
import { Card, Row, Tap, toneColors, type IconName, type Tone } from '@/components/ui/primitives';
import { Grid, PageHeader, Screen } from '@/components/ui/Screen';
import { Txt } from '@/components/ui/Txt';
import { useStore } from '@/data/store';
import { useI18n } from '@/i18n';
import { useLayout } from '@/theme/layout';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts } from '@/theme/tokens';

export default function AdminDashboard() {
  const { d } = useI18n();
  const { colors } = useTheme();
  const { isMobile } = useLayout();
  const { db } = useStore();

  const now = new Date();
  const kpis: { label: string; value: number; icon: IconName; tone: Tone; href: string }[] = [
    { label: d.admin.toApprove, value: db.users.filter((u) => !u.approved).length, icon: 'user-plus', tone: 'warning', href: '/admin/approbations' },
    { label: d.admin.reported, value: db.conversations.filter((c) => c.report && !c.report.resolved).length, icon: 'flag', tone: 'danger', href: '/admin/contenus' },
    { label: d.admin.upcomingEvents, value: db.events.filter((e) => new Date(e.date) >= now).length, icon: 'calendar', tone: 'violet', href: '/evenements' },
    { label: d.admin.unreadContact, value: db.contacts.filter((c) => !c.read).length, icon: 'inbox', tone: 'info', href: '/admin/contact' },
  ];

  return (
    <Screen>
      <PageHeader title={d.admin.title} subtitle={d.admin.subtitle} icon={<View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center' }}><Feather name="shield" size={20} color={colors.onInk} /></View>} />
      <AdminNav />

      <Grid min={isMobile ? 150 : 220} gap={16}>
        {kpis.map((k) => {
          const t = toneColors(colors, k.tone);
          return (
            <Card key={k.label} onPress={() => router.push(k.href as never)} style={{ gap: 14, height: '100%' }}>
              <Row style={{ justifyContent: 'space-between' }}>
                <View style={{ width: 40, height: 40, borderRadius: 13, backgroundColor: t.bg, alignItems: 'center', justifyContent: 'center' }}>
                  <Feather name={k.icon} size={18} color={t.fg} />
                </View>
                <Feather name="arrow-up-right" size={16} color={colors.textSubtle} />
              </Row>
              <View>
                <Txt style={{ fontFamily: fonts.extrabold, fontSize: 32, lineHeight: 38, color: colors.text }}>{k.value}</Txt>
                <Txt variant="small" color="textMuted">{k.label}</Txt>
              </View>
            </Card>
          );
        })}
      </Grid>

      <View style={{ gap: 16 }}>
        <Txt variant="h2">{d.admin.stats}</Txt>
        <CommunityStats />
      </View>
      <Tap onPress={() => router.push('/admin/journal')} style={{ alignSelf: 'center' }}>
        <Txt variant="smallStrong" color="primary">{d.admin.logs} →</Txt>
      </Tap>
    </Screen>
  );
}
