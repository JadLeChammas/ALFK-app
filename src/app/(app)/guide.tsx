import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState, type ReactNode } from 'react';
import { View } from 'react-native';

import { GuideSteps, useGuideTitle } from '@/components/guide/GuideSteps';
import { Flag } from '@/components/ui/Flag';
import { Badge, Button, Card, Chip, EmptyState, Row, Tap } from '@/components/ui/primitives';
import { BackLink, Grid, PageHeader, Screen } from '@/components/ui/Screen';
import { Txt } from '@/components/ui/Txt';
import { useGuides, type CountryGuide } from '@/data/guide';
import { useApprovedMembers, useMe } from '@/data/store';
import { useI18n } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';

const doneKey = (userId: string) => `lfk.guide.done.${userId}`;

/** Country guides: what to do before leaving and after arriving. Admins edit them in the dashboard. */
export default function Guides() {
  const { d, f, country } = useI18n();
  const { colors } = useTheme();
  const me = useMe();
  const admin = me.role === 'admin';
  const params = useLocalSearchParams<{ pays?: string }>();
  const { guides } = useGuides();
  const titleOf = useGuideTitle();
  const visible = guides.filter((g) => g.published || admin);
  const picked = params.pays?.toUpperCase();
  const guide = picked ? visible.find((g) => g.country === picked) : undefined;
  const open = (cc: string) => router.setParams({ pays: cc });
  // Each member's own progress, kept on the device.
  const [done, setDone] = useState<string[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(doneKey(me.id))
      .then((raw) => raw && setDone(JSON.parse(raw)))
      .catch(() => {});
  }, [me.id]);
  const toggle = (id: string) => {
    const next = done.includes(id) ? done.filter((x) => x !== id) : [...done, id];
    setDone(next);
    AsyncStorage.setItem(doneKey(me.id), JSON.stringify(next)).catch(() => {});
  };

  const manage = admin && <Button label={d.guide.manage} icon="edit-2" variant="secondary" onPress={() => router.push(`/admin/guides${guide ? `?pays=${guide.country}` : ''}` as never)} />;

  // First: where are you going?
  if (!guide) return <CountryPicker visible={visible} onOpen={open} manage={manage} />;

  const total = guide.steps.length;
  const doneCount = guide.steps.filter((s) => done.includes(s.id)).length;

  return (
    <Screen maxWidth={900}>
      <BackLink label={d.guide.allCountries} href="/guide" />
      <PageHeader title={titleOf(guide)} subtitle={guide.intro?.trim() || d.guide.subtitle} right={manage} />

      {visible.length > 1 && (
        <View style={{ gap: 8 }}>
          <Txt variant="caption">{d.guide.chooseCountry}</Txt>
          <Row gap={8} wrap>
            {visible.map((g) => (
              <Chip key={g.id} label={country(g.country)} leading={<Flag code={g.country} />} active={g.id === guide.id} onPress={() => open(g.country)} />
            ))}
          </Row>
        </View>
      )}
      {!guide.published && <Badge label={d.guide.draftNote} tone="warning" icon="eye-off" />}

      <Card style={{ gap: 10 }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <Txt variant="bodyStrong">{d.guide.progress}</Txt>
          <Txt variant="smallStrong" color="primary">{f(d.guide.progressCount, { n: doneCount, total })}</Txt>
        </Row>
        <View style={{ height: 8, borderRadius: 4, backgroundColor: colors.surfaceAlt, overflow: 'hidden' }}>
          <View style={{ width: `${total ? (doneCount / total) * 100 : 0}%`, height: '100%', backgroundColor: colors.success }} />
        </View>
        <Txt variant="small" color="textSubtle">{d.guide.disclaimer}</Txt>
      </Card>

      {total === 0 ? (
        <Card>
          <EmptyState icon="map" title={d.guide.empty} />
        </Card>
      ) : (
        <GuideSteps steps={guide.steps} done={done} onToggle={toggle} />
      )}

      <Card style={{ gap: 10 }}>
        <Txt variant="h3">{d.guide.helpTitle}</Txt>
        <Txt color="textMuted">{d.guide.helpSub}</Txt>
        <Row gap={8} wrap>
          <Button label={d.nav.questions} icon="help-circle" onPress={() => router.push('/questions')} />
          <Button label={d.nav.repere} icon="globe" variant="secondary" onPress={() => router.push(`/repere?country=${guide.country}`)} />
        </Row>
      </Card>
    </Screen>
  );
}

