import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { View } from 'react-native';

import { countryByCode, countryName } from '@/data/countries';
import { occupation } from '@/data/members';
import { canMessage } from '@/data/permissions';
import { fullName, useStore } from '@/data/store';
import type { EventCategory, LfkEvent, Publication, PublicationCategory, Role, User } from '@/data/types';
import { useI18n } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts, radius } from '@/theme/tokens';
import { birthdayToday } from '@/lib/eggs';
import { SparkleName } from './EasterEggs';
import { Avatar, Badge, Button, Card, MetaLine, Tap, type Tone } from './ui/primitives';
import { Flag } from './ui/Flag';
import { Txt } from './ui/Txt';

export const ROLE_TONE: Record<Role, Tone> = { alumni: 'secondary', eleve: 'violet', honneur: 'ink', admin: 'primary' };
export const CATEGORY_TONE: Record<EventCategory, Tone> = { soiree: 'primary', sport: 'secondary', culture: 'ink', networking: 'violet' };
export const PUB_TONE: Record<PublicationCategory, Tone> = { actualite: 'primary', article: 'ink', annonce: 'secondary' };

export function RoleBadge({ role }: { role: Role }) {
  const { d } = useI18n();
  return <Badge label={d.roles[role]} tone={ROLE_TONE[role]} icon={role === 'admin' ? 'shield' : role === 'honneur' ? 'award' : undefined} />;
}

export function roleLine(u: User, d: ReturnType<typeof useI18n>['d'], f: ReturnType<typeof useI18n>['f']) {
  return [d.roles[u.role], u.promo ? f(d.common.promo, { year: u.promo }) : null].filter(Boolean).join(' · ');
}

export function useStartConversation() {
  const { actions } = useStore();
  return (userId: string) => {
    const id = actions.conversationWith(userId);
    if (id) router.push(`/messages/${id}`);
  };
}

export function MemberCard({ user, showPromo }: { user: User; showPromo?: boolean }) {
  const { colors } = useTheme();
  const { d, f, lang } = useI18n();
  const { me } = useStore();
  const start = useStartConversation();
  const c = countryByCode(user.country);
  const isMe = me?.id === user.id;
  return (
    <Card onPress={() => router.push(`/membre/${user.id}`)} padded={false} style={{ padding: 18, alignItems: 'center', gap: 10, height: '100%' }}>
      <Avatar uri={user.avatar} name={fullName(user)} size={68} />
      <View style={{ alignItems: 'center', gap: 2, width: '100%' }}>
        {birthdayToday(user, me) ? <SparkleName name={fullName(user)} /> : <Txt variant="h3" numberOfLines={1} align="center">{fullName(user)}</Txt>}
        <Txt variant="small" color="textMuted" numberOfLines={1} align="center">{occupation(user) ?? '—'}</Txt>
        {showPromo && user.promo && <Txt variant="small" color="textSubtle">{f(d.common.promo, { year: user.promo })}</Txt>}
      </View>
      {c && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
          <Flag code={c.code} size={11} />
          <Txt variant="small" color="textSubtle" numberOfLines={1}>{[user.city, countryName(user.country, lang)].filter(Boolean).join(', ')}</Txt>
        </View>
      )}
      <View style={{ flex: 1 }} />
      {isMe ? (
        <Badge label={d.common.you} tone="primary" style={{ alignSelf: 'center' }} />
      ) : !canMessage(me, user) ? (
        <View style={{ height: 32 }} />
      ) : (
        <Tap
          onPress={() => start(user.id)}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, height: 32, borderRadius: radius.input, backgroundColor: colors.primarySoft }}
          hoverStyle={{ opacity: 0.85 }}>
          <Feather name="message-circle" size={13} color={colors.primary} />
          <Txt variant="smallStrong" color="primary">{d.common.message}</Txt>
        </Tap>
      )}
    </Card>
  );
}

export function DateBadge({ iso, size = 'md' }: { iso: string; size?: 'sm' | 'md' }) {
  const { colors } = useTheme();
  const { d } = useI18n();
  const date = new Date(iso);
  const s = size === 'sm';
  return (
    <View style={{ width: s ? 48 : 58, paddingVertical: s ? 6 : 8, borderRadius: 14, backgroundColor: colors.surface, alignItems: 'center', borderWidth: 1, borderColor: colors.border }}>
      <Txt style={{ fontFamily: fonts.display, fontSize: s ? 22 : 28, lineHeight: s ? 22 : 28, color: colors.text }}>{String(date.getDate()).padStart(2, '0')}</Txt>
      <Txt style={{ fontFamily: fonts.bold, fontSize: 10, letterSpacing: 1, color: colors.primary }}>{d.monthsShort[date.getMonth()]}</Txt>
    </View>
  );
}

