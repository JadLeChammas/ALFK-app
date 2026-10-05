import { useState } from 'react';
import { View } from 'react-native';

import { AuthFrame } from '@/components/AuthFrame';
import { CityPicker } from '@/components/CityPicker';
import { FieldsPicker } from '@/components/FieldsPicker';
import { NationalityPicker } from '@/components/NationalityPicker';
import { UniversityPicker } from '@/components/UniversityPicker';
import { useDialogs } from '@/components/ui/Dialogs';
import { Button, Input, Segmented } from '@/components/ui/primitives';
import { Flag } from '@/components/ui/Flag';
import { Select } from '@/components/ui/Select';
import { Txt } from '@/components/ui/Txt';
import { sortedCountries } from '@/data/countries';
import { userFields } from '@/data/fields';
import { useStore } from '@/data/store';
import type { Situation } from '@/data/types';
import { useI18n } from '@/i18n';

/**
 * A student who just left Terminale (moved up by an admin) is now an alumnus: before using the
 * site, they fill in their account like any alumnus — where they are, what they study or where they
 * work, their field of study. Guarded in app/_layout.tsx; the database checks it too (migration 026).
 */
export default function CompleteAccount() {
  const { d, lang } = useI18n();
  const c = d.complete;
  const { me, actions } = useStore();
  const { toast } = useDialogs();
  const [situation, setSituation] = useState<Situation>(me?.situation ?? 'student');
  const [country, setCountry] = useState(me?.country ?? 'FR');
  const [city, setCity] = useState(me?.city ?? '');
  const [school, setSchool] = useState(me?.school ?? '');
  const [schoolCountry, setSchoolCountry] = useState<string | undefined>(me?.schoolCountry);
  const [employer, setEmployer] = useState(me?.employer ?? '');
  const [jobTitle, setJobTitle] = useState(me?.jobTitle ?? '');
  const [fields, setFields] = useState<string[]>(me ? userFields(me) : []);
  const [nationalities, setNationalities] = useState<string[]>(me?.nationalities ?? []);
  const [missing, setMissing] = useState<string[]>([]);
  const working = situation === 'working';

  const save = () => {
    const lacking = [
      !country && d.auth.country,
      !city.trim() && d.auth.city,
      !working && !school.trim() && d.auth.school,
      working && !employer.trim() && d.situation.employer,
      working && !jobTitle.trim() && d.situation.jobTitle,
      fields.length === 0 && d.orientation.field,
      nationalities.length === 0 && d.nat.label,
    ].filter((x): x is string => !!x);
    setMissing(lacking);
    if (lacking.length) return;
    const r = actions.updateProfile({
      situation,
      country,
      city: city.trim(),
      school: school.trim() || undefined,
      schoolCountry: school.trim() ? schoolCountry ?? country : undefined,
      employer: working ? employer.trim() : undefined,
      jobTitle: working ? jobTitle.trim() : undefined,
      fields,
      fieldOfStudy: fields[0],
      nationalities,
      needsCompletion: false,
    });
    if (!r.ok) return r.error === 'unavailable' ? undefined : toast(d.auth.errors[r.error], 'danger');
    toast(c.done, 'success');
  };

  return (
    <AuthFrame title={c.title} subtitle={c.sub}>
      <View style={{ gap: 16 }}>
        <View style={{ gap: 8 }}>
          <Txt variant="smallStrong" color="textMuted">{d.situation.label}</Txt>
          <Segmented
            value={situation}
            onChange={setSituation}
            options={[
              { value: 'student', label: d.situation.student, icon: 'book-open' },
              { value: 'working', label: d.situation.working, icon: 'briefcase' },
            ]}
          />
        </View>
        <Select label={d.auth.country} value={country} onChange={setCountry} searchable options={sortedCountries(lang).map((x) => ({ value: x.code, label: x.name, leading: <Flag code={x.code} /> }))} />
        <CityPicker label={d.auth.city} value={city} onChange={setCity} country={country} />
        {working && (
          <>
            <Input label={d.situation.employer} icon="briefcase" value={employer} onChangeText={setEmployer} />
            <Input label={d.situation.jobTitle} icon="award" value={jobTitle} onChangeText={setJobTitle} />
          </>
        )}
        <UniversityPicker label={working ? d.situation.graduatedFrom : d.auth.school} optional={working} value={school} onChange={(v, cc) => { setSchool(v); setSchoolCountry(cc); }} country={country} city={city} />
        <FieldsPicker value={fields} onChange={setFields} />
        <NationalityPicker value={nationalities} onChange={setNationalities} />
        {missing.length > 0 && <Txt variant="smallStrong" color="danger">{`${d.auth.errors.missing} — ${missing.join(', ')}`}</Txt>}
        <Button label={c.save} iconRight="arrow-right" full size="lg" onPress={save} />
        <Button label={d.common.signOut} variant="ghost" full onPress={() => actions.signOut()} />
      </View>
    </AuthFrame>
  );
}
