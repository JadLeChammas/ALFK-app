import { Feather } from '@expo/vector-icons';
import { View } from 'react-native';

import type { OtherSchool } from '@/data/types';
import { useI18n } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';
import { Flag } from './ui/Flag';
import { Badge, IconButton, IconTile, ListRow, Row, Tap } from './ui/primitives';
import { Txt } from './ui/Txt';
import { UniLogo } from './UniLogo';
import { UniversityPicker } from './UniversityPicker';

const MAX = 5;

/** Other universities besides the main one (exchange semester, second degree…), each can be ticked « Échange ». */
export function OtherSchoolsEditor({ value, onChange, country }: { value: OtherSchool[]; onChange: (v: OtherSchool[]) => void; country?: string }) {
  const { d, country: countryName } = useI18n();
  const { colors } = useTheme();
  const update = (i: number, patch: Partial<OtherSchool>) => onChange(value.map((s, j) => (j === i ? { ...s, ...patch } : s)));
  return (
    <View style={{ gap: 10 }}>
      <Txt variant="smallStrong" color="textMuted">{`${d.schools.title} (${d.common.optional})`}</Txt>
      {value.map((s, i) => (
        <Row key={`${s.name}-${i}`} gap={10} style={{ padding: 12, borderRadius: 14, backgroundColor: colors.surfaceAlt }}>
          {s.country ? <Flag code={s.country} /> : <Feather name="book" size={15} color={colors.textSubtle} />}
          <View style={{ flex: 1, gap: 6 }}>
            <Txt variant="bodyStrong" numberOfLines={2}>{s.name}</Txt>
            {!!s.country && <Txt variant="small" color="textSubtle">{countryName(s.country)}</Txt>}
            {/* Exchange checkbox */}
            <Tap
              onPress={() => update(i, { exchange: !s.exchange })}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: !!s.exchange }}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start' }}>
              <View style={{ width: 20, height: 20, borderRadius: 5, borderWidth: 2, borderColor: s.exchange ? colors.primary : colors.borderStrong, backgroundColor: s.exchange ? colors.primary : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
                {s.exchange && <Feather name="check" size={13} color="#fff" />}
              </View>
              <Txt variant="small">{d.schools.exchange}</Txt>
            </Tap>
          </View>
          <IconButton icon="x" size={32} label={d.common.delete} onPress={() => onChange(value.filter((_, j) => j !== i))} />
        </Row>
      ))}
      {value.length < MAX && (
        <UniversityPicker
          label={d.schools.add}
          icon="plus"
          value=""
          country={country}
          onChange={(name, cc) => {
            if (name && !value.some((s) => s.name === name)) onChange([...value, { name, country: cc, exchange: false }]);
          }}
        />
      )}
      <Txt variant="small" color="textSubtle">{d.schools.hint}</Txt>
    </View>
  );
}

/** On profile pages: one row per other university, with « Échange » when ticked. */
export function OtherSchoolsRows({ schools }: { schools: OtherSchool[] }) {
  const { d, country } = useI18n();
  return (
    <>
      {schools.map((s, i) => (
        <ListRow
          key={`${s.name}-${i}`}
          leading={<UniLogo name={s.name} fallback={<IconTile icon="book-open" />} />}
          title={s.name}
          subtitle={[s.exchange ? d.schools.exchange : d.schools.other, s.country && country(s.country)].filter(Boolean).join(' · ')}
          right={
            <Row gap={8}>
              {s.exchange && <Badge label={d.schools.exchange} tone="secondary" icon="repeat" />}
              {!!s.country && <Flag code={s.country} size={16} />}
            </Row>
          }
        />
      ))}
    </>
  );
}
