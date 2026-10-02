import { useMemo, useState } from 'react';
import { View } from 'react-native';

import { countryForDial, DIAL_BY_COUNTRY, maskFrDate } from '@/data/members';
import { sortedNationalities } from '@/data/nationalities';
import { useI18n } from '@/i18n';
import { Flag } from './Flag';
import { Input } from './primitives';
import { Select } from './Select';
import { Txt } from './Txt';

/** Birth date typed as JJ/MM/AAAA; the slashes are added while typing. */
export function DateField({ label, value, onChange, error, required }: { label: string; value: string; onChange: (v: string) => void; error?: string; required?: boolean }) {
  const { d } = useI18n();
  return (
    <Input
      label={required ? `${label} *` : label}
      icon="gift"
      value={value}
      onChangeText={(v) => onChange(maskFrDate(v))}
      placeholder={d.auth.birthDateHint}
      keyboardType="number-pad"
      maxLength={10}
      error={error}
      containerStyle={{ flex: 1 }}
    />
  );
}

/** Country dialling code + national number; stored by the caller as "+965 12345678". */
export function PhoneField({
  label,
  dial,
  number,
  onDial,
  onNumber,
  error,
  required,
}: {
  label: string;
  dial: string;
  number: string;
  onDial: (v: string) => void;
  onNumber: (v: string) => void;
  error?: string;
  required?: boolean;
}) {
  const { d, lang } = useI18n();
  // Every country, by name; several share a code (+1, +7…), so the option is the country and the field keeps the code.
  const options = useMemo(
    () => sortedNationalities(lang).map((n) => ({ value: n.code, label: `${n.name} (${DIAL_BY_COUNTRY[n.code]})`, short: DIAL_BY_COUNTRY[n.code], leading: <Flag code={n.code} /> })).filter((o) => o.short),
    [lang],
  );
  const [picked, setPicked] = useState<string | undefined>(undefined);
  const country = picked && DIAL_BY_COUNTRY[picked] === dial ? picked : countryForDial(dial);
  return (
    <View style={{ gap: 6, flex: 1 }}>
      <Txt variant="smallStrong" color="textMuted">{required ? `${label} *` : label}</Txt>
      <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
        <View style={{ width: 128 }}>
          <Select value={country} onChange={(cc) => { setPicked(cc); onDial(DIAL_BY_COUNTRY[cc]); }} options={options} searchable placeholder={d.auth.dialCode} />
        </View>
        <Input
          icon="phone"
          value={number}
          onChangeText={(v) => onNumber(v.replace(/[^\d\s]/g, ''))}
          placeholder={d.auth.phoneNumber}
          keyboardType="phone-pad"
          maxLength={18}
          containerStyle={{ flex: 1 }}
        />
      </View>
      {error && <Txt variant="small" color="danger">{error}</Txt>}
    </View>
  );
}
