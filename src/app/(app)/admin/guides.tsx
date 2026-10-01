import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { AdminNav } from '@/components/AdminNav';
import { Sheet } from '@/components/forms';
import { GuideSteps, useGuideTitle } from '@/components/guide/GuideSteps';
import { useDialogs } from '@/components/ui/Dialogs';
import { Flag } from '@/components/ui/Flag';
import { Badge, Button, Card, Chip, EmptyState, Input, Row, SectionHeader } from '@/components/ui/primitives';
import { Select } from '@/components/ui/Select';
import { PageHeader, Screen } from '@/components/ui/Screen';
import { Txt } from '@/components/ui/Txt';
import { COUNTRIES } from '@/data/countries';
import { useGuides, type CountryGuide } from '@/data/guide';
import { useStore } from '@/data/store';
import { useI18n } from '@/i18n';

/** Admins: the country guides (France today, more countries later): add, edit, publish, delete. */
export default function AdminGuides() {
  const { d, country } = useI18n();
  const g = d.guide;
  const { actions } = useStore();
  const { confirm, toast } = useDialogs();
  const params = useLocalSearchParams<{ pays?: string; nouveau?: string }>();
  const { guides, custom } = useGuides();
  const titleOf = useGuideTitle();
  const [selected, setSelected] = useState<string | undefined>(params.pays?.toUpperCase());
  const [adding, setAdding] = useState(!!params.nouveau);
  const guide = guides.find((x) => x.country === selected) ?? guides[0];

  const save = (next: CountryGuide[]) => actions.saveGuides(next);
  const update = (id: string, patch: Partial<CountryGuide>) => save(guides.map((x) => (x.id === id ? { ...x, ...patch } : x)));

  return (
    <Screen maxWidth={960}>
      <PageHeader title={g.adminTitle} subtitle={g.adminSubtitle} right={<Button label={g.addCountry} icon="plus" onPress={() => setAdding(true)} />} />
      <AdminNav />

      <Row gap={8} wrap>
        {guides.map((x) => (
          <Chip key={x.id} label={x.published ? country(x.country) : `${country(x.country)} · ${g.draft}`} leading={<Flag code={x.country} />} active={x.id === guide?.id} onPress={() => setSelected(x.country)} />
        ))}
      </Row>

      {!guide ? (
        <Card>
          <EmptyState icon="map" title={g.none} action={<Button label={g.addCountry} icon="plus" onPress={() => setAdding(true)} />} />
        </Card>
      ) : (
        <>
          <GuideSettings
            key={guide.id}
            guide={guide}
            defaultTitle={titleOf({ ...guide, title: undefined })}
            onSave={(patch) => {
              update(guide.id, patch);
              toast(d.common.saved);
            }}
            onPublish={(published) => update(guide.id, { published })}
            onSee={() => router.push(`/guide?pays=${guide.country}` as never)}
            onDelete={async () => {
              if (await confirm({ title: g.deleteGuide, message: titleOf(guide), danger: true, confirmLabel: d.common.delete })) {
                save(guides.filter((x) => x.id !== guide.id));
                setSelected(undefined);
              }
            }}
          />
          <GuideSteps steps={guide.steps} onChange={(steps) => update(guide.id, { steps })} />
        </>
      )}

      {custom && (
        <Button
          label={g.reset}
          icon="rotate-ccw"
          variant="ghost"
          onPress={async () => {
            if (await confirm({ title: g.reset, message: g.resetAllConfirm, danger: true, confirmLabel: g.reset })) actions.saveGuides(null);
          }}
        />
      )}

      {adding && (
        <AddCountrySheet
          taken={guides.map((x) => x.country)}
          initial={params.nouveau?.toUpperCase()}
          templates={guides}
          onClose={() => setAdding(false)}
          onAdd={(cc, copyFrom) => {
            const base = guides.find((x) => x.id === copyFrom);
            const stamp = Date.now().toString(36);
            const fresh: CountryGuide = {
              id: `guide-${cc.toLowerCase()}-${stamp}`,
              country: cc,
              published: false,
              steps: base ? base.steps.map((s, i) => ({ ...s, id: `${s.id}-${cc.toLowerCase()}${stamp}${i}` })) : [],
            };
            save([...guides, fresh]);
            setSelected(cc);
            setAdding(false);
          }}
        />
      )}
    </Screen>
  );
}

