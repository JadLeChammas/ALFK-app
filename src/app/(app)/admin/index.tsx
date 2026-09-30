import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { View } from 'react-native';

import { AdminNav } from '@/components/AdminNav';
import { AreaLine, BarChart, Donut, HBarList } from '@/components/ui/Charts';
import { Flag } from '@/components/ui/Flag';
import { Badge, Card, Row, SectionHeader, Tap, toneColors, type IconName, type Tone } from '@/components/ui/primitives';
import { Grid, PageHeader, Screen } from '@/components/ui/Screen';
import { Txt } from '@/components/ui/Txt';
import { countryByCode } from '@/data/countries';
import { useApprovedMembers, useStore } from '@/data/store';
import type { Role } from '@/data/types';
import { useI18n } from '@/i18n';
import { useLayout } from '@/theme/layout';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts } from '@/theme/tokens';

export default function AdminDashboard() {
  const { d, f, lang } = useI18n();
  const { colors } = useTheme();
  const { isMobile } = useLayout();
  const { db } = useStore();
  const members = useApprovedMembers();

  const now = new Date();
  const kpis: { label: string; value: number; icon: IconName; tone: Tone; href: string }[] = [
    { label: d.admin.toApprove, value: db.users.filter((u) => !u.approved).length, icon: 'user-plus', tone: 'warning', href: '/admin/approbations' },
    { label: d.admin.reported, value: db.conversations.filter((c) => c.report && !c.report.resolved).length, icon: 'flag', tone: 'danger', href: '/admin/contenus' },
    { label: d.admin.upcomingEvents, value: db.events.filter((e) => new Date(e.date) >= now).length, icon: 'calendar', tone: 'violet', href: '/evenements' },
    { label: d.admin.unreadContact, value: db.contacts.filter((c) => !c.read).length, icon: 'inbox', tone: 'info', href: '/admin/contact' },
  ];

  const stats = (() => {
    const roleOrder: Role[] = ['alumni', 'honneur', 'admin', 'eleve']; // fixed order = fixed chart colors
    const byRole = roleOrder.map((r) => ({ label: d.roles[r], value: members.filter((u) => u.role === r).length }));

    const countryMap = new Map<string, number>();
    members.forEach((u) => u.country && countryMap.set(u.country, (countryMap.get(u.country) ?? 0) + 1));
    const countries = [...countryMap.entries()].sort((a, b) => b[1] - a[1]);
    const byCountry = countries.slice(0, 6).map(([c, v]) => ({ label: countryByCode(c)?.[lang] ?? c, leading: <Flag code={c} size={12} />, value: v }));
    const others = countries.slice(6).reduce((a, [, v]) => a + v, 0);
    if (others) byCountry.push({ label: d.common.other, leading: <Feather name="globe" size={13} color={colors.textSubtle} />, value: others });

    const promoMap = new Map<number, number>();
    members.forEach((u) => u.promo && promoMap.set(u.promo, (promoMap.get(u.promo) ?? 0) + 1));
    const byPromo = [...promoMap.entries()].sort((a, b) => b[0] - a[0]).slice(0, 8).map(([y, v]) => ({ label: String(y), value: v }));

    // Last 12 months: new sign-ups and cumulative total.
    const months = Array.from({ length: 12 }, (_, i) => new Date(now.getFullYear(), now.getMonth() - 11 + i, 1));
    const perMonth = months.map((m) => {
      const next = new Date(m.getFullYear(), m.getMonth() + 1, 1);
      return { label: d.monthsShort[m.getMonth()].slice(0, 3), value: members.filter((u) => new Date(u.createdAt) >= m && new Date(u.createdAt) < next).length };
    });
    const before = members.filter((u) => new Date(u.createdAt) < months[0]).length;
    let acc = before;
    const growth = perMonth.map((p) => ({ label: p.label, value: (acc += p.value) }));
    const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    const totalYearAgo = members.filter((u) => new Date(u.createdAt) < yearAgo).length;
    const pct = totalYearAgo ? Math.round(((members.length - totalYearAgo) / totalYearAgo) * 100) : 0;
    return { byRole, byCountry, byPromo, perMonth, growth, pct };
  })();

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
        <Grid min={isMobile ? 280 : 340} gap={16}>
          <Card style={{ height: '100%', gap: 8 }}>
            <Txt variant="small" color="textMuted">{d.admin.totalMembers}</Txt>
            <Row gap={10} style={{ alignItems: 'flex-end' }}>
              <Txt style={{ fontFamily: fonts.extrabold, fontSize: 48, lineHeight: 52, letterSpacing: -1.5, color: colors.text }}>{members.length.toLocaleString(lang === 'fr' ? 'fr-FR' : 'en-GB')}</Txt>
              <Badge label={`+${stats.pct}%`} tone="success" icon="trending-up" style={{ marginBottom: 8 }} />
            </Row>
            <Txt variant="small" color="textSubtle">{d.admin.vsLastYear}</Txt>
            <View style={{ marginTop: 12 }}>
              <SectionHeader title={d.admin.growth} style={{ marginBottom: 10 }} />
              <AreaLine data={stats.growth} height={110} />
            </View>
          </Card>
          <Card style={{ height: '100%' }}>
            <SectionHeader title={d.admin.byRole} icon="pie-chart" />
            <Donut data={stats.byRole} centerValue={String(members.length)} centerLabel={d.nav.members} size={150} />
          </Card>
          <Card style={{ height: '100%' }}>
            <SectionHeader title={d.admin.byCountry} icon="globe" action={d.nav.repere} onAction={() => router.push('/repere')} />
            <HBarList data={stats.byCountry} />
          </Card>
        </Grid>
        <Grid min={isMobile ? 280 : 440} gap={16}>
          <Card style={{ height: '100%' }}>
            <SectionHeader title={d.admin.newPerMonth} icon="bar-chart-2" />
            <BarChart data={stats.perMonth} height={170} />
          </Card>
          <Card style={{ height: '100%' }}>
            <SectionHeader title={d.admin.byPromo} icon="award" action={d.nav.directory} onAction={() => router.push('/annuaire')} />
            <HBarList data={stats.byPromo.map((p) => ({ ...p, label: f(d.common.promo, { year: p.label }) }))} />
          </Card>
        </Grid>
      </View>
      <Tap onPress={() => router.push('/admin/journal')} style={{ alignSelf: 'center' }}>
        <Txt variant="smallStrong" color="primary">{d.admin.logs} →</Txt>
      </Tap>
    </Screen>
  );
}
