import { useMemo, useState } from 'react';
import { View } from 'react-native';

import { AdminNav } from '@/components/AdminNav';
import { useDialogs } from '@/components/ui/Dialogs';
import { Button, Card, Chip, Input, Row, SectionHeader } from '@/components/ui/primitives';
import { PageHeader, Screen } from '@/components/ui/Screen';
import { Txt } from '@/components/ui/Txt';
import { useStore } from '@/data/store';
import { useI18n } from '@/i18n';
import { activeWords, builtInWords, fold, makeCensor, parseBannedWords, type BannedWords } from '@/lib/censor';
import { useTheme } from '@/theme/ThemeProvider';

const SHOWN = 120;

/**
 * Admins: the banned words, masked « ***** » wherever members write publicly (not private messages).
 * A built-in list (LDNOOBW, 10 languages), plus the admins' own words, minus the ones they take off.
 * Saved at once in the setting « bannedWords »; old texts follow, since the masking is done on display.
 */
export default function BannedWordsAdmin() {
  const { d, f } = useI18n();
  const b = d.banned;
  const { colors } = useTheme();
  const { db, actions } = useStore();
  const { toast } = useDialogs();
  const settings = parseBannedWords(db.settings.bannedWords);
  const builtIn = useMemo(() => builtInWords().sort((x, y) => x.localeCompare(y)), []);
  const removed = new Set(settings.removed.map(fold));
  const censor = useMemo(() => makeCensor(parseBannedWords(db.settings.bannedWords)), [db.settings.bannedWords]);
  const [word, setWord] = useState('');
  const [sample, setSample] = useState('');
  const [q, setQ] = useState('');

  const save = (next: BannedWords) => actions.setBannedWords(JSON.stringify(next));
  const add = () => {
    const w = word.trim();
    if (!w) return;
    const fw = fold(w);
    // A built-in word taken off earlier: put it back; otherwise one of the admins' words.
    if (removed.has(fw)) save({ ...settings, removed: settings.removed.filter((x) => fold(x) !== fw) });
    else if (!builtIn.includes(fw) && !settings.added.some((x) => fold(x) === fw)) save({ ...settings, added: [...settings.added, w] });
    setWord('');
    toast(f(b.addedToast, { word: w }), 'success');
  };
  const takeOffAdded = (w: string) => save({ ...settings, added: settings.added.filter((x) => x !== w) });
  const takeOffBuiltIn = (w: string) => save({ ...settings, removed: [...settings.removed, w] });
  const restore = (w: string) => save({ ...settings, removed: settings.removed.filter((x) => fold(x) !== fold(w)) });

  const nq = fold(q.trim());
  const matches = builtIn.filter((w) => !removed.has(w) && (!nq || w.includes(nq)));

  return (
    <Screen maxWidth={1000}>
      <PageHeader title={b.title} subtitle={b.subtitle} />
      <AdminNav />

      <Card style={{ gap: 12 }}>
        <SectionHeader title={b.test} icon="eye" />
        <Input value={sample} onChangeText={setSample} placeholder={b.testPlaceholder} multiline />
        {!!sample.trim() && (
          <View style={{ padding: 12, borderRadius: 12, backgroundColor: colors.surfaceAlt }}>
            <Txt variant="small" color="textSubtle">{b.result}</Txt>
            <Txt>{censor(sample)}</Txt>
          </View>
        )}
        <Txt variant="small" color="textSubtle">{f(b.count, { n: activeWords(settings).length })}</Txt>
      </Card>

      <Card style={{ gap: 12 }}>
        <SectionHeader title={b.yours} icon="plus-circle" count={String(settings.added.length)} />
        <Row gap={8} style={{ alignItems: 'flex-end' }}>
          <Input value={word} onChangeText={setWord} placeholder={b.addPlaceholder} containerStyle={{ flex: 1 }} onSubmitEditing={add} maxLength={80} />
          <Button label={b.add} icon="plus" onPress={add} disabled={!word.trim()} />
        </Row>
        <Txt variant="small" color="textSubtle">{b.addHint}</Txt>
        {settings.added.length === 0 ? (
          <Txt variant="small" color="textMuted">{b.yoursEmpty}</Txt>
        ) : (
          <Row gap={8} wrap>
            {settings.added.map((w) => (
              <Chip key={w} label={`${w}  ✕`} active onPress={() => takeOffAdded(w)} />
            ))}
          </Row>
        )}
      </Card>

      <Card style={{ gap: 12 }}>
        <SectionHeader title={b.builtIn} icon="book" count={String(builtIn.length - removed.size)} />
        <Txt variant="small" color="textSubtle">{b.builtInHint}</Txt>
        <Input value={q} onChangeText={setQ} placeholder={b.search} icon="search" />
        <Row gap={6} wrap>
          {matches.slice(0, SHOWN).map((w) => (
            <Chip key={w} label={`${w}  ✕`} onPress={() => takeOffBuiltIn(w)} />
          ))}
        </Row>
        {matches.length > SHOWN && <Txt variant="small" color="textSubtle">{f(b.more, { n: matches.length - SHOWN })}</Txt>}
      </Card>

      <Card style={{ gap: 12 }}>
        <SectionHeader title={b.removed} icon="rotate-ccw" count={String(settings.removed.length)} />
        <Txt variant="small" color="textSubtle">{b.removedHint}</Txt>
        {settings.removed.length === 0 ? (
          <Txt variant="small" color="textMuted">{b.removedEmpty}</Txt>
        ) : (
          <Row gap={8} wrap>
            {settings.removed.map((w) => (
              <Chip key={w} label={`${w}  ↺`} onPress={() => restore(w)} />
            ))}
          </Row>
        )}
      </Card>
    </Screen>
  );
}