function GuideSettings({
  guide,
  defaultTitle,
  onSave,
  onPublish,
  onSee,
  onDelete,
}: {
  guide: CountryGuide;
  defaultTitle: string;
  onSave: (patch: Partial<CountryGuide>) => void;
  onPublish: (published: boolean) => void;
  onSee: () => void;
  onDelete: () => void;
}) {
  const { d, country } = useI18n();
  const g = d.guide;
  const [title, setTitle] = useState(guide.title ?? '');
  const [intro, setIntro] = useState(guide.intro ?? '');
  const changed = title !== (guide.title ?? '') || intro !== (guide.intro ?? '');
  return (
    <Card style={{ gap: 14 }}>
      <Row wrap style={{ justifyContent: 'space-between', gap: 10 }}>
        <Row gap={10}>
          <Flag code={guide.country} size={22} />
          <Txt variant="h3">{country(guide.country)}</Txt>
          <Badge label={guide.published ? g.published : g.draft} tone={guide.published ? 'success' : 'warning'} icon={guide.published ? 'eye' : 'eye-off'} />
        </Row>
        <Row gap={8} wrap>
          <Button label={guide.published ? g.unpublish : g.publish} icon={guide.published ? 'eye-off' : 'eye'} size="sm" variant={guide.published ? 'secondary' : 'primary'} onPress={() => onPublish(!guide.published)} />
          <Button label={g.see} icon="external-link" size="sm" variant="secondary" onPress={onSee} />
          <Button label={g.deleteGuide} icon="trash-2" size="sm" variant="ghost" onPress={onDelete} />
        </Row>
      </Row>
      <SectionHeader title={g.settings} icon="sliders" />
      <Input label={g.guideTitle} value={title} onChangeText={setTitle} placeholder={defaultTitle} maxLength={100} />
      <Input label={g.intro} value={intro} onChangeText={setIntro} placeholder={g.subtitle} multiline maxLength={400} />
      <Row>
        <Button label={d.common.save} icon="check" disabled={!changed} onPress={() => onSave({ title: title.trim() || undefined, intro: intro.trim() || undefined })} />
      </Row>
      <Txt variant="small" color="textSubtle">{g.stepsHint}</Txt>
    </Card>
  );
}

function AddCountrySheet({ taken, initial, templates, onClose, onAdd }: { taken: string[]; initial?: string; templates: CountryGuide[]; onClose: () => void; onAdd: (country: string, copyFrom?: string) => void }) {
  const { d, country } = useI18n();
  const g = d.guide;
  const titleOf = useGuideTitle();
  const options = COUNTRIES.filter((c) => !taken.includes(c.code)).map((c) => ({ value: c.code, label: country(c.code), leading: <Flag code={c.code} /> }));
  const [cc, setCc] = useState<string | undefined>(initial && !taken.includes(initial) ? initial : undefined);
  const [copyFrom, setCopyFrom] = useState<string | undefined>(undefined);
  return (
    <Sheet visible title={g.addCountry} onClose={onClose}>
      <Select label={g.country} value={cc} onChange={setCc} options={options} placeholder={g.pickCountry} searchable />
      {templates.length > 0 && (
        <View style={{ gap: 8 }}>
          <Txt variant="smallStrong" color="textMuted">{g.startFrom}</Txt>
          <Row gap={8} wrap>
            <Chip label={g.blank} active={!copyFrom} onPress={() => setCopyFrom(undefined)} />
            {templates.map((t) => (
              <Chip key={t.id} label={titleOf(t)} leading={<Flag code={t.country} />} active={copyFrom === t.id} onPress={() => setCopyFrom(t.id)} />
            ))}
          </Row>
          <Txt variant="small" color="textSubtle">{g.copyHint}</Txt>
        </View>
      )}
      <Button label={g.create} icon="plus" full size="lg" disabled={!cc} onPress={() => cc && onAdd(cc, copyFrom)} />
    </Sheet>
  );
}
