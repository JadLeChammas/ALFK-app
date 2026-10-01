import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { ScrollView, View } from 'react-native';

import { DateBadge } from '@/components/cards';
import { GlobeCard, StatsRow, useDestinationMarkers } from '@/components/site/blocks';
import { Avatar, Badge, Button, Card, CountBadge, MetaLine, Row, SectionHeader, Tap, type IconName } from '@/components/ui/primitives';
import { Grid, Screen } from '@/components/ui/Screen';
import { Txt } from '@/components/ui/Txt';
import { COUNTRIES } from '@/data/countries';
import { contactError } from '@/data/members';
import { can } from '@/data/permissions';
import { fullName, useApprovedMembers, useInbox, useMe, usePublished, useStore, useUpcomingBirthdays } from '@/data/store';
import { Flag } from '@/components/ui/Flag';
import { useI18n } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts, radius } from '@/theme/tokens';

export default function Home() {
  const { colors } = useTheme();
  const { d, f, formatDate } = useI18n();
  const me = useMe();
  const { db } = useStore();
  const published = usePublished();
  const { unread } = useInbox();
  const members = useApprovedMembers();
  const birthdays = useUpcomingBirthdays(30).filter((b) => b.user.id !== me.id);
  const now = new Date().toISOString();
  const nextEvent = [...db.events].filter((e) => e.date >= now).sort((a, b) => (a.date > b.date ? 1 : -1))[0];
  const news = published.slice(0, 3);
  const promoMates = me.promo ? members.filter((u) => u.promo === me.promo) : [];
  const promoInfo = db.promos.find((p) => p.year === me.promo);
  const pending = db.users.filter((u) => !u.approved).length;
  const markers = useDestinationMarkers();

  const actions: { icon: IconName; label: string; href: string; badge?: number }[] = [
    ...(can(me, 'viewEvents') ? [{ icon: 'calendar' as const, label: d.home.seeEvents, href: '/evenements' }] : []),
    { icon: 'users', label: d.nav.directory, href: '/annuaire' },
    { icon: 'book-open', label: d.nav.publications, href: '/publications' },
    { icon: 'message-circle', label: d.nav.messages, href: '/messages', badge: unread },
    me.role === 'honneur'
      ? { icon: 'bar-chart-2', label: d.nav.stats, href: '/statistiques' }
      : { icon: 'award', label: d.home.myPromo, href: me.promo ? `/annuaire/promo/${me.promo}` : '/profil/modifier' },
    { icon: 'globe', label: d.nav.repere, href: '/repere' },
    // Students first look for guidance; alumni for their Promo LFK WhatsApp group.
    me.role === 'eleve' ? { icon: 'compass', label: d.nav.orientation, href: '/orientation' } : { icon: 'message-square', label: d.nav.whatsapp, href: '/whatsapp' },
    { icon: 'calendar', label: d.nav.calendar, href: '/calendrier' },
  ];

  return (
    <Screen>
      {/* Hero — Interactive Globe card: greeting, network figures, alumni globe */}
      <GlobeCard
        compact
        title={f(d.home.hello, { name: me.firstName })}
        lead={`${formatDate(new Date(), { weekday: true })} · ${me.fonction ?? d.roles[me.role]}`}
        markers={markers}
        stats={<StatsRow light dense />}>
        {me.role === 'admin' && pending > 0 ? (
          <Button label={f(d.home.adminShortcutSub, { n: pending })} icon="shield" size="sm" variant="onDark" onPress={() => router.push('/admin/approbations')} />
        ) : null}
      </GlobeCard>

      {/* Accounts created before birth date and phone became mandatory */}
      {contactError(me.role, me.birthDate, me.phone) && (
        <Row gap={14} wrap style={{ padding: 16, borderRadius: radius.card, backgroundColor: colors.warningSoft, borderWidth: 1, borderColor: colors.warning }}>
          <Feather name="alert-circle" size={20} color={colors.warning} />
          <View style={{ flex: 1, minWidth: 200, gap: 2 }}>
            <Txt variant="bodyStrong">{d.home.completeTitle}</Txt>
            <Txt variant="small" color="textMuted">{d.home.completeSub}</Txt>
          </View>
          <Button label={d.home.completeCta} size="sm" icon="edit-2" onPress={() => router.push('/profil/modifier')} />
        </Row>
      )}


      {/* Quick actions */}
      <View>
        <Txt variant="caption" style={{ marginBottom: 12 }}>{d.home.quickActions}</Txt>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
          {actions.map((a) => (
            <Tap
              key={a.label}
              onPress={() => router.push(a.href as never)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 10, height: 42, paddingHorizontal: 14, borderRadius: radius.input, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }}
              hoverStyle={{ borderColor: colors.borderStrong, backgroundColor: colors.surfaceAlt }}>
              <Feather name={a.icon} size={16} color={colors.secondary} />
              <Txt variant="smallStrong">{a.label}</Txt>
              {!!a.badge && <CountBadge n={a.badge} style={{ borderColor: 'transparent' }} />}
            </Tap>
          ))}
        </ScrollView>
      </View>

      {/* Dashboard cards */}
      <Grid min={260} gap={16}>
        {/* Next event — students get the Repère shortcut instead */}
        {!can(me, 'viewEvents') ? (
          <RepereCard />
        ) : (
        <Card style={{ height: '100%' }}>
          <SectionHeader title={d.home.nextEvent} icon="calendar" />
          {nextEvent ? (
            <Tap onPress={() => router.push(`/evenements/${nextEvent.id}`)} style={{ gap: 12, flex: 1 }}>
              <View style={{ height: 140, borderRadius: 16, overflow: 'hidden' }}>
                <Image source={{ uri: nextEvent.cover }} style={{ width: '100%', height: '100%' }} contentFit="cover" transition={200} />
                <View style={{ position: 'absolute', top: 10, left: 10 }}>
                  <DateBadge iso={nextEvent.date} size="sm" />
                </View>
              </View>
              <Txt variant="h3">{nextEvent.title}</Txt>
              <MetaLine icon="clock" text={formatDate(nextEvent.date, { weekday: true, time: true, year: false })} />
              <MetaLine icon="map-pin" text={nextEvent.location} />
            </Tap>
          ) : (
            <Txt color="textMuted">{d.events.empty}</Txt>
          )}
          <SectionFooter label={d.home.seeEvent} onPress={() => router.push(nextEvent ? `/evenements/${nextEvent.id}` : '/evenements')} />
        </Card>
        )}

        {/* News */}
        <Card style={{ height: '100%' }}>
          <SectionHeader title={d.home.news} icon="book-open" />
          <View style={{ gap: 14, flex: 1 }}>
            {news.map((p) => (
              <Tap key={p.id} onPress={() => router.push(`/publications/${p.id}`)} style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                <Image source={{ uri: p.cover }} style={{ width: 56, height: 56, borderRadius: 12 }} contentFit="cover" />
                <View style={{ flex: 1, gap: 2 }}>
                  <Txt variant="smallStrong" numberOfLines={2}>{p.title}</Txt>
                  <Txt variant="small" color="textSubtle">{formatDate(p.date)}</Txt>
                </View>
              </Tap>
            ))}
          </View>
          <SectionFooter label={d.home.seeAllNews} onPress={() => router.push('/publications')} />
        </Card>

        {/* Birthdays */}
        <Card style={{ height: '100%' }}>
          <SectionHeader title={d.home.birthdays} icon="gift" />
          <View style={{ gap: 12, flex: 1 }}>
            {birthdays.slice(0, 4).map((b) => (
              <Tap key={b.user.id} onPress={() => router.push(`/membre/${b.user.id}`)} style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                <Avatar uri={b.user.avatar} name={fullName(b.user)} size={40} />
                <View style={{ flex: 1 }}>
                  <Txt variant="smallStrong" numberOfLines={1}>{fullName(b.user)}</Txt>
                  <Txt variant="small" color="textSubtle" numberOfLines={1}>
                    {formatDate(b.date, { year: false })}
                    {b.user.promo ? ` · ${f(d.common.promo, { year: b.user.promo })}` : ''}
                  </Txt>
                </View>
                <Badge
                  label={b.inDays === 0 ? d.common.today : b.inDays === 1 ? d.common.tomorrow : f(d.common.inDays, { n: b.inDays })}
                  tone={b.inDays <= 2 ? 'primary' : 'neutral'}
                />
              </Tap>
            ))}
          </View>
          {can(me, 'viewEvents') && <SectionFooter label={d.home.seeAllBirthdays} onPress={() => router.push('/evenements')} />}
        </Card>

        {/* My promo — or the network overview for school leadership */}
        {me.role === 'honneur' ? (
          <LeadershipCard />
        ) : (
        <Card style={{ height: '100%' }} padded={false}>
          <View style={{ padding: 20, paddingBottom: 0 }}>
            <SectionHeader title={d.home.myPromo} icon="award" />
          </View>
          {me.promo ? (
            <Tap onPress={() => router.push(`/annuaire/promo/${me.promo}`)} style={{ flex: 1, paddingHorizontal: 20, gap: 12 }}>
              <View style={{ height: 120, borderRadius: 16, overflow: 'hidden', backgroundColor: colors.surfaceAlt }}>
                {promoInfo?.groupPhoto && <Image source={{ uri: promoInfo.groupPhoto }} style={{ width: '100%', height: '100%' }} contentFit="cover" />}
              </View>
              <View>
                <Txt variant="h2">{f(d.common.promo, { year: me.promo })}</Txt>
                <Txt variant="small" color="textMuted">{f(d.common.members, { n: promoMates.length })}</Txt>
              </View>
              <Row gap={0}>
                {promoMates.filter((u) => u.id !== me.id).slice(0, 5).map((u, i) => (
                  <View key={u.id} style={{ marginLeft: i ? -10 : 0 }}>
                    <Avatar uri={u.avatar} name={fullName(u)} size={32} ring />
                  </View>
                ))}
              </Row>
            </Tap>
          ) : (
            <Txt color="textMuted" style={{ paddingHorizontal: 20, flex: 1 }}>{d.home.noPromo}</Txt>
          )}
          <View style={{ padding: 20, paddingTop: 0 }}>
            <SectionFooter label={d.home.seeMyPromo} onPress={() => router.push(me.promo ? `/annuaire/promo/${me.promo}` : '/profil/modifier')} />
          </View>
        </Card>
        )}
      </Grid>
    </Screen>
  );
}

