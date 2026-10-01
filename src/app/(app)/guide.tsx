import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { GuideSteps, useGuideTitle } from '@/components/guide/GuideSteps';
import { Flag } from '@/components/ui/Flag';
import { Badge, Button, Card, Chip, EmptyState, Row } from '@/components/ui/primitives';
import { PageHeader, Screen } from '@/components/ui/Screen';
import { Txt } from '@/components/ui/Txt';
import { useGuides } from '@/data/guide';
import { useMe } from '@/data/store';
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
  const [picked, setPicked] = useState<string | undefined>(params.pays?.toUpperCase());
  const guide = visible.find((g) => g.country === picked) ?? visible[0];
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

  if (!guide) {
    return (
      <Screen maxWidth={900}>
        <PageHeader title={d.guide.listTitle} subtitle={d.guide.listSubtitle} right={manage} />
        <Card>
          <EmptyState icon="map" title={d.guide.none} />
        </Card>
      </Screen>
    );
  }

  const total = guide.steps.length;
  const doneCount = guide.steps.filter((s) => done.includes(s.id)).length;

  return (
    <Screen maxWidth={900}>
      <PageHeader title={titleOf(guide)} subtitle={guide.intro?.trim() || d.guide.subtitle} right={manage} />

      {visible.length > 1 && (
        <View style={{ gap: 8 }}>
          <Txt variant="caption">{d.guide.chooseCountry}</Txt>
          <Row gap={8} wrap>
            {visible.map((g) => (
              <Chip key={g.id} label={country(g.country)} leading={<Flag code={g.country} />} active={g.id === guide.id} onPress={() => setPicked(g.country)} />
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
