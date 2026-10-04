import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useState } from 'react';
import { View } from 'react-native';

import { checkPicked, type PickedDoc } from '@/data/remote';
import { useI18n } from '@/i18n';
import { isFileRejected, PROOF_TYPES } from '@/lib/fileSafety';
import { pickProof } from '@/lib/media';
import { useTheme } from '@/theme/ThemeProvider';
import { Button, Row } from './ui/primitives';
import { Txt } from './ui/Txt';

/**
 * Proof of schooling at the LFK (report card, school certificate, attestation or a simple photo).
 * Required to sign up: an admin checks it before approving the account.
 */
export function ProofPicker({ value, onChange, error, required }: { value: PickedDoc | null; onChange: (doc: PickedDoc | null) => void; error?: boolean; required?: boolean }) {
  const { d } = useI18n();
  const { colors } = useTheme();
  // A refused file: too large, not an image or a PDF, or contents that do not match its name.
  const [rejected, setRejected] = useState<'file_type' | 'file_too_large' | null>(null);
  const isImage = !!value?.mimeType?.startsWith('image/');

  const pick = async () => {
    const doc = await pickProof();
    if (!doc) return;
    try {
      await checkPicked(doc, PROOF_TYPES);
    } catch (e) {
      setRejected(isFileRejected(e) ? e.reason : 'file_type');
      return;
    }
    setRejected(null);
    onChange(doc);
  };

  return (
    <View style={{ gap: 12 }}>
      <View
        style={{
          gap: 14,
          padding: 18,
          borderRadius: 18,
          borderWidth: 1.5,
          borderStyle: value ? 'solid' : 'dashed',
          borderColor: error || rejected ? colors.danger : value ? colors.success : colors.borderStrong,
          backgroundColor: value ? colors.successSoft : colors.surface,
        }}>
        <Row gap={12} style={{ alignItems: 'flex-start' }}>
          <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: value ? colors.success : colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
            <Feather name={value ? 'check' : 'file-plus'} size={20} color={value ? '#fff' : colors.primary} />
          </View>
          <View style={{ flex: 1, gap: 4 }}>
            <Txt variant="bodyStrong">{required ? `${d.proof.title} *` : d.proof.title}</Txt>
            <Txt variant="small" color="textMuted">{d.proof.sub}</Txt>
          </View>
        </Row>
        {value && (
          <Row gap={10} style={{ padding: 10, borderRadius: 12, backgroundColor: colors.surface }}>
            {isImage ? (
              <Image source={{ uri: value.uri }} style={{ width: 44, height: 44, borderRadius: 8 }} contentFit="cover" />
            ) : (
              <Feather name="file-text" size={22} color={colors.primary} />
            )}
            <Txt variant="smallStrong" numberOfLines={1} style={{ flex: 1 }}>{value.name}</Txt>
            <Feather name="x" size={16} color={colors.textSubtle} onPress={() => onChange(null)} accessibilityLabel={d.common.delete} />
          </Row>
        )}
        <Button label={value ? d.proof.replace : d.proof.pick} icon="upload" variant={value ? 'secondary' : 'primary'} onPress={pick} />
        <Txt variant="small" color="textSubtle">{d.proof.formats}</Txt>
      </View>
      {rejected && <Txt variant="smallStrong" color="danger">{rejected === 'file_too_large' ? d.proof.tooBig : d.auth.errors.file_type}</Txt>}
      {error && !rejected && <Txt variant="smallStrong" color="danger">{d.auth.errors.proof}</Txt>}
    </View>
  );
}
