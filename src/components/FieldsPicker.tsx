import { Feather } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { View } from 'react-native';

import { customField, fieldLabel, FIELDS } from '@/data/fields';
import { useI18n } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';
import { Button, Input, Row, Tap } from './ui/primitives';
import { Select } from './ui/Select';
import { Txt } from './ui/Txt';

const MAX = 3;

/**
 * One or more fields of study (majors). « Autre » opens a field to type one's own major
 * (saved as it is typed, e.g. « Égyptologie »).
 */
export function FieldsPicker({ value, onChange, label }: { value: string[]; onChange: (v: string[]) => void; label?: string }) {
  const { d, lang } = useI18n();
  const { colors } = useTheme();
  const [typing, setTyping] = useState(false);
  const [text, setText] = useState('');
  const options = useMemo(() => {
    const loc = lang === 'pirate' ? 'en' : lang === 'lb' ? 'fr' : lang;
    const list = FIELDS.filter((k) => k !== 'autre' && !value.includes(k))
      .map((k) => ({ value: k as string, label: d.fields[k] }))
      .sort((a, b) => a.label.localeCompare(b.label, loc));
    // « Autre » stays last: it opens a field to type one's own major.
    return [...list, { value: 'autre', label: `${d.fields.autre}…` }];
  }, [d, lang, value]);

  const addTyped = () => {
    const t = text.trim();
    if (!t) return;
    const v = customField(t);
    if (!value.some((x) => x.toLowerCase() === v.toLowerCase())) onChange([...value, v]);
    setText('');
    setTyping(false);
  };

  return (
    <View style={{ gap: 8 }}>
      <Txt variant="smallStrong" color="textMuted">{label ?? d.orientation.field}</Txt>
      {value.length > 0 && (
        <Row gap={8} wrap>
          {value.map((f) => (
            <Row key={f} gap={6} style={{ paddingLeft: 12, paddingRight: 4, height: 34, borderRadius: 999, backgroundColor: colors.primarySoft }}>
              <Txt variant="smallStrong">{fieldLabel(f, d.fields)}</Txt>
              <Tap onPress={() => onChange(value.filter((x) => x !== f))} accessibilityLabel={d.common.delete} style={{ width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' }}>
                <Feather name="x" size={13} color={colors.textMuted} />
              </Tap>
            </Row>
          ))}
        </Row>
      )}
      {value.length < MAX && !typing && (
        <Select
          value={undefined}
          onChange={(k: string) => (k === 'autre' ? setTyping(true) : onChange([...value, k]))}
          options={options}
          placeholder={value.length ? d.majors.addAnother : d.majors.pick}
          searchable
        />
      )}
      {typing && (
        <Row gap={8} style={{ alignItems: 'flex-end' }}>
          <Input label={d.majors.typeIt} value={text} onChangeText={setText} placeholder={d.majors.typePlaceholder} autoFocus maxLength={60} onSubmitEditing={addTyped} containerStyle={{ flex: 1 }} />
          <Button label={d.common.add} icon="plus" variant="secondary" disabled={!text.trim()} onPress={addTyped} />
          <Button label={d.common.cancel} variant="ghost" onPress={() => { setTyping(false); setText(''); }} />
        </Row>
      )}
      <Txt variant="small" color="textSubtle">{d.majors.hint}</Txt>
    </View>
  );
}
