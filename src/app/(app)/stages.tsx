import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { View } from 'react-native';

import { useStartConversation } from '@/components/cards';
import { useDialogs } from '@/components/ui/Dialogs';
import { Flag } from '@/components/ui/Flag';
import { Avatar, Badge, Button, Card, Chip, EmptyState, FieldRow, IconButton, Input, MetaLine, Row, Segmented, SectionHeader, Tap } from '@/components/ui/primitives';
import { PageHeader, Screen } from '@/components/ui/Screen';
import { Select } from '@/components/ui/Select';
import { Txt } from '@/components/ui/Txt';
import { sortedCountries } from '@/data/countries';
import { canMessage } from '@/data/permissions';
import { fullName, useMe, useStore, useUserMap } from '@/data/store';
import type { Internship } from '@/data/types';
import { useI18n } from '@/i18n';

type Kind = Internship['kind'];
type Contract = Internship['contract'];

/**
 * « Stage / Alternance »: ads from members who offer an internship or a work-study contract, and from
 * those looking for one. Alumni, honorary members and admins read and post them (students do not see
 * the page); an ad stays until its author or an admin takes it down. Table internships, migration 054.
 */
export default function Internships() {
  const { d, relative, country: countryName } = useI18n();
  const s = d.stages;
  const { db } = useStore();
  const [filter, setFilter] = useState<'all' | Kind>('all');
  const [contract, setContract] = useState<'all' | Contract>('all');
  const [writing, setWriting] = useState(false);

  const list = useMemo(
    () => db.internships.filter((i) => (filter === 'all' || i.kind === filter) && (contract === 'all' || i.contract === contract)),
    [db.internships, filter, contract]
  );

  return (
    <Screen maxWidth={900}>
      <PageHeader title={s.title} subtitle={s.subtitle} right={!writing && <Button label={s.post} icon="plus" onPress={() => setWriting(true)} />} />

      {writing && <AdForm onClose={() => setWriting(false)} />}

      <View style={{ gap: 10 }}>
        <Segmented
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'all', label: s.all },
            { value: 'offer', label: s.offers, icon: 'briefcase' },
            { value: 'request', label: s.requests, icon: 'search' },
          ]}
        />
        <Row gap={8} wrap>
          <Chip label={s.anyContract} active={contract === 'all'} onPress={() => setContract('all')} />
          <Chip label={s.stage} active={contract === 'stage'} onPress={() => setContract('stage')} />
          <Chip label={s.alternance} active={contract === 'alternance'} onPress={() => setContract('alternance')} />
        </Row>
      </View>

      {list.length === 0 ? (
        <Card>
          <EmptyState icon="briefcase" title={s.empty} action={<Button label={s.post} icon="plus" variant="secondary" onPress={() => setWriting(true)} />} />
        </Card>
      ) : (
        <View style={{ gap: 14 }}>
          {list.map((ad) => (
            <AdCard key={ad.id} ad={ad} when={relative(ad.createdAt)} place={[ad.city, ad.country ? countryName(ad.country) : undefined].filter(Boolean).join(', ')} />
          ))}
        </View>
      )}
    </Screen>
  );
}

