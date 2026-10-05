import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { RoleBadge } from '@/components/cards';
import { Sheet } from '@/components/forms';
import { FloatingPaths } from '@/components/fx/FloatingPaths';
import { Eyebrow, LogoCloud } from '@/components/site/LogoCloud';
import { FramedPhoto } from '@/components/FramedPhoto';
import { useDialogs } from '@/components/ui/Dialogs';
import { Avatar, Button, Card, EmptyState, IconButton, Input, Row, SectionHeader } from '@/components/ui/primitives';
import { Grid, Screen } from '@/components/ui/Screen';
import { Txt } from '@/components/ui/Txt';
import { fullName, useApprovedMembers, useMe, useStore } from '@/data/store';
import type { Institution } from '@/data/types';
import { LEADER_KINDS, useSchoolLeaders } from '@/data/schoolLeaders';
import { partnerLogo, sortPartners } from '@/data/partners';
import type { PickedImage } from '@/data/remote';
import { AvatarCropper } from '@/components/AvatarCropper';
import { useI18n } from '@/i18n';
import { isFileRejected } from '@/lib/fileSafety';
import { pickImages } from '@/lib/media';
import { useTheme } from '@/theme/ThemeProvider';
import { brand } from '@/theme/tokens';
import { openExternal } from '@/lib/links';

/** Logos shipped with the app; any other value is an image URL. */

/** Members' Partners page: institutions (admins add or remove them) and the school's leadership. */
export function PartnersManager() {
  const { d } = useI18n();
  const { colors, scheme } = useTheme();
  const { db, actions } = useStore();
  const { confirm } = useDialogs();
  const me = useMe();
  const admin = me.role === 'admin';
  const people = useApprovedMembers().filter((u) => u.role === 'honneur');
  // The current leadership, from the timelines of the Bureau page (no end year = in office now).
  const { byKind } = useSchoolLeaders();
  const leaders = LEADER_KINDS.flatMap((k) => byKind(k).filter((x) => !x.to));
  const institutions = sortPartners(db.institutions);
  // Hi Dev always closes the list: the others move among themselves.
  const movableCount = institutions.length;
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Institution | null>(null);

  return (
    <Screen maxWidth={1040}>
      {/* As on the public page: the partners' logos scattered around the title. */}
      <View style={{ borderRadius: 24, overflow: 'hidden' }}>
        <FloatingPaths color={scheme === 'dark' ? '#E7ECF2' : brand.navy} fade={colors.bg} />
        <LogoCloud partners={institutions}>
          <Eyebrow text={d.site.partners.eyebrow} />
          <Txt variant="display" align="center">{d.honorary.title}</Txt>
          <Txt color="textMuted" align="center">{d.honorary.subtitle}</Txt>
          {admin && <Button label={d.honorary.add} icon="plus" variant="secondary" onPress={() => setAdding(true)} style={{ marginTop: 8 }} />}
        </LogoCloud>
      </View>

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
                onUp={admin && i > 0 ? () => actions.moveInstitution(inst.id, -1) : undefined}
                onDown={admin && i < movableCount - 1 ? () => actions.moveInstitution(inst.id, 1) : undefined}
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
        <SectionHeader title={d.honorary.people} icon="star" count={String(leaders.length + people.length)} />
        {leaders.length > 0 && (
          <Grid min={260} gap={16}>
            {leaders.map((x) => (
              <Card key={x.id} style={{ gap: 12, alignItems: 'center' }}>
                {x.photo ? <FramedPhoto uri={x.photo} size={72} frame={x.photoFrame} /> : <Avatar name={x.name} size={72} />}
                <View style={{ alignItems: 'center', gap: 4 }}>
                  <Txt variant="h3" align="center">{x.name}</Txt>
                  <Txt variant="small" color="textMuted" align="center">{d.leaders.kinds[x.kind]}</Txt>
                  {!!x.from && <Txt variant="small" color="textSubtle" align="center">{`${d.leaders.since} ${x.from}`}</Txt>}
                  {!!x.description && <Txt variant="small" color="primary" align="center">{x.description}</Txt>}
                </View>
              </Card>
            ))}
          </Grid>
        )}
        {leaders.length + people.length === 0 ? (
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
      {inst.website && <Button label={d.honorary.website} icon="external-link" size="sm" variant="secondary" style={{ alignSelf: 'flex-start' }} onPress={() => openExternal(inst.website!)} />}
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
  // The logo: an address, or an image file sent by the partner (stored with the site's photos).
  const [uploading, setUploading] = useState(false);
  const [cropping, setCropping] = useState<PickedImage | null>(null);
  const uploadLogo = async () => {
    const [img] = await pickImages(false);
    if (img) setCropping(img);
  };
  const saveLogo = async (img: PickedImage) => {
    setCropping(null);
    setUploading(true);
    try {
      set('logo')(await actions.uploadImage(img, 'partners'));
    } catch (e) {
      toast(isFileRejected(e) ? d.auth.errors[e.reason] : d.auth.errors.unknown, 'danger');
    }
    setUploading(false);
  };
  return (
    <Sheet visible={visible} title={editing ? d.honorary.edit : d.honorary.add} onClose={onClose}>
      <Txt variant="small" color="textMuted">{d.honorary.permissionNote}</Txt>
      <Input label={d.honorary.name} value={form.name} onChangeText={set('name')} />
      <Input label={d.honorary.description} value={form.description} onChangeText={set('description')} multiline />
      <Input label={d.honorary.websiteField} icon="link" value={form.website} onChangeText={set('website')} autoCapitalize="none" placeholder="https://" error={validSite ? undefined : d.honorary.invalidUrl} />
      <Input label={d.honorary.logoField} icon="image" value={form.logo} onChangeText={set('logo')} autoCapitalize="none" placeholder="https://" />
      <Row gap={10}>
        {!!form.logo && <Image source={partnerLogo({ name: form.name, logo: form.logo })} style={{ width: 48, height: 48 }} contentFit="contain" />}
        <Button label={d.honorary.uploadLogo} icon="upload" variant="secondary" size="sm" onPress={uploadLogo} loading={uploading} />
      </Row>
      {/* Placed and zoomed like a profile photo before it is saved. */}
      {cropping && <AvatarCropper image={cropping} onCancel={() => setCropping(null)} onDone={saveLogo} />}
      <Button
        label={editing ? d.common.save : d.common.add}
        full
        size="lg"
        disabled={!form.name.trim() || !form.description.trim() || !validSite || uploading}
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
