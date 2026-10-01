import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Linking, View } from 'react-native';

import { countryName } from '@/data/countries';
import { fullName, useMe, useStore } from '@/data/store';
import type { Cv, CvEntry, User } from '@/data/types';
import { LANGUAGES, useI18n } from '@/i18n';
import { exportCvPdf, period, sortEntries, type CvDoc } from '@/lib/cvPdf';
import { useTheme } from '@/theme/ThemeProvider';
import { useDialogs } from '../ui/Dialogs';
import { Button, Card, Row } from '../ui/primitives';
import { Txt } from '../ui/Txt';

export const LFK_NAME = 'Lycée Français du Koweït';

export function cvIsEmpty(cv?: Cv) {
  if (!cv) return true;
  return !cv.headline && !cv.linkedin && !cv.website && !cv.file && !(['education', 'experience', 'projects', 'associations', 'skills', 'languages', 'interests'] as const).some((k) => cv[k]?.length);
}

/** The LFK line at the bottom of Education: baccalauréat (promo year), or in progress for students. */
export function useLfkEntry(user: User): CvEntry | undefined {
  const { d } = useI18n();
  if (!user.promo || user.role === 'honneur') return undefined;
  return { id: 'lfk', title: user.role === 'eleve' ? d.cv.lfkStudent : d.cv.lfkBac, org: LFK_NAME, place: 'Koweït', end: `${user.promo}-06` };
}

/** What the PDF needs, translated. Contact details follow the member's privacy choices. */
export function useCvDoc(user: User): CvDoc {
  const { d, f, lang } = useI18n();
  const me = useMe();
  const isMe = me.id === user.id;
  const cv = user.cv ?? {};
  const locale = LANGUAGES.find((l) => l.code === lang)?.locale ?? 'fr-FR';
  return {
    name: fullName(user),
    headline: cv.headline,
    avatar: user.avatar,
    contact: [
      [user.city, countryName(user.country, lang)].filter(Boolean).join(', '),
      user.promo ? f(d.common.promo, { year: user.promo }) : '',
      isMe || user.privacy.showEmail ? user.email : '',
      user.phone && (isMe || user.privacy.showPhone) ? user.phone : '',
    ].filter(Boolean),
    links: [cv.linkedin, cv.website].filter((x): x is string => !!x),
    cv,
    lfk: useLfkEntry(user),
    locale,
    labels: {
      experience: d.cv.experience, education: d.cv.education, projects: d.cv.projects, associations: d.cv.associations,
      skills: d.cv.skills, languages: d.cv.languages, interests: d.cv.interests, present: d.cv.present, levels: d.cv.levels, footer: d.cv.footer,
    },
  };
}

