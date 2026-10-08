import { useState } from 'react';
import { View } from 'react-native';

import { AuthFrame } from '@/components/AuthFrame';
import { AvatarCropper } from '@/components/AvatarCropper';
import { CityPicker } from '@/components/CityPicker';
import { useDialogs } from '@/components/ui/Dialogs';
import { Flag } from '@/components/ui/Flag';
import { Avatar, Button, Input, Row } from '@/components/ui/primitives';
import { Select } from '@/components/ui/Select';
import { Txt } from '@/components/ui/Txt';
import { sortedCountries } from '@/data/countries';
import type { PickedImage } from '@/data/remote';
import { fullName, useStore } from '@/data/store';
import { useI18n } from '@/i18n';
import { pickImages } from '@/lib/media';

/**
 * First sign-in of an honorary member (their account is created by an admin with only a name, an
 * e-mail and a password): their photo, their title (« Proviseur »…), their country and city — no
 * phone number, no date of birth. Guarded in app/_layout.tsx until the profile is complete.
 */
export default function HonourProfile() {
  const { d, lang } = useI18n();
  const m = d.mh;
  const { me, actions } = useStore();
  const { toast } = useDialogs();
  const [fonction, setFonction] = useState(me?.fonction ?? '');
  const [country, setCountry] = useState(me?.country || 'KW');
  const [city, setCity] = useState(me?.city ?? '');
  const [cropping, setCropping] = useState<PickedImage | null>(null);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [missing, setMissing] = useState<string[]>([]);

  const choosePhoto = async () => {
    const [img] = await pickImages(false);
    if (img) setCropping(img);
  };
  const savePhoto = async (img: PickedImage) => {
    setCropping(null);
    setPhotoBusy(true);
    const r = await actions.addMissingPhoto(img);
    setPhotoBusy(false);
    if (!r.ok) toast(d.auth.errors.unknown, 'danger');
  };

  const save = () => {
    const lacking = [!me?.avatar && m.photo, !fonction.trim() && m.fonction, !country && d.auth.country, !city.trim() && d.auth.city].filter((x): x is string => !!x);
    setMissing(lacking);
    if (lacking.length) return;
    const r = actions.updateProfile({ fonction: fonction.trim(), country, city: city.trim() });
    if (!r.ok && r.error !== 'unavailable') toast(d.auth.errors[r.error], 'danger');
  };

  return (
    <AuthFrame title={m.setupTitle} subtitle={m.setupSub}>
      <View style={{ gap: 16 }}>
        <Row gap={14}>
          <Avatar uri={me?.avatar} name={me ? fullName(me) : '?'} size={72} />
          <View style={{ flex: 1, gap: 6 }}>
            <Txt variant="smallStrong" color="textMuted">{`${m.photo} *`}</Txt>
            <Button label={me?.avatar ? m.changePhoto : m.addPhoto} icon="camera" size="sm" variant={me?.avatar ? 'secondary' : 'primary'} onPress={choosePhoto} loading={photoBusy} style={{ alignSelf: 'flex-start' }} />
          </View>
        </Row>
        {cropping && <AvatarCropper image={cropping} onCancel={() => setCropping(null)} onDone={savePhoto} />}
        <Input label={`${m.fonction} *`} icon="briefcase" value={fonction} onChangeText={setFonction} placeholder={m.fonctionPlaceholder} maxLength={80} />
        <Select
          label={`${d.auth.country} *`}
          value={country}
          onChange={(c) => {
            setCountry(c);
            setCity('');
          }}
          searchable
          options={sortedCountries(lang).map((c) => ({ value: c.code, label: c.name, leading: <Flag code={c.code} /> }))}
        />
        <CityPicker label={`${d.auth.city} *`} value={city} onChange={setCity} country={country} />
        {missing.length > 0 && <Txt variant="smallStrong" color="danger">{`${m.missing} ${missing.join(', ')}`}</Txt>}
        <Button label={m.setupSave} icon="check" full size="lg" onPress={save} disabled={photoBusy} />
      </View>
    </AuthFrame>
  );
}
