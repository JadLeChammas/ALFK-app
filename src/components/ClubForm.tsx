import { Image } from 'expo-image';
import { useState } from 'react';
import { View } from 'react-native';

import { Sheet } from '@/components/forms';
import { useDialogs } from '@/components/ui/Dialogs';
import { Button, Input } from '@/components/ui/primitives';
import { Txt } from '@/components/ui/Txt';
import { isUnavailable, useStore } from '@/data/store';
import type { Club } from '@/data/types';
import { useI18n } from '@/i18n';
import { pickImages } from '@/lib/media';
import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';

/** Propose a club (an admin approves it), or edit one (its managers and the admins). */
export function ClubForm({ editing, onClose }: { editing?: Club; onClose: () => void }) {
  const { d } = useI18n();
  const c = d.clubs;
  const { colors } = useTheme();
  const { actions } = useStore();
  const { toast } = useDialogs();
  const [name, setName] = useState(editing?.name ?? '');
  const [description, setDescription] = useState(editing?.description ?? '');
  const [cover, setCover] = useState(editing?.cover ?? '');
  const [uploading, setUploading] = useState(false);

  const pickCover = async () => {
    const [img] = await pickImages(false);
    if (!img) return;
    setUploading(true);
    try {
      setCover(await actions.uploadImage(img, 'clubs'));
    } catch (e) {
      if (!isUnavailable(e)) toast(d.auth.errors.unknown, 'danger');
    }
    setUploading(false);
  };

  const save = () => {
    if (editing) {
      if (actions.updateClub(editing.id, { name, description, cover }) === false) return;
      toast(d.common.saved, 'success');
    } else {
      if (actions.proposeClub({ name, description, cover }) === false) return;
      toast(c.proposed, 'success');
    }
    onClose();
  };

  return (
    <Sheet visible title={editing ? c.edit : c.propose} onClose={onClose}>
      {!editing && <Txt variant="small" color="textMuted">{c.proposeHint}</Txt>}
      <Input label={c.name} value={name} onChangeText={setName} maxLength={80} placeholder={c.namePlaceholder} />
      <Input label={c.description} value={description} onChangeText={setDescription} multiline maxLength={2000} placeholder={c.descriptionPlaceholder} />
      <View style={{ gap: 8 }}>
        {!!cover && <Image source={{ uri: cover }} style={{ width: '100%', height: 140, borderRadius: radius.card, backgroundColor: colors.surfaceAlt }} contentFit="cover" />}
        <Button label={cover ? c.changeCover : c.addCover} icon="image" variant="secondary" size="sm" onPress={pickCover} loading={uploading} style={{ alignSelf: 'flex-start' }} />
      </View>
      <Button label={editing ? d.common.save : c.send} icon={editing ? 'check' : 'send'} full size="lg" disabled={name.trim().length < 2 || uploading} onPress={save} />
    </Sheet>
  );
}
