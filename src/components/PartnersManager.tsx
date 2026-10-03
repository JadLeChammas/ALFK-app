import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { Linking, View } from 'react-native';

import { RoleBadge } from '@/components/cards';
import { Sheet } from '@/components/forms';
import { useDialogs } from '@/components/ui/Dialogs';
import { Avatar, Button, Card, EmptyState, IconButton, Input, Row, SectionHeader } from '@/components/ui/primitives';
import { Grid, PageHeader, Screen } from '@/components/ui/Screen';
import { Txt } from '@/components/ui/Txt';
import { fullName, useApprovedMembers, useMe, useStore } from '@/data/store';
import type { Institution } from '@/data/types';
import { isHiDev, partnerLogo, sortPartners } from '@/data/partners';
import { useI18n } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';

/** Logos shipped with the app; any other value is an image URL. */

/** Members' Partners page: institutions (admins add or remove them) and the school's leadership. */
export function PartnersManager() {
  const { d } = useI18n();
  const { colors } = useTheme();
  const { db, actions } = useStore();
  const { confirm } = useDialogs();
  const me = useMe();
  const admin = me.role === 'admin';
  const people = useApprovedMembers().filter((u) => u.role === 'honneur');
  const institutions = sortPartners(db.institutions);
  // Hi Dev always closes the list: the others move among themselves.
  const movableCount = institutions.filter((x) => !isHiDev(x)).length;
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Institution | null>(null);

  return (
    <Screen maxWidth={1040}>
      <PageHeader
        title={d.honorary.title}
        subtitle={d.honorary.subtitle}
        right={admin && <Button label={d.honorary.add} icon="plus" variant="secondary" onPress={() => setAdding(true)} />}
      />

      <View style={{ gap: 14 }}>
        <SectionHeader title={d.honorary.institutions} icon="home" count={String(institutions.length)} />
        {institutions.length === 0 ? (
          <EmptyState icon="home" title={d.common.noResults} />
        ) : (
          <Grid min={300} gap={16}>
            {institutions.map((inst, i) => (
              <InstitutionCard
                key={inst.id}
                inst={inst}
                onEdit={admin ? () => setEditing(inst) : undefined}
                onUp={admin && !isHiDev(inst) && i > 0 ? () => actions.moveInstitution(inst.id, -1) : undefined}
                onDown={admin && !isHiDev(inst) && i < movableCount - 1 ? () => actions.moveInstitution(inst.id, 1) : undefined}
                onDelete={
                  admin
                    ? async () => {
                        if (await confirm({ title: d.common.delete, message: inst.name, danger: true, confirmLabel: d.common.delete })) actions.deleteInstitution(inst.id);
                      }
                    : undefined
                }
              />
            ))}
          </Grid>
        )}
        {admin && (
          <Row gap={8} style={{ alignItems: 'flex-start' }}>
            <Feather name="info" size={14} color={colors.textSubtle} style={{ marginTop: 2 }} />
            <Txt variant="small" color="textSubtle" style={{ flex: 1 }}>{d.honorary.permissionNote}</Txt>
          </Row>
        )}
      </View>

      <View style={{ gap: 14 }}>
        <SectionHeader title={d.honorary.people} icon="star" count={String(people.length)} />
        {people.length === 0 ? (
          <EmptyState icon="star" title={d.common.noResults} />
        ) : (
          <Grid min={260} gap={16}>
            {people.map((u) => (
              <Card key={u.id} onPress={() => router.push(`/membre/${u.id}`)} style={{ gap: 12, alignItems: 'center' }}>
                <Avatar uri={u.avatar} name={fullName(u)} size={72} />
                <View style={{ alignItems: 'center', gap: 4 }}>
                  <Txt variant="h3" align="center">{fullName(u)}</Txt>
                  {u.fonction && <Txt variant="small" color="textMuted" align="center">{u.fonction}</Txt>}
                </View>
                <RoleBadge role={u.role} />
              </Card>
            ))}
          </Grid>
        )}
      </View>

      <InstitutionForm visible={adding} onClose={() => setAdding(false)} />
      {editing && <InstitutionForm visible editing={editing} onClose={() => setEditing(null)} />}
    </Screen>
  );
}

function InstitutionCard({ inst, onDelete, onEdit, onUp, onDown }: { inst: Institution; onDelete?: () => void; onEdit?: () => void; onUp?: () => void; onDown?: () => void }) {
  const { d } = useI18n();
  const { colors } = useTheme();
  const logo = partnerLogo(inst);
  return (
    <Card style={{ gap: 14, height: '100%' }}>
      <Row gap={14}>
        <View style={{ width: 64, height: 64, borderRadius: 16, backgroundColor: '#fff', borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
          {logo ? <Image source={logo} style={{ width: 54, height: 54 }} contentFit="contain" /> : <Feather name="home" size={24} color={colors.primary} />}
        </View>
        <Txt variant="h3" style={{ flex: 1 }}>{inst.name}</Txt>
        {onDelete && <IconButton icon="trash-2" size={34} onPress={onDelete} label={d.common.delete} />}
      </Row>
      {onEdit && (
        <Row gap={6} wrap>
          <Button label={d.common.edit} icon="edit-2" size="sm" variant="secondary" onPress={onEdit} />
          {onUp && <IconButton icon="arrow-up" size={32} onPress={onUp} label={d.guide.up} />}
          {onDown && <IconButton icon="arrow-down" size={32} onPress={onDown} label={d.guide.down} />}
        </Row>
      )}
      <Txt color="textMuted" style={{ flex: 1 }}>{inst.description}</Txt>
      {inst.website && <Button label={d.honorary.website} icon="external-link" size="sm" variant="secondary" style={{ alignSelf: 'flex-start' }} onPress={() => Linking.openURL(inst.website!)} />}
    </Card>
  );
}

function InstitutionForm({ visible, onClose, editing }: { visible: boolean; onClose: () => void; editing?: Institution }) {
  const { d } = useI18n();
  const { actions } = useStore();
  const { toast } = useDialogs();
  const blank = { name: '', description: '', website: '', logo: '' };
  const [form, setForm] = useState(editing ? { name: editing.name, description: editing.description, website: editing.website ?? '', logo: editing.logo ?? '' } : blank);
  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));
  const website = form.website.trim();
  const validSite = !website || /^https?:\/\/\S+$/i.test(website);
  return (
    <Sheet visible={visible} title={editing ? d.honorary.edit : d.honorary.add} onClose={onClose}>
      <Txt variant="small" color="textMuted">{d.honorary.permissionNote}</Txt>
      <Input label={d.honorary.name} value={form.name} onChangeText={set('name')} />
      <Input label={d.honorary.description} value={form.description} onChangeText={set('description')} multiline />
      <Input label={d.honorary.websiteField} icon="link" value={form.website} onChangeText={set('website')} autoCapitalize="none" placeholder="https://" error={validSite ? undefined : d.honorary.invalidUrl} />
      <Input label={d.honorary.logoField} icon="image" value={form.logo} onChangeText={set('logo')} autoCapitalize="none" placeholder="https://" />
      <Button
        label={editing ? d.common.save : d.common.add}
        full
        size="lg"
        disabled={!form.name.trim() || !form.description.trim() || !validSite}
        onPress={() => {
          const values = { name: form.name.trim(), description: form.description.trim(), website: website || undefined, logo: form.logo.trim() || undefined };
          if (editing) actions.updateInstitution(editing.id, values);
          else actions.addInstitution(values);
          toast(d.common.saved);
          setForm(blank);
          onClose();
        }}
      />
    </Sheet>
  );
}
