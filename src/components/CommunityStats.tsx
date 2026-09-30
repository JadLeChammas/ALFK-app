import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { View } from 'react-native';

import { AreaLine, BarChart, Donut, HBarList } from '@/components/ui/Charts';
import { Flag } from '@/components/ui/Flag';
import { Badge, Card, Row, SectionHeader } from '@/components/ui/primitives';
import { Grid } from '@/components/ui/Screen';
import { Txt } from '@/components/ui/Txt';
import { countryByCode } from '@/data/countries';
import { useApprovedMembers } from '@/data/store';
import type { Role } from '@/data/types';
import { useI18n } from '@/i18n';
import { useLayout } from '@/theme/layout';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts } from '@/theme/tokens';

/** Read-only network analytics — shared by the admin dashboard and the school leadership's stats page. */
export function CommunityStats() {
  const { d, f, lang } = useI18n();
  const { colors } = useTheme();
  const { isMobile } = useLayout();
  const members = useApprovedMembers();
  const now = new Date();

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
  const byPromo = [...promoMap.entries()].sort((a, b) => b[0] - a[0]).slice(0, 8).map(([y, v]) => ({ label: f(d.common.promo, { year: y }), value: v }));

  // Where alumni went to study (same population as Repère).
  const schoolMap = new Map<string, { n: number; country?: string }>();
  members
    .filter((u) => (u.role === 'alumni' || u.role === 'admin') && u.school)
    .forEach((u) => schoolMap.set(u.school!, { n: (schoolMap.get(u.school!)?.n ?? 0) + 1, country: u.country }));
  const bySchool = [...schoolMap.entries()]
    .sort((a, b) => b[1].n - a[1].n)
    .slice(0, 8)
    .map(([s, v]) => ({ label: s, value: v.n, leading: v.country ? <Flag code={v.country} size={12} /> : undefined }));

  // Last 12 months: new sign-ups and cumulative total.
  const months = Array.from({ length: 12 }, (_, i) => new Date(now.getFullYear(), now.getMonth() - 11 + i, 1));
  const perMonth = months.map((m) => {
    const next = new Date(m.getFullYear(), m.getMonth() + 1, 1);
    return { label: d.monthsShort[m.getMonth()].slice(0, 3), value: members.filter((u) => new Date(u.createdAt) >= m && new Date(u.createdAt) < next).length };
  });
  let acc = members.filter((u) => new Date(u.createdAt) < months[0]).length;
  const growth = perMonth.map((p) => ({ label: p.label, value: (acc += p.value) }));
  const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
  const totalYearAgo = members.filter((u) => new Date(u.createdAt) < yearAgo).length;
  const pct = totalYearAgo ? Math.round(((members.length - totalYearAgo) / totalYearAgo) * 100) : 0;

  return (
    <View style={{ gap: 16 }}>
      <Grid min={isMobile ? 280 : 340} gap={16}>
        <Card style={{ height: '100%', gap: 8 }}>
          <Txt variant="small" color="textMuted">{d.admin.totalMembers}</Txt>
          <Row gap={10} style={{ alignItems: 'flex-end' }}>
            <Txt style={{ fontFamily: fonts.extrabold, fontSize: 48, lineHeight: 52, letterSpacing: -1.5, color: colors.text }}>{members.length.toLocaleString(lang === 'fr' ? 'fr-FR' : 'en-GB')}</Txt>
            <Badge label={`+${pct}%`} tone="success" icon="trending-up" style={{ marginBottom: 8 }} />
          </Row>
          <Txt variant="small" color="textSubtle">{d.admin.vsLastYear}</Txt>
          <View style={{ marginTop: 12 }}>
            <SectionHeader title={d.admin.growth} style={{ marginBottom: 10 }} />
            <AreaLine data={growth} height={110} />
          </View>
        </Card>
        <Card style={{ height: '100%' }}>
          <SectionHeader title={d.admin.byRole} icon="pie-chart" />
          <Donut data={byRole} centerValue={String(members.length)} centerLabel={d.nav.members} size={150} />
        </Card>
        <Card style={{ height: '100%' }}>
          <SectionHeader title={d.admin.byCountry} icon="globe" action={d.nav.repere} onAction={() => router.push('/repere')} />
          <HBarList data={byCountry} />
        </Card>
      </Grid>
      <Grid min={isMobile ? 280 : 340} gap={16}>
        <Card style={{ height: '100%' }}>
          <SectionHeader title={d.admin.bySchool} icon="book" action={d.nav.repere} onAction={() => router.push('/repere')} />
          <HBarList data={bySchool} />
        </Card>
        <Card style={{ height: '100%' }}>
          <SectionHeader title={d.admin.byPromo} icon="award" action={d.nav.directory} onAction={() => router.push('/annuaire')} />
          <HBarList data={byPromo} />
        </Card>
        <Card style={{ height: '100%' }}>
          <SectionHeader title={d.admin.newPerMonth} icon="bar-chart-2" />
          <BarChart data={perMonth} height={170} />
        </Card>
      </Grid>
    </View>
  );
}
