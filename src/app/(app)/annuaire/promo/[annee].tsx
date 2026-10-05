import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { View } from 'react-native';

import { MemberCard } from '@/components/cards';
import { HBarList } from '@/components/ui/Charts';
import { Flag } from '@/components/ui/Flag';
import { Avatar, Badge, Button, Card, Row, SectionHeader, Tap } from '@/components/ui/primitives';
import { PromoLogo } from '@/components/PromoLogo';
import { BackLink, Columns, Grid, Screen } from '@/components/ui/Screen';
import { Txt } from '@/components/ui/Txt';
import { fullName, useApprovedMembers, useMe, useStore } from '@/data/store';
import { groupByPlace, usePlaceAliases } from '@/data/places';
import { useI18n } from '@/i18n';
import { useLayout } from '@/theme/layout';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts, radius } from '@/theme/tokens';
import { openExternal } from '@/lib/links';

export default function PromoPage() {
  const { annee } = useLocalSearchParams<{ annee: string }>();
  const year = Number(annee);
  const { d, f, relative, country } = useI18n();
  const { colors } = useTheme();
  const { isMobile } = useLayout();
  const { db } = useStore();
  const me = useMe();
  const all = useApprovedMembers();
  const members = useMemo(() => all.filter((u) => u.promo === year).sort((a, b) => a.lastName.localeCompare(b.lastName)), [all, year]);
  const info = db.promos.find((p) => p.year === year);
  const [now] = useState(() => Date.now());

  const aliases = usePlaceAliases();
  // Same university written differently counts once (data/places.ts).
  const schools = useMemo(() => groupByPlace(members, (u) => u.school, aliases).map((g) => [g.label, g.items.length] as [string, number]), [members, aliases]);
  const countries = useMemo(() => countBy(members.map((u) => u.country)), [members]);
  const recent = [...members].sort((a, b) => (a.lastActiveAt < b.lastActiveAt ? 1 : -1)).slice(0, 5);

  return (
    <Screen>
      <BackLink label={d.nav.directory} href="/annuaire" />

      {/* Header banner */}
      <View style={{ minHeight: isMobile ? 220 : 260, borderRadius: radius.hero, overflow: 'hidden', backgroundColor: colors.ink }}>
        {info?.groupPhoto && <Image source={{ uri: info.groupPhoto }} style={{ position: 'absolute', width: '100%', height: '100%' }} contentFit="cover" />}
        <LinearGradient colors={['rgba(14, 42, 71,0.05)', 'rgba(0,18,60,0.9)']} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
        {/* The promo's logo (emblem + year): beside the title, above it on phones. */}
        <View style={{ flex: 1, flexDirection: isMobile ? 'column' : 'row-reverse', alignItems: isMobile ? 'flex-start' : 'flex-end', padding: isMobile ? 20 : 32, gap: isMobile ? 14 : 28 }}>
          <PromoLogo year={year} size={isMobile ? 84 : 132} />
          <View style={{ flex: 1, justifyContent: 'flex-end', gap: 14 }}>
            {me.promo === year && <Badge label={d.promo.yourPromo} tone="primary" icon="star" />}
            <Txt style={{ color: '#fff', fontFamily: fonts.serif, fontSize: isMobile ? 40 : 60, lineHeight: isMobile ? 44 : 64, letterSpacing: -0.5 }}>{f(d.promo.title, { year })}</Txt>
            <Row gap={16} wrap>
              <Stat icon="users" text={f(d.common.members, { n: members.length })} />
              <Stat icon="book" text={f(d.repere.universitiesCount, { n: schools.length })} />
              <Stat icon="globe" text={f(d.repere.countriesCount, { n: countries.length })} />
            </Row>
            <Row gap={10} wrap>
              {/* The group's link: only for this promo's own members — admins included, who manage every link from the dashboard. */}
              {me.promo === year && (info?.whatsapp ? (
                <Button label={d.promo.whatsapp} icon="message-square" onPress={() => openExternal(info.whatsapp!)} style={{ backgroundColor: '#25D366', borderColor: '#25D366' }} />
              ) : (
                <Badge label={d.promo.noWhatsapp} tone="neutral" icon="message-square" />
              ))}
              {me.role === 'admin' && <Button label={d.promo.editWhatsapp} variant="secondary" size="sm" icon="edit-2" onPress={() => router.push('/admin/whatsapp')} />}
            </Row>
          </View>
        </View>
      </View>

      <Columns
        main={
          <View style={{ gap: 16 }}>
            <SectionHeader title={d.promo.membersList} icon="users" count={String(members.length)} />
            <Grid min={isMobile ? 150 : 190} gap={isMobile ? 12 : 16}>
              {members.map((u) => <MemberCard key={u.id} user={u} />)}
            </Grid>
          </View>
        }
        aside={
          <>
            <Card>
              <SectionHeader title={d.promo.recentlyActive} icon="activity" />
              <View style={{ gap: 12 }}>
                {recent.map((u) => (
                  <Tap key={u.id} onPress={() => router.push(`/membre/${u.id}`)} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <Avatar uri={u.avatar} name={fullName(u)} size={38} online={now - new Date(u.lastActiveAt).getTime() < 3_600_000} />
                    <View style={{ flex: 1 }}>
                      <Txt variant="smallStrong" numberOfLines={1}>{fullName(u)}</Txt>
                      <Txt variant="small" color="textSubtle">{relative(u.lastActiveAt)}</Txt>
                    </View>
                  </Tap>
                ))}
              </View>
            </Card>
            <Card>
              <SectionHeader title={d.promo.universities} icon="book" />
              <HBarList data={schools.slice(0, 6).map(([label, value]) => ({ label, value }))} />
            </Card>
            <Card>
              <SectionHeader title={d.promo.countries} icon="globe" />
              <HBarList data={countries.slice(0, 6).map(([code, value]) => ({ label: country(code), leading: <Flag code={code} size={12} />, value }))} />
            </Card>
          </>
        }
      />
    </Screen>
  );
}

function Stat({ icon, text }: { icon: 'users' | 'book' | 'globe'; text: string }) {
  return (
    <Row gap={6}>
      <Feather name={icon} size={14} color="rgba(255,255,255,0.8)" />
      <Txt style={{ color: 'rgba(255,255,255,0.9)', fontFamily: fonts.semibold, fontSize: 14 }}>{text}</Txt>
    </Row>
  );
}

function countBy(values: (string | undefined)[]) {
  const m = new Map<string, number>();
  for (const v of values) if (v) m.set(v, (m.get(v) ?? 0) + 1);
  return [...m.entries()].sort((a, b) => b[1] - a[1]);
}