/** LinkedIn-style CV on a member page or one's own profile, with the PDF buttons. */
export function CvView({ user }: { user: User }) {
  const { d } = useI18n();
  const { colors } = useTheme();
  const { actions } = useStore();
  const { toast } = useDialogs();
  const me = useMe();
  const isMe = me.id === user.id;
  const doc = useCvDoc(user);
  const cv = user.cv ?? {};
  const empty = cvIsEmpty(user.cv);

  if (empty && !isMe) return null;
  if (empty) {
    return (
      <Card style={{ gap: 12 }}>
        <Row gap={12}>
          <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
            <Feather name="file-text" size={20} color={colors.primary} />
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Txt variant="h3">{d.cv.title}</Txt>
            <Txt variant="small" color="textMuted">{d.cv.emptyMine}</Txt>
          </View>
        </Row>
        <Row gap={8} wrap>
          <Button label={d.cv.create} icon="plus" onPress={() => router.push('/profil/cv')} />
        </Row>
      </Card>
    );
  }

  const openFile = async () => {
    if (!cv.file) return;
    const url = await actions.cvFileUrl(cv.file.path);
    if (url) Linking.openURL(url);
  };
  const pdf = async () => {
    if (!(await exportCvPdf(doc))) toast(d.cv.pdfPopup, 'danger');
  };
  const education = [...sortEntries(cv.education), ...(doc.lfk ? [doc.lfk] : [])];

  return (
    <Card style={{ gap: 18 }}>
      <Row wrap style={{ justifyContent: 'space-between', gap: 10 }}>
        <View style={{ gap: 2, flexShrink: 1 }}>
          <Txt variant="h3">{d.cv.title}</Txt>
          {!!cv.headline && <Txt color="textMuted">{cv.headline}</Txt>}
        </View>
        <Row gap={8} wrap>
          <Button label={d.cv.pdf} icon="download" size="sm" onPress={pdf} />
          {cv.file && <Button label={d.cv.openFile} icon="paperclip" size="sm" variant="secondary" onPress={openFile} />}
          {isMe && <Button label={d.cv.edit} icon="edit-2" size="sm" variant="secondary" onPress={() => router.push('/profil/cv')} />}
        </Row>
      </Row>

      <Timeline title={d.cv.experience} icon="briefcase" entries={sortEntries(cv.experience)} />
      <Timeline title={d.cv.education} icon="book" entries={education} />
      <Timeline title={d.cv.projects} icon="layers" entries={sortEntries(cv.projects)} />
      <Timeline title={d.cv.associations} icon="heart" entries={sortEntries(cv.associations)} />

      {!!cv.languages?.length && (
        <Block title={d.cv.languages} icon="globe">
          {cv.languages.map((l) => (
            <Row key={l.name} gap={10}>
              <Txt variant="smallStrong" style={{ flex: 1 }}>{l.name}</Txt>
              <Txt variant="small" color="textSubtle">{d.cv.levels[l.level - 1]}</Txt>
              <Row gap={3}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <View key={n} style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: n <= l.level ? colors.secondary : colors.border }} />
                ))}
              </Row>
            </Row>
          ))}
        </Block>
      )}
      {!!cv.skills?.length && (
        <Block title={d.cv.skills} icon="zap">
          <Tags items={cv.skills} />
        </Block>
      )}
      {!!cv.interests?.length && (
        <Block title={d.cv.interests} icon="smile">
          <Tags items={cv.interests} />
        </Block>
      )}
      {(cv.linkedin || cv.website) && (
        <Row gap={8} wrap>
          {cv.linkedin && <Button label="LinkedIn" icon="linkedin" size="sm" variant="secondary" onPress={() => Linking.openURL(cv.linkedin!)} />}
          {cv.website && <Button label={d.cv.website} icon="link" size="sm" variant="secondary" onPress={() => Linking.openURL(cv.website!)} />}
        </Row>
      )}
    </Card>
  );
}

function Block({ title, icon, children }: { title: string; icon: React.ComponentProps<typeof Feather>['name']; children: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={{ gap: 10 }}>
      <Row gap={8}>
        <Feather name={icon} size={15} color={colors.primary} />
        <Txt variant="caption">{title}</Txt>
      </Row>
      {children}
    </View>
  );
}

function Tags({ items }: { items: string[] }) {
  const { colors } = useTheme();
  return (
    <Row gap={6} wrap>
      {items.map((s) => (
        <View key={s} style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: colors.surfaceAlt, borderWidth: 1, borderColor: colors.border }}>
          <Txt variant="small">{s}</Txt>
        </View>
      ))}
    </Row>
  );
}

function Timeline({ title, icon, entries }: { title: string; icon: React.ComponentProps<typeof Feather>['name']; entries: CvEntry[] }) {
  const { d, lang } = useI18n();
  const { colors } = useTheme();
  const locale = LANGUAGES.find((l) => l.code === lang)?.locale ?? 'fr-FR';
  if (!entries.length) return null;
  return (
    <Block title={title} icon={icon}>
      {entries.map((e, i) => (
        <Row key={e.id} gap={12} style={{ alignItems: 'stretch' }}>
          <View style={{ width: 12, alignItems: 'center' }}>
            <View style={{ width: 10, height: 10, borderRadius: 5, marginTop: 5, backgroundColor: e.end ? colors.secondary : colors.primary }} />
            {i < entries.length - 1 && <View style={{ flex: 1, width: 2, backgroundColor: colors.border, marginTop: 4 }} />}
          </View>
          <View style={{ flex: 1, gap: 2, paddingBottom: i < entries.length - 1 ? 12 : 0 }}>
            <Txt variant="bodyStrong">{e.title}</Txt>
            {(e.org || e.place) && <Txt variant="small" color="secondary">{[e.org, e.place].filter(Boolean).join(' · ')}</Txt>}
            {(e.start || e.end) && <Txt variant="small" color="textSubtle">{period(e, locale, d.cv.present)}</Txt>}
            {!!e.description && <Txt variant="small" color="textMuted" style={{ marginTop: 4 }}>{e.description}</Txt>}
            {!!e.url && (
              <Txt variant="small" color="primary" onPress={() => Linking.openURL(e.url!)} numberOfLines={1}>{e.url}</Txt>
            )}
          </View>
        </Row>
      ))}
    </Block>
  );
}
