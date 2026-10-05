import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Switch, View } from 'react-native';

import { AdminNav } from '@/components/AdminNav';
import { useDialogs } from '@/components/ui/Dialogs';
import { CommunityStats } from '@/components/CommunityStats';
import { Button, Card, Row, Tap, type IconName } from '@/components/ui/primitives';
import { Grid, PageHeader, Screen } from '@/components/ui/Screen';
import { Txt } from '@/components/ui/Txt';
import { useStore } from '@/data/store';
import type { Grade } from '@/data/types';
import { useI18n } from '@/i18n';
import { useLayout } from '@/theme/layout';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts, radius } from '@/theme/tokens';
import { awaitsApproval } from '@/data/members';

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
    { label: d.admin.toApprove, value: db.users.filter(awaitsApproval).length, icon: 'user-plus', href: '/admin/approbations', todo: true },
    { label: d.pubReview.queue, value: db.publications.filter((p) => p.status === 'pending').length, icon: 'file-text', href: '/admin/contenus', todo: true },
    { label: d.questions.queue, value: db.questions.filter((q) => q.status === 'pending').length, icon: 'help-circle', href: '/admin/questions', todo: true },
    { label: d.admin.reported, value: db.conversations.filter((c) => c.report && !c.report.resolved).length, icon: 'flag', href: '/admin/contenus', todo: true },
    { label: d.admin.upcomingEvents, value: db.events.filter((e) => new Date(e.date) >= now).length, icon: 'calendar', href: '/evenements', status: nextEvent ? f(d.admin.kpiNext, { date: formatDate(nextEvent.date, { year: false }) }) : undefined },
    { label: d.clubs.kpi, value: db.clubs.filter((c) => c.status === 'pending').length, icon: 'grid', href: '/clubs', todo: true },
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

      <PromoteStudentsCard />

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

/**
 * New school year: Terminale → Alumni (they complete their account before using the site),
 * Première → Terminale, Seconde → Première.
 */
function PromoteStudentsCard() {
  const { d, f } = useI18n();
  const p = d.promote;
  const { colors } = useTheme();
  const { db, actions } = useStore();
  const { confirm, toast } = useDialogs();
  const [busy, setBusy] = useState(false);
  const students = db.users.filter((u) => u.approved && u.role === 'eleve');
  const count = (g: Grade) => students.filter((u) => u.grade === g).length;
  const noGrade = students.filter((u) => !u.grade).length;
  const total = count('Tle') + count('1ere') + count('2nde');

  const run = async () => {
    const ok = await confirm({ title: p.title, message: f(p.confirm, { tle: count('Tle'), first: count('1ere'), second: count('2nde') }), confirmLabel: p.button });
    if (!ok) return;
    setBusy(true);
    const r = await actions.promoteStudents();
    setBusy(false);
    toast(r.ok ? f(p.done, { n: r.alumni }) : d.auth.errors.unknown, r.ok ? 'success' : 'danger');
  };

  return (
    <Card style={{ gap: 14 }}>
      <Row gap={14} style={{ alignItems: 'flex-start' }}>
        <View style={{ width: 44, height: 44, borderRadius: radius.card, backgroundColor: colors.secondarySoft, alignItems: 'center', justifyContent: 'center' }}>
          <Feather name="trending-up" size={19} color={colors.secondaryStrong} />
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Txt variant="bodyStrong">{p.title}</Txt>
          <Txt variant="small" color="textMuted">{p.sub}</Txt>
        </View>
      </Row>
      <Row gap={8} wrap>
        {(['2nde', '1ere', 'Tle'] as Grade[]).map((g) => (
          <View key={g} style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, backgroundColor: colors.surfaceAlt }}>
            <Txt variant="small" color="textMuted">{d.grade[g]}</Txt>
            <Txt variant="bodyStrong">{count(g)}</Txt>
          </View>
        ))}
      </Row>
      {noGrade > 0 && <Txt variant="small" color="warning">{f(p.noGrade, { n: noGrade })}</Txt>}
      <Button label={p.button} icon="trending-up" onPress={run} loading={busy} disabled={total === 0} style={{ alignSelf: 'flex-start' }} />
    </Card>
  );
}

