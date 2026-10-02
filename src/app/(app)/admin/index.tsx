import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Switch, View } from 'react-native';

import { AdminNav } from '@/components/AdminNav';
import { useDialogs } from '@/components/ui/Dialogs';
import { CommunityStats } from '@/components/CommunityStats';
import { Card, Row, Tap, type IconName } from '@/components/ui/primitives';
import { Grid, PageHeader, Screen } from '@/components/ui/Screen';
import { Txt } from '@/components/ui/Txt';
import { useStore } from '@/data/store';
import { useI18n } from '@/i18n';
import { useLayout } from '@/theme/layout';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts, radius } from '@/theme/tokens';

export default function AdminDashboard() {
  const { toast } = useDialogs();
  const { d, f, formatDate } = useI18n();
  const { colors } = useTheme();
  const { isMobile } = useLayout();
  const { db, actions } = useStore();
  // The « Voir la démo » invitation for visitors (on unless an admin switched it off).
  const showDemo = db.settings.showDemo !== 'off';

  const now = new Date();
  const nextEvent = [...db.events].filter((e) => new Date(e.date) >= now).sort((x, y) => (x.date > y.date ? 1 : -1))[0];
  // `todo` tiles are work for the admin: red when something is waiting, calm when it's clear.
  const kpis: { label: string; value: number; icon: IconName; href: string; todo?: boolean; status?: string }[] = [
    { label: d.admin.toApprove, value: db.users.filter((u) => !u.approved).length, icon: 'user-plus', href: '/admin/approbations', todo: true },
    { label: d.pubReview.queue, value: db.publications.filter((p) => p.status === 'pending').length, icon: 'file-text', href: '/admin/contenus', todo: true },
    { label: d.questions.queue, value: db.questions.filter((q) => q.status === 'pending').length, icon: 'help-circle', href: '/admin/questions', todo: true },
    { label: d.admin.reported, value: db.conversations.filter((c) => c.report && !c.report.resolved).length, icon: 'flag', href: '/admin/contenus', todo: true },
    { label: d.admin.upcomingEvents, value: db.events.filter((e) => new Date(e.date) >= now).length, icon: 'calendar', href: '/evenements', status: nextEvent ? f(d.admin.kpiNext, { date: formatDate(nextEvent.date, { year: false }) }) : undefined },
    { label: d.admin.unreadContact, value: db.contacts.filter((c) => !c.read).length, icon: 'inbox', href: '/admin/contact', todo: true },
  ];

  return (
    <Screen>
      <PageHeader title={d.admin.title} subtitle={d.admin.subtitle} icon={<View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center' }}><Feather name="shield" size={20} color={colors.onInk} /></View>} />
      <AdminNav />

      <Grid min={isMobile ? 150 : 220} gap={16}>
        {kpis.map((k) => {
          const hot = !!k.todo && k.value > 0;
          const status = k.status ?? (k.todo ? (hot ? d.admin.kpiTodo : d.admin.kpiClear) : undefined);
          return (
            <Card key={k.label} onPress={() => router.push(k.href as never)} style={{ gap: 12, height: '100%' }}>
              <Row style={{ justifyContent: 'space-between' }}>
                <Row gap={14}>
                  <View style={{ width: 44, height: 44, borderRadius: radius.card, backgroundColor: hot ? colors.primarySoft : colors.secondarySoft, alignItems: 'center', justifyContent: 'center' }}>
                    <Feather name={k.icon} size={19} color={hot ? colors.primary : colors.secondaryStrong} />
                  </View>
                  <Txt style={{ fontFamily: fonts.display, fontSize: 46, lineHeight: 48, color: hot ? colors.primary : colors.text }}>{k.value}</Txt>
                </Row>
                <Feather name="arrow-up-right" size={16} color={colors.textSubtle} />
              </Row>
              <View style={{ gap: 4 }}>
                <Txt variant="bodyStrong">{k.label}</Txt>
                {status && (
                  <Row gap={6}>
                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: hot ? colors.primary : k.todo ? colors.success : colors.secondary }} />
                    <Txt variant="small" color="textMuted">{status}</Txt>
                  </Row>
                )}
              </View>
            </Card>
          );
        })}
      </Grid>

      {/* Visitors: show or hide the « Voir la démo » invitation (home and sign-in pages). */}
      <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <View style={{ width: 44, height: 44, borderRadius: radius.card, backgroundColor: showDemo ? colors.secondarySoft : colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}>
          <Feather name={showDemo ? 'eye' : 'eye-off'} size={19} color={showDemo ? colors.secondaryStrong : colors.textSubtle} />
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Txt variant="bodyStrong">{d.demo.adminTitle}</Txt>
          <Txt variant="small" color="textMuted">{d.demo.adminSub}</Txt>
          <Txt variant="small" style={{ color: showDemo ? colors.success : colors.textSubtle, fontFamily: fonts.semibold }}>{showDemo ? d.demo.shown : d.demo.hidden}</Txt>
        </View>
        <Switch
          value={showDemo}
          onValueChange={(on) => {
            actions.setShowDemo(on);
            toast(on ? d.demo.shownToast : d.demo.hiddenToast);
          }}
          accessibilityLabel={d.demo.adminTitle}
        />
      </Card>

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
