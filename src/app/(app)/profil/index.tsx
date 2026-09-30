import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { View } from 'react-native';

import { RoleBadge } from '@/components/cards';
import { Flag } from '@/components/ui/Flag';
import { Avatar, Button, Card, ListRow, Row, type IconName } from '@/components/ui/primitives';
import { Columns, Screen } from '@/components/ui/Screen';
import { Txt } from '@/components/ui/Txt';
import { countryByCode, countryName } from '@/data/countries';
import { fullName, useInbox, useMe, useStore } from '@/data/store';
import { useI18n } from '@/i18n';
import { useLayout } from '@/theme/layout';
import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';

export default function MyProfile() {
  const { d, f, lang, formatDate } = useI18n();
  const { colors } = useTheme();
  const { isMobile, isDesktop } = useLayout();
  const { db, actions } = useStore();
  const { threads } = useInbox();
  const me = useMe();
  const country = countryByCode(me.country);
  const photos = db.photos.filter((p) => p.uploadedBy === me.id).length;

  const menu: [IconName, string, string][] = [
    ['globe', d.nav.repere, '/repere'],
    ['book-open', d.nav.publications, '/publications'],
    ['bell', d.nav.notifications, '/notifications'],
    ['settings', d.nav.settings, '/parametres'],
    ...(me.role === 'admin' ? ([['shield', d.nav.admin, '/admin']] as [IconName, string, string][]) : []),
    ['file-text', d.nav.legal, '/mentions-legales'],
    ['map', d.nav.sitemap, '/plan-du-site'],
    ['mail', d.nav.contact, '/contact'],
  ];

  return (
    <Screen>
      <Card padded={false}>
        <View style={{ height: isMobile ? 110 : 160, backgroundColor: colors.ink, overflow: 'hidden' }}>
          <View style={{ position: 'absolute', right: -40, top: -60, width: 260, height: 260, borderRadius: 130, backgroundColor: colors.primary, opacity: 0.55 }} />
          <View style={{ position: 'absolute', right: 140, top: 40, width: 140, height: 140, borderRadius: 70, backgroundColor: colors.silver, opacity: 0.25 }} />
        </View>
        <View style={{ paddingHorizontal: isMobile ? 20 : 32, paddingBottom: 28, marginTop: isMobile ? -56 : -72, gap: 16 }}>
          <View style={{ flexDirection: isDesktop ? 'row' : 'column', alignItems: isDesktop ? 'flex-end' : 'flex-start', justifyContent: 'space-between', gap: 16 }}>
            <View style={{ flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'flex-end', gap: 16 }}>
              <Avatar uri={me.avatar} name={fullName(me)} size={isMobile ? 112 : 144} ring />
              <View style={{ gap: 6, paddingBottom: 8 }}>
                <Txt variant={isMobile ? 'h1' : 'display'}>{fullName(me)}</Txt>
                <Row gap={8} wrap>
                  <RoleBadge role={me.role} />
                  <Txt color="textMuted">{[d.roles[me.role], me.promo && f(d.common.promo, { year: me.promo })].filter(Boolean).join(' · ')}</Txt>
                </Row>
              </View>
            </View>
            <Row gap={10} wrap>
              <Button label={d.profile.edit} icon="edit-2" onPress={() => router.push('/profil/modifier')} />
              <Button label={d.nav.settings} icon="settings" variant="secondary" onPress={() => router.push('/parametres')} />
            </Row>
          </View>
          {me.bio && <Txt color="textMuted" style={{ maxWidth: 640 }}>{me.bio}</Txt>}
        </View>
      </Card>

      <Columns
        main={
          <Card>
            <Txt variant="h3" style={{ marginBottom: 4 }}>{d.profile.info}</Txt>
            <ListRow icon="book" title={me.school ?? '—'} subtitle={d.member.school} />
            <ListRow icon="map-pin" title={me.city ?? '—'} subtitle={d.auth.city} />
            <ListRow icon="flag" title={country ? countryName(me.country, lang) : '—'} subtitle={d.auth.country} right={country && <Flag code={country.code} size={18} />} />
            <ListRow icon="award" title={me.promo ? String(me.promo) : '—'} subtitle={d.profile.promoLabel} />
            <ListRow icon="mail" title={me.email} subtitle={d.auth.email} />
            <ListRow icon="phone" title={me.phone ?? '—'} subtitle={d.profile.phone} />
            <ListRow icon="gift" title={me.birthDate ? formatDate(me.birthDate + 'T12:00:00') : '—'} subtitle={d.profile.birthDate} />
            <ListRow
              icon="user"
              title={d.gender[me.gender]}
              subtitle={d.auth.gender}
              last
              right={
                <Row gap={4} style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill, backgroundColor: colors.surfaceAlt }}>
                  <Feather name="lock" size={11} color={colors.textSubtle} />
                  <Txt variant="small" color="textSubtle">{d.profile.genderLocked}</Txt>
                </Row>
              }
            />
          </Card>
        }
        aside={
          <>
            <Card>
              <Txt variant="h3" style={{ marginBottom: 14 }}>{d.profile.stats}</Txt>
              <Row gap={12}>
                {[
                  [threads.length, d.profile.conversations],
                  [photos, d.profile.photosShared],
                ].map(([n, label]) => (
                  <View key={String(label)} style={{ flex: 1, padding: 14, borderRadius: 16, backgroundColor: colors.surfaceAlt, gap: 2 }}>
                    <Txt variant="h1">{n}</Txt>
                    <Txt variant="small" color="textMuted">{label}</Txt>
                  </View>
                ))}
              </Row>
            </Card>
            <Card>
              {menu.map(([icon, label, href], i) => (
                <ListRow key={href} icon={icon} title={label} onPress={() => router.push(href as never)} tone={href === '/admin' ? 'ink' : 'primary'} last={i === menu.length - 1} />
              ))}
            </Card>
            <Button label={d.common.signOut} icon="log-out" variant="danger" full onPress={actions.signOut} />
          </>
        }
      />
    </Screen>
  );
}