export function EventCard({ event, layout = 'vertical' }: { event: LfkEvent; layout?: 'vertical' | 'horizontal' }) {
  const { d, f, formatDate, formatTime } = useI18n();
  const { colors } = useTheme();
  const { db } = useStore();
  const photos = db.photos.filter((p) => p.eventId === event.id).length;
  const open = () => router.push(`/evenements/${event.id}`);
  if (layout === 'horizontal') {
    return (
      <Card onPress={open} padded={false} style={{ flexDirection: 'row', padding: 12, gap: 14, alignItems: 'center' }}>
        <View style={{ width: 110, height: 96, borderRadius: 14, overflow: 'hidden' }}>
          <Image source={{ uri: event.cover }} style={{ width: '100%', height: '100%' }} contentFit="cover" transition={200} />
          <View style={{ position: 'absolute', top: 8, left: 8 }}>
            <DateBadge iso={event.date} size="sm" />
          </View>
        </View>
        <View style={{ flex: 1, gap: 6 }}>
          <Badge label={d.events.categories[event.category]} tone={CATEGORY_TONE[event.category]} />
          <Txt variant="h3" numberOfLines={1}>{event.title}</Txt>
          <MetaLine icon="map-pin" text={event.location} />
          <MetaLine icon="clock" text={`${formatDate(event.date, { year: false })} · ${formatTime(event.date)}`} />
        </View>
        <Feather name="chevron-right" size={18} color={colors.textSubtle} />
      </Card>
    );
  }
  return (
    <Card onPress={open} padded={false} style={{ height: '100%' }}>
      <View style={{ height: 180 }}>
        <Image source={{ uri: event.cover }} style={{ width: '100%', height: '100%' }} contentFit="cover" transition={200} />
        <View style={{ position: 'absolute', top: 14, left: 14 }}>
          <DateBadge iso={event.date} />
        </View>
        <View style={{ position: 'absolute', top: 14, right: 14 }}>
          <Badge label={d.events.categories[event.category]} tone={CATEGORY_TONE[event.category]} />
        </View>
      </View>
      <View style={{ padding: 18, gap: 8, flex: 1 }}>
        <Txt variant="h3" numberOfLines={1}>{event.title}</Txt>
        <MetaLine icon="map-pin" text={event.location} />
        <MetaLine icon="clock" text={formatDate(event.date, { weekday: true, time: true })} />
        <Txt variant="small" color="textMuted" numberOfLines={2}>{event.description}</Txt>
        <View style={{ flex: 1 }} />
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
          {photos > 0 ? <MetaLine icon="image" text={f(d.events.photos, { n: photos })} color="textSubtle" /> : <View />}
          <Button label={d.common.see} size="sm" variant="secondary" iconRight="arrow-right" onPress={open} />
        </View>
      </View>
    </Card>
  );
}

export function PublicationCard({ pub, featured }: { pub: Publication; featured?: boolean }) {
  const { d, formatDate } = useI18n();
  const open = () => router.push(`/publications/${pub.id}`);
  return (
    <Card onPress={open} padded={false} style={{ height: '100%' }}>
      <View style={{ height: featured ? 260 : 170 }}>
        <Image source={{ uri: pub.cover }} style={{ width: '100%', height: '100%' }} contentFit="cover" transition={200} />
      </View>
      <View style={{ padding: 18, gap: 8, flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Badge label={d.publications.categories[pub.category]} tone={PUB_TONE[pub.category]} />
          {pub.status !== 'published' && <Badge label={pub.status === 'pending' ? d.pubReview.pending : d.pubReview.rejected} tone={pub.status === 'pending' ? 'warning' : 'danger'} />}
          {pub.visibility === 'public' && <Badge label={d.publications.publicBadge} icon="globe" tone="info" />}
          <Txt variant="small" color="textSubtle">{formatDate(pub.date)}</Txt>
        </View>
        <Txt variant={featured ? 'h2' : 'h3'} numberOfLines={2}>{pub.title}</Txt>
        <Txt variant="small" color="textMuted" numberOfLines={featured ? 3 : 2}>{pub.excerpt}</Txt>
      </View>
    </Card>
  );
}