/** For students: where alumni went to study — the entry point into Repère. */
function RepereCard() {
  const { d, f, country } = useI18n();
  const members = useApprovedMembers();
  const alumni = members.filter((u) => (u.role === 'alumni' || u.role === 'admin') && u.country);
  const top = COUNTRIES.map((c) => ({ c, n: alumni.filter((u) => u.country === c.code).length }))
    .filter((x) => x.n > 0)
    .sort((a, b) => b.n - a.n)
    .slice(0, 4);
  return (
    <Card style={{ height: '100%' }}>
      <SectionHeader title={d.repere.topDestinations} icon="globe" />
      <View style={{ flex: 1, gap: 12 }}>
        {top.map(({ c, n }) => (
          <Tap key={c.code} onPress={() => router.push(`/repere?country=${c.code}`)} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Flag code={c.code} size={18} />
            <Txt variant="smallStrong" style={{ flex: 1 }}>{country(c.code)}</Txt>
            <Txt variant="small" color="textMuted">{f(d.common.alumniCount, { n })}</Txt>
          </Tap>
        ))}
      </View>
      <SectionFooter label={d.home.exploreRepere} onPress={() => router.push('/repere')} />
    </Card>
  );
}

function LeadershipCard() {
  const { d, f } = useI18n();
  const { colors } = useTheme();
  const members = useApprovedMembers();
  const countries = new Set(members.map((u) => u.country).filter(Boolean)).size;
  const alumni = members.filter((u) => u.role === 'alumni' || u.role === 'admin');
  return (
    <Card style={{ height: '100%' }}>
      <SectionHeader title={d.nav.stats} icon="bar-chart-2" />
      <View style={{ flex: 1, gap: 12 }}>
        <Txt style={{ fontFamily: fonts.serif, fontSize: 48, lineHeight: 50, color: colors.text }}>{alumni.length}</Txt>
        <Txt variant="small" color="textMuted">{f(d.stats.cardSub, { n: members.length, c: countries })}</Txt>
        <Txt variant="small" color="textSubtle">{d.stats.subtitle}</Txt>
      </View>
      <SectionFooter label={d.nav.stats} onPress={() => router.push('/statistiques')} />
    </Card>
  );
}

function SectionFooter({ label, onPress }: { label: string; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Tap onPress={onPress} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 16, paddingTop: 14, borderTopWidth: 1, borderTopColor: colors.border }}>
      <Txt variant="smallStrong" color="primary">{label}</Txt>
      <Feather name="arrow-right" size={14} color={colors.primary} />
    </Tap>
  );
}
