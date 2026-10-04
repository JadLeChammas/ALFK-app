import { Feather } from '@expo/vector-icons';
import { useMemo } from 'react';
import { View } from 'react-native';

import { nationalityName, sortedNationalities } from '@/data/nationalities';
import { useI18n } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';
import { Flag } from './ui/Flag';
import { Row, Tap } from './ui/primitives';
import { Select } from './ui/Select';
import { Txt } from './ui/Txt';

/** One or more nationalities, picked from the list of countries. */
export function NationalityPicker({ value, onChange, required }: { value: string[]; onChange: (v: string[]) => void; required?: boolean }) {
  const { d, lang } = useI18n();
  const { colors } = useTheme();
  const options = useMemo(
    () => sortedNationalities(lang).filter((n) => !value.includes(n.code)).map((n) => ({ value: n.code, label: n.name, leading: <Flag code={n.code} /> })),
    [lang, value],
  );
  return (
    <View style={{ gap: 8 }}>
      <Txt variant="smallStrong" color="textMuted">{required ? `${d.nat.label} *` : d.nat.label}</Txt>
      {value.length > 0 && (
        <Row gap={8} wrap>
          {value.map((code) => (
            <Row key={code} gap={8} style={{ paddingLeft: 10, paddingRight: 4, height: 36, borderRadius: 999, backgroundColor: colors.secondarySoft }}>
              <Flag code={code} />
              <Txt variant="smallStrong">{nationalityName(code, lang)}</Txt>
              <Tap onPress={() => onChange(value.filter((c) => c !== code))} accessibilityLabel={d.common.delete} style={{ width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }}>
                <Feather name="x" size={14} color={colors.textMuted} />
              </Tap>
            </Row>
          ))}
        </Row>
      )}
      {value.length < 4 && (
        <Select
          value={undefined}
          onChange={(code: string) => onChange([...value, code])}
          options={options}
          placeholder={value.length ? d.nat.addAnother : d.nat.pick}
          searchable
        />
      )}
      <Txt variant="small" color="textSubtle">{d.nat.hint}</Txt>
    </View>
  );
}

/** Flags and names, for profile pages. */
export function NationalityList({ codes }: { codes: string[] }) {
  const { lang } = useI18n();
  return (
    <Row gap={10} wrap>
      {codes.map((c) => (
        <Row key={c} gap={6}>
          <Flag code={c} />
          <Txt variant="bodyStrong">{nationalityName(c, lang)}</Txt>
        </Row>
      ))}
    </Row>
  );
}
