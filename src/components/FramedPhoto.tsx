import { Image } from 'expo-image';
import { useState } from 'react';
import { View } from 'react-native';

/**
 * How a photo sits in its circle: the centre's offset as a share of the circle (x, y) and the zoom
 * (1 = the photo just covers the circle). Set with the cropper's « frame » mode (AvatarCropper).
 */
export type PhotoFrame = { x: number; y: number; zoom: number };

/**
 * A round photo shown with its framing — without changing the file, so it also works for a photo
 * hosted elsewhere (the LFK's site), which the browser would not let us cut.
 */
export function FramedPhoto({ uri, size, frame }: { uri: string; size: number; frame?: PhotoFrame }) {
  const [nat, setNat] = useState<{ w: number; h: number } | null>(null);
  const framed = !!frame && !!nat;
  const base = nat ? size / Math.min(nat.w, nat.h) : 1;
  const w = nat ? nat.w * base * (frame?.zoom ?? 1) : size;
  const h = nat ? nat.h * base * (frame?.zoom ?? 1) : size;
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, overflow: 'hidden', backgroundColor: '#e8e4dc' }}>
      <Image
        source={{ uri }}
        onLoad={(e) => setNat({ w: e.source.width, h: e.source.height })}
        style={framed ? { position: 'absolute', width: w, height: h, left: size / 2 + frame!.x * size - w / 2, top: size / 2 + frame!.y * size - h / 2 } : { width: size, height: size }}
        contentFit={framed ? 'fill' : 'cover'}
        transition={150}
      />
    </View>
  );
}