function AdCard({ ad, when, place }: { ad: Internship; when: string; place: string }) {
  const { d } = useI18n();
  const s = d.stages;
  const { actions } = useStore();
  const { confirm } = useDialogs();
  const me = useMe();
  const users = useUserMap();
  const start = useStartConversation();
  const author = ad.authorId ? users.get(ad.authorId) : undefined;
  const mine = ad.authorId === me.id;

  return (
    <Card style={{ gap: 12 }}>
      <Row gap={8} wrap>
        <Badge label={ad.kind === 'offer' ? s.offerBadge : s.requestBadge} tone={ad.kind === 'offer' ? 'success' : 'info'} icon={ad.kind === 'offer' ? 'briefcase' : 'search'} />
        <Badge label={ad.contract === 'stage' ? s.stage : s.alternance} tone="neutral" />
        {!!ad.field && <Badge label={ad.field} tone="secondary" />}
      </Row>
      <Txt variant="h3">{ad.title}</Txt>
      <View style={{ gap: 4 }}>
        {!!ad.company && <MetaLine icon="home" text={ad.company} />}
        {!!place && <MetaLine icon="map-pin" text={place} />}
        {!!ad.duration && <MetaLine icon="clock" text={`${s.duration} : ${ad.duration}`} />}
        {!!ad.startDate && <MetaLine icon="calendar" text={`${s.start} : ${ad.startDate}`} />}
      </View>
      <Txt color="textMuted">{ad.description}</Txt>
      <Row gap={10} wrap style={{ borderTopWidth: 1, borderTopColor: 'rgba(127,127,127,0.18)', paddingTop: 10 }}>
        <Tap onPress={() => author && router.push(`/membre/${author.id}`)} disabled={!author} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
          <Avatar uri={author?.avatar} name={author ? fullName(author) : '?'} size={32} />
          <View style={{ flex: 1 }}>
            <Txt variant="smallStrong" numberOfLines={1}>{author ? fullName(author) : d.circle.formerMember}</Txt>
            <Txt variant="small" color="textSubtle">{when}</Txt>
          </View>
        </Tap>
        {!mine && author && canMessage(me, author) && <Button label={s.contact} icon="message-circle" size="sm" variant="secondary" onPress={() => start(author.id)} />}
        {(mine || me.role === 'admin') && (
          <IconButton
            icon="trash-2"
            size={32}
            label={s.remove}
            onPress={async () => {
              if (await confirm({ title: s.remove, message: ad.title, danger: true, confirmLabel: s.remove })) actions.deleteInternship(ad.id);
            }}
          />
        )}
      </Row>
    </Card>
  );
}

function AdForm({ onClose }: { onClose: () => void }) {
  const { d, lang } = useI18n();
  const s = d.stages;
  const { actions } = useStore();
  const { toast } = useDialogs();
  const me = useMe();
  const [kind, setKind] = useState<Kind>('offer');
  const [contract, setContract] = useState<Contract>('stage');
  const [title, setTitle] = useState('');
  const [field, setField] = useState('');
  const [company, setCompany] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState(me.country || 'FR');
  const [duration, setDuration] = useState('');
  const [startDate, setStartDate] = useState('');
  const [description, setDescription] = useState('');

  const publish = () => {
    const r = actions.postInternship({ kind, contract, title, field, company: kind === 'offer' ? company : undefined, city, country, duration, startDate, description });
    if (!r.ok) return;
    toast(s.posted, 'success');
    onClose();
  };

  return (
    <Card style={{ gap: 14 }}>
      <SectionHeader title={s.post} icon="plus" />
      <Segmented
        value={kind}
        onChange={setKind}
        options={[
          { value: 'offer', label: s.iOffer, icon: 'briefcase' },
          { value: 'request', label: s.iLook, icon: 'search' },
        ]}
      />
      <Segmented value={contract} onChange={setContract} options={[{ value: 'stage', label: s.stage }, { value: 'alternance', label: s.alternance }]} />
      <Input label={`${s.adTitle} *`} value={title} onChangeText={setTitle} maxLength={140} placeholder={kind === 'offer' ? s.titleOfferPlaceholder : s.titleRequestPlaceholder} />
      <FieldRow>
        <Input label={s.field} value={field} onChangeText={setField} maxLength={120} containerStyle={{ flex: 1 }} />
        {kind === 'offer' && <Input label={s.company} value={company} onChangeText={setCompany} maxLength={120} containerStyle={{ flex: 1 }} />}
      </FieldRow>
      <FieldRow>
        <View style={{ flex: 1 }}>
          <Select label={d.auth.country} value={country} onChange={setCountry} searchable options={sortedCountries(lang).map((c) => ({ value: c.code, label: c.name, leading: <Flag code={c.code} /> }))} />
        </View>
        <Input label={d.auth.city} value={city} onChangeText={setCity} maxLength={120} containerStyle={{ flex: 1 }} />
      </FieldRow>
      <FieldRow>
        <Input label={s.duration} value={duration} onChangeText={setDuration} maxLength={80} placeholder={s.durationPlaceholder} containerStyle={{ flex: 1 }} />
        <Input label={s.start} value={startDate} onChangeText={setStartDate} maxLength={80} placeholder={s.startPlaceholder} containerStyle={{ flex: 1 }} />
      </FieldRow>
      <Input label={`${s.description} *`} value={description} onChangeText={setDescription} multiline maxLength={5000} style={{ minHeight: 140, textAlignVertical: 'top' }} />
      <Row gap={8} wrap>
        <Button label={s.publish} icon="send" onPress={publish} disabled={!title.trim() || !description.trim()} />
        <Button label={d.common.cancel} variant="ghost" onPress={onClose} />
      </Row>
    </Card>
  );
}
