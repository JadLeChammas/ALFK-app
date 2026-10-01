import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useEffect } from 'react';
import { Modal, Platform, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useI18n } from '@/i18n';
import { fonts } from '@/theme/tokens';
import { IconButton } from './primitives';
import { Txt } from './Txt';

export type LightboxItem = { id: string; uri: string; caption?: string; canDelete?: boolean };

export function Lightbox({
  items,
  index,
  onChange,
  onClose,
  onDelete,
  deleteLabel,
}: {
  items: LightboxItem[];
  index: number | null;
  onChange: (i: number) => void;
  onClose: () => void;
  onDelete?: (item: LightboxItem) => void;
  deleteLabel?: string;
}) {
  const insets = useSafeAreaInsets();
  const { d } = useI18n();
  const item = index !== null ? items[index] : null;
  const prev = () => index !== null && onChange((index - 1 + items.length) % items.length);
  const next = () => index !== null && onChange((index + 1) % items.length);

  useEffect(() => {
    if (Platform.OS !== 'web' || index === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  return (
    <Modal visible={!!item} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,10,32,0.96)' }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: insets.top + 12, paddingHorizontal: 16, zIndex: 2 }}>
          <Txt style={{ color: '#fff', fontFamily: fonts.semibold, fontSize: 13, opacity: 0.8 }}>
            {index !== null ? `${index + 1} / ${items.length}` : ''}
          </Txt>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {item?.canDelete && onDelete && <IconButton icon="trash-2" variant="overlay" label={deleteLabel} onPress={() => onDelete(item)} />}
            <IconButton icon="x" variant="overlay" onPress={onClose} label={d.common.close} />
          </View>
        </View>
        <Pressable style={{ flex: 1, justifyContent: 'center' }} onPress={onClose}>
          {item && <Image source={{ uri: item.uri }} style={{ width: '100%', height: '80%' }} contentFit="contain" transition={150} />}
        </Pressable>
        {items.length > 1 && (
          <>
            <View style={{ position: 'absolute', left: 12, top: '50%' }}>
              <IconButton icon="chevron-left" variant="overlay" size={44} onPress={prev} />
            </View>
            <View style={{ position: 'absolute', right: 12, top: '50%' }}>
              <IconButton icon="chevron-right" variant="overlay" size={44} onPress={next} />
            </View>
          </>
        )}
        {item?.caption && (
          <View style={{ paddingBottom: insets.bottom + 20, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 }}>
            <Feather name="camera" size={13} color="#fff" style={{ opacity: 0.7 }} />
            <Txt style={{ color: '#fff', fontFamily: fonts.medium, fontSize: 13, opacity: 0.8 }}>{item.caption}</Txt>
          </View>
        )}
      </View>
    </Modal>
  );
}
