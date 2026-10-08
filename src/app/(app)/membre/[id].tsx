import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

import { RoleBadge, useStartConversation } from '@/components/cards';
import { Flag } from '@/components/ui/Flag';
import { UniLogo } from '@/components/UniLogo';
import { Avatar, Badge, Button, Card, EmptyState, IconTile, ListRow, Row } from '@/components/ui/primitives';
import { BackLink, Columns, Screen } from '@/components/ui/Screen';
import { CvFileCard, CvView } from '@/components/cv/CvView';
import { Txt } from '@/components/ui/Txt';
import { countryByCode, countryName } from '@/data/countries';
import { canMessage } from '@/data/permissions';
import { fullName, useMe, useStore } from '@/data/store';
import { useI18n } from '@/i18n';
import { useLayout } from '@/theme/layout';
import { useTheme } from '@/theme/ThemeProvider';
import { birthdayToday } from '@/lib/eggs';
import { Balloons, LegendBadge } from '@/components/EasterEggs';
import { nationalityName } from '@/data/nationalities';
import { OtherSchoolsRows } from '@/components/OtherSchools';
import { fieldLabel, userFields } from '@/data/fields';

export default function MemberProfile() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { d, f, lang, formatDate } = useI18n();
  const { colors } = useTheme();
  const { isMobile, isDesktop } = useLayout();
  const { db } = useStore();
  const me = useMe();
  const start = useStartConversation();
  const user = db.users.find((u) => u.id === id && u.approved);

  if (!user) {
    return (
      <Screen>
        <BackLink />
        <EmptyState icon="user-x" title={d.member.notFound} />
      </Screen>
    );
  }

  const country = countryByCode(user.country);
  const isMe = user.id === me.id;
  const photos = db.photos.filter((p) => p.uploadedBy === user.id).length;

  return (
    <Screen>
      {/* A profile is reached from many places (Directory, messages, a promo, Orientation…): back to where you were. */}
      <BackLink fallback="/annuaire" />
      {birthdayToday(user, me) && <Balloons />}
      <Card padded={false}>
        <View style={{ height: isMobile ? 90 : 130, backgroundColor: colors.navy, overflow: 'hidden' }}>
          <View style={{ position: 'absolute', right: -40, top: -70, width: 240, height: 240, borderRadius: 120, backgroundColor: colors.primary, opacity: 0.55 }} />
          <View style={{ position: 'absolute', right: 150, top: 30, width: 120, height: 120, borderRadius: 60, backgroundColor: colors.secondary, opacity: 0.35 }} />
        </View>
        <View style={{ paddingHorizontal: isMobile ? 20 : 32, paddingBottom: 24, gap: 16 }}>
          <View style={{ flexDirection: isDesktop ? 'row' : 'column', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
            <View style={{ flexDirection: isMobile ? 'column' : 'row', alignItems: 'flex-start', gap: isMobile ? 12 : 20 }}>
              <View style={{ marginTop: isMobile ? -48 : -60 }}>
                <Avatar uri={user.avatar} name={fullName(user)} size={isMobile ? 96 : 120} ring />
              </View>
              <View style={{ gap: 6, paddingTop: isMobile ? 0 : 16, flexShrink: 1 }}>
                <Txt variant={isMobile ? 'h1' : 'display'}>{fullName(user)}</Txt>
                <Row gap={8} wrap>
                  <RoleBadge role={user.role} />
                  {user.role === 'eleve' && user.grade && <Badge label={d.grade[user.grade]} tone="info" icon="book-open" />}
                  {birthdayToday(user, me) && <Badge label={d.eggs.birthday} tone="warning" icon="gift" />}
                  <LegendBadge user={user} />
                  {user.promo && <Txt color="textMuted">{f(d.common.promo, { year: user.promo })}</Txt>}
                  {user.fonction && <Txt color="textMuted">{user.fonction}</Txt>}
                </Row>
              </View>
            </View>
            <Row gap={10} wrap style={{ paddingTop: isDesktop ? 20 : 0 }}>
              {isMe ? (
                <Button label={d.profile.edit} icon="edit-2" variant="secondary" onPress={() => router.push('/profil/modifier')} />
              ) : canMessage(me, user) ? (
                <Button label={d.member.sendMessage} icon="message-circle" onPress={() => start(user.id)} />
              ) : (
                <Row gap={8} style={{ paddingHorizontal: 14, paddingVertical: 10, borderRadius: 999, backgroundColor: colors.surfaceAlt, flexShrink: 1 }}>
                  <Feather name="lock" size={13} color={colors.textSubtle} />
                  <Txt variant="small" color="textMuted" style={{ flexShrink: 1 }}>{d.member.messagingDisabled}</Txt>
                </Row>
              )}
              {user.promo && <Button label={d.directory.seePromo} variant="secondary" icon="users" onPress={() => router.push(`/annuaire/promo/${user.promo}`)} />}
            </Row>
          </View>
        </View>
      </Card>

      <CvFileCard user={user} />
      <CvView user={user} />

      <Columns
        main={
          <Card>
            <Txt variant="h3" style={{ marginBottom: 4 }}>{d.member.info}</Txt>
            {user.role === 'honneur' && <ListRow icon="award" title={d.roles.honneur} subtitle={d.member.honorary} tone="warning" />}
            {user.fonction && <ListRow icon="briefcase" title={user.fonction} subtitle={d.member.fonction} />}
            {/* Membership numbers are shown to the person themself and to admins only. */}
            {(me.role === 'admin' || isMe) && user.role !== 'honneur' && user.alumniNumber && <ListRow icon="hash" title={user.alumniNumber} subtitle={d.member.alumniNumber} />}
            {(me.role === 'admin' || isMe) && user.role === 'admin' && user.bureauCode && <ListRow icon="shield" title={user.bureauCode} subtitle={d.member.bureauCode} tone="ink" />}
            {user.situation === 'working' && (user.employer || user.jobTitle) && <ListRow icon="briefcase" title={[user.jobTitle, user.employer].filter(Boolean).join(' · ')} subtitle={d.situation.worksAt} />}
            {user.role === 'honneur' && (user.fonction || user.employer) && <ListRow icon="briefcase" title={[user.fonction, user.employer].filter(Boolean).join(' · ')} subtitle={d.honoraryAdmin.organisation} />}
            {(user.role !== 'honneur' || !!user.school) && (
              <ListRow
                icon="book"
                leading={user.school ? <UniLogo name={user.school} fallback={<IconTile icon="book" />} /> : undefined}
                title={user.school ?? '—'}
                subtitle={user.role === 'eleve' && user.grade ? d.grade[user.grade] : user.situation === 'working' ? d.situation.graduatedFrom : user.situation === 'student' ? d.situation.studiesAt : d.member.school}
                right={!!user.school && !!(user.schoolCountry ?? (user.role === 'eleve' ? 'KW' : user.country)) && <Flag code={(user.schoolCountry ?? (user.role === 'eleve' ? 'KW' : user.country))!} size={16} />}
              />
            )}
            {userFields(user).length > 0 && <ListRow icon="compass" title={userFields(user).map((x) => fieldLabel(x, d.fields)).join(', ')} subtitle={d.majors.rowLabel} />}
            {!!user.specialty && <ListRow icon="target" title={user.specialty} subtitle={d.specialty.rowLabel} />}
            {!!user.otherSchools?.length && <OtherSchoolsRows schools={user.otherSchools} />}
{!!user.nationalities?.length && (
              <ListRow
                icon="flag"
                title={user.nationalities.map((c) => nationalityName(c, lang)).join(', ')}
                subtitle={d.nat.label}
                right={<Row gap={4}>{user.nationalities.map((c) => <Flag key={c} code={c} size={14} />)}</Row>}
              />
            )}
            <ListRow icon="map-pin" title={[user.city, countryName(user.country, lang)].filter(Boolean).join(', ')} subtitle={d.member.location} right={country && <Flag code={country.code} size={18} />} />
            {user.promo && <ListRow icon="award" title={String(user.promo)} subtitle={d.profile.promoLabel} />}
            {user.birthDate && user.privacy.showBirthday && <ListRow icon="gift" title={formatDate(user.birthDate + 'T12:00:00', { year: false })} subtitle={d.member.birthday} />}
            {user.privacy.showEmail && <ListRow icon="mail" title={user.email} subtitle={d.member.email} />}
            {user.phone && user.privacy.showPhone && <ListRow icon="phone" title={user.phone} subtitle={d.member.phone} />}
            <ListRow icon="clock" title={f(d.member.since, { date: formatDate(user.createdAt) })} last />
          </Card>
        }
        aside={
          <>
            {user.bio && (
              <Card>
                <Txt variant="h3" style={{ marginBottom: 8 }}>{d.member.about}</Txt>
                <Txt color="textMuted">{user.bio}</Txt>
              </Card>
            )}
            <Card>
              <Row gap={12}>
                <View style={{ flex: 1, gap: 2 }}>
                  <Txt variant="h2">{photos}</Txt>
                  <Txt variant="small" color="textMuted">{d.profile.photosShared}</Txt>
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Txt variant="h2">{user.promo ?? '—'}</Txt>
                  <Txt variant="small" color="textMuted">{d.profile.promoLabel}</Txt>
                </View>
              </Row>
            </Card>
          </>
        }
      />
    </Screen>
  );
}
