import { View } from 'react-native';

import { DIAL_CODES, maskFrDate } from '@/data/members';
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
  const { d } = useI18n();
  // Several countries share a code (+1): the option value is the code, the flag the first country using it.
  const options = DIAL_CODES.filter((c, i, all) => all.findIndex((x) => x.dial === c.dial) === i).map((c) => ({
    value: c.dial,
    label: c.dial,
    leading: <Flag code={c.code} />,
  }));
  return (
    <View style={{ gap: 6, flex: 1 }}>
      <Txt variant="smallStrong" color="textMuted">{required ? `${label} *` : label}</Txt>
      <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
        <View style={{ width: 128 }}>
          <Select value={dial} onChange={onDial} options={options} searchable placeholder={d.auth.dialCode} />
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