function CountryPicker({ visible, onOpen, manage }: { visible: CountryGuide[]; onOpen: (cc: string) => void; manage: ReactNode }) {
  const { d, f, country } = useI18n();
  const { colors } = useTheme();
  const me = useMe();
  const members = useApprovedMembers();
  const titleOf = useGuideTitle();
  const alumniIn = (cc: string) => members.filter((u) => u.country === cc && u.role !== 'eleve').length;
  // Where alumni live but no guide exists yet: « coming soon ».
  const soon = [...new Set(members.map((u) => u.country).filter((c): c is string => !!c && c !== 'KW'))]
    .filter((cc) => !visible.some((g) => g.country === cc))
    .map((cc) => ({ cc, n: alumniIn(cc) }))
    .filter((x) => x.n > 0)
    .sort((a, b) => b.n - a.n)
    .slice(0, 6);

  return (
    <Screen maxWidth={960}>
      <PageHeader title={d.guide.pickTitle} subtitle={d.guide.pickSubtitle} right={manage} />
      {visible.length === 0 ? (
        <Card>
          <EmptyState icon="map" title={d.guide.none} />
        </Card>
      ) : (
        <Grid min={240} gap={14}>
          {visible.map((g) => (
            <Tap
              key={g.id}
              onPress={() => onOpen(g.country)}
              style={{ padding: 20, gap: 12, borderRadius: 22, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, height: '100%' }}
              hoverStyle={{ borderColor: colors.primary }}>
              <Row style={{ justifyContent: 'space-between' }}>
                <Flag code={g.country} size={34} />
                {!g.published && <Badge label={d.guide.draft} tone="warning" icon="eye-off" />}
              </Row>
              <View style={{ gap: 4, flex: 1 }}>
                <Txt variant="h3">{titleOf(g)}</Txt>
                <Txt variant="small" color="textMuted">{country(g.country)}</Txt>
              </View>
              <Row gap={8} wrap>
                <Badge label={f(d.guide.stepsCount, { n: g.steps.length })} tone="secondary" icon="check-square" />
                {alumniIn(g.country) > 0 && <Badge label={f(d.guide.alumniThere, { n: alumniIn(g.country) })} tone="neutral" icon="users" />}
              </Row>
              <Txt variant="smallStrong" color="primary">{`${d.guide.openGuide} →`}</Txt>
            </Tap>
          ))}
        </Grid>
      )}

      {soon.length > 0 && (
        <View style={{ gap: 12 }}>
          <View style={{ gap: 2 }}>
            <Txt variant="h3">{d.guide.soonTitle}</Txt>
            <Txt variant="small" color="textMuted">{d.guide.soonHint}</Txt>
          </View>
          <Grid min={200} gap={10}>
            {soon.map(({ cc, n }) => (
              <View key={cc} style={{ padding: 14, gap: 8, borderRadius: 18, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.borderStrong, opacity: 0.85 }}>
                <Row gap={10}>
                  <Flag code={cc} size={22} />
                  <Txt variant="bodyStrong" style={{ flex: 1 }} numberOfLines={1}>{country(cc)}</Txt>
                  <Badge label={d.guide.soon} tone="neutral" />
                </Row>
                <Txt variant="small" color="textSubtle">{f(d.guide.alumniThere, { n })}</Txt>
                {me.role === 'admin' && (
                  <Tap onPress={() => router.push(`/admin/guides?nouveau=${cc}` as never)}>
                    <Txt variant="smallStrong" color="primary">{`+ ${d.guide.createThis}`}</Txt>
                  </Tap>
                )}
              </View>
            ))}
          </Grid>
        </View>
      )}
    </Screen>
  );
}
