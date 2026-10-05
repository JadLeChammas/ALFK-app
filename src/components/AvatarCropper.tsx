import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { useEffect, useRef, useState } from 'react';
import { Image as RNImage, Modal, Platform, Pressable, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import type { PickedImage } from '@/data/remote';
import type { PhotoFrame } from './FramedPhoto';
import { useI18n } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';
import { Button, IconButton, Row } from './ui/primitives';
import { Txt } from './ui/Txt';

const BOX = 280;
const OUT = 512;
const MAX_ZOOM = 4;

/**
 * Adjust a profile photo before saving it: drag to place it, zoom with − / + (or the mouse wheel),
 * and only the circle is kept (a 512×512 JPEG).
 * « Frame » mode (`onFrame`): nothing is cut, only the placement and zoom are returned, to show the
 * photo framed (FramedPhoto) — for photos hosted elsewhere that the browser will not let us cut.
 */
export function AvatarCropper({
  image,
  onCancel,
  onDone,
  onFrame,
  initialFrame,
}: {
  image: PickedImage;
  onCancel: () => void;
  onDone?: (img: PickedImage) => void;
  onFrame?: (frame: PhotoFrame) => void;
  initialFrame?: PhotoFrame;
}) {
  const { d } = useI18n();
  const { colors } = useTheme();
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const [zoom, setZoom] = useState(initialFrame?.zoom ?? 1);
  const [pos, setPos] = useState({ x: (initialFrame?.x ?? 0) * BOX, y: (initialFrame?.y ?? 0) * BOX });
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState<string | null>(null);
  const drag = useRef({ x: 0, y: 0, px: 0, py: 0 });

  useEffect(() => {
    RNImage.getSize(image.uri, (w, h) => setSize({ w, h }), (e) => setFailed(String(e?.message ?? e)));
  }, [image.uri]);

  // The image always covers the circle: smallest side = the box at zoom 1.
  const base = size ? BOX / Math.min(size.w, size.h) : 1;
  const scale = base * zoom;
  const dispW = (size?.w ?? 0) * scale;
  const dispH = (size?.h ?? 0) * scale;
  const clamp = (p: { x: number; y: number }, s = scale) => {
    const mx = Math.max(0, ((size?.w ?? 0) * s - BOX) / 2);
    const my = Math.max(0, ((size?.h ?? 0) * s - BOX) / 2);
    return { x: Math.min(mx, Math.max(-mx, p.x)), y: Math.min(my, Math.max(-my, p.y)) };
  };
  const setZoomTo = (z: number) => {
    const next = Math.min(MAX_ZOOM, Math.max(1, Math.round(z * 100) / 100));
    setZoom(next);
    setPos((p) => clamp(p, base * next));
  };

  const save = async () => {
    if (!size) return;
    if (onFrame) return onFrame({ x: pos.x / BOX, y: pos.y / BOX, zoom });
    setBusy(true);
    try {
      // Top-left of the image in the box, then the box in image pixels.
      const left = BOX / 2 + pos.x - dispW / 2;
      const top = BOX / 2 + pos.y - dispH / 2;
      const side = Math.min(size.w, size.h, BOX / scale);
      const originX = Math.max(0, Math.min(size.w - side, -left / scale));
      const originY = Math.max(0, Math.min(size.h - side, -top / scale));
      // On the web, a photo already online (the current avatar) is downloaded first so it can be cut.
      let source = image.uri;
      if (Platform.OS === 'web' && /^https?:/.test(source)) source = URL.createObjectURL(await (await fetch(source)).blob());
      const ctx = ImageManipulator.manipulate(source);
      ctx.crop({ originX, originY, width: side, height: side }).resize({ width: OUT, height: OUT });
      const ref = await ctx.renderAsync();
      const out = await ref.saveAsync({ format: SaveFormat.JPEG, compress: 0.85, base64: true });
      onDone?.({ uri: out.uri, base64: out.base64 ?? null, mimeType: 'image/jpeg' });
    } catch (e) {
      setFailed(String((e as Error)?.message ?? e));
    } finally {
      setBusy(false);
    }
  };

  // Web: the browser's own pointer events (mouse, finger, pen), followed on the whole window while dragging.
  const webHandlers =
    Platform.OS === 'web'
      ? ({
          onWheel: (e: { deltaY: number }) => setZoomTo(zoom - e.deltaY / 600),
          onPointerDown: (e: { clientX: number; clientY: number; preventDefault: () => void }) => {
            e.preventDefault();
            const start = { x: pos.x, y: pos.y, px: e.clientX, py: e.clientY };
            const move = (ev: PointerEvent) => setPos(clamp({ x: start.x + ev.clientX - start.px, y: start.y + ev.clientY - start.py }));
            const up = () => {
              window.removeEventListener('pointermove', move);
              window.removeEventListener('pointerup', up);
              window.removeEventListener('pointercancel', up);
            };
            window.addEventListener('pointermove', move);
            window.addEventListener('pointerup', up);
            window.addEventListener('pointercancel', up);
          },
          style: { width: BOX, height: BOX, overflow: 'hidden', borderRadius: 16, backgroundColor: '#000', cursor: 'grab', touchAction: 'none', userSelect: 'none' },
        } as object)
      : {};
  // Phones: React Native's responder system.
  const nativeHandlers =
    Platform.OS === 'web'
      ? {}
      : {
          onStartShouldSetResponder: () => true,
          onMoveShouldSetResponder: () => true,
          onResponderTerminationRequest: () => false,
          onResponderGrant: (e: { nativeEvent: { pageX: number; pageY: number } }) => {
            drag.current = { x: pos.x, y: pos.y, px: e.nativeEvent.pageX, py: e.nativeEvent.pageY };
          },
          onResponderMove: (e: { nativeEvent: { pageX: number; pageY: number } }) => {
            const g = drag.current;
            setPos(clamp({ x: g.x + e.nativeEvent.pageX - g.px, y: g.y + e.nativeEvent.pageY - g.py }));
          },
        };

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable onPress={onCancel} style={{ flex: 1, backgroundColor: colors.overlay, alignItems: 'center', justifyContent: 'center', padding: 16 }}>
        <Pressable onPress={() => {}} style={{ width: '100%', maxWidth: 380, backgroundColor: colors.surface, borderRadius: radius.hero, borderWidth: 1, borderColor: colors.border, padding: 20, gap: 16, alignItems: 'center' }}>
          <Row style={{ alignSelf: 'stretch', justifyContent: 'space-between' }}>
            <Txt variant="h3">{d.crop.title}</Txt>
            <IconButton icon="x" size={36} onPress={onCancel} label={d.common.close} />
          </Row>

          <View style={{ width: BOX, height: BOX, overflow: 'hidden', borderRadius: 16, backgroundColor: '#000' }} {...nativeHandlers} {...webHandlers}>
            {size && (
              // The photo never takes the pointer: on the web the browser would start dragging the <img> instead.
              <View pointerEvents="none" style={{ position: 'absolute', width: dispW, height: dispH, left: BOX / 2 + pos.x - dispW / 2, top: BOX / 2 + pos.y - dispH / 2 }}>
                <Image source={{ uri: image.uri }} style={{ width: '100%', height: '100%' }} contentFit="fill" draggable={false} />
              </View>
            )}
            {/* Everything outside the circle is dimmed: that part is not kept. */}
            <Svg pointerEvents="none" width={BOX} height={BOX} style={{ position: 'absolute', left: 0, top: 0 }}>
              <Path d={`M0 0H${BOX}V${BOX}H0Z M${BOX / 2} 1 A${BOX / 2 - 1} ${BOX / 2 - 1} 0 1 0 ${BOX / 2 + 0.01} 1Z`} fill="rgba(0,0,0,0.55)" fillRule="evenodd" />
              <Path d={`M${BOX / 2} 1 A${BOX / 2 - 1} ${BOX / 2 - 1} 0 1 0 ${BOX / 2 + 0.01} 1Z`} fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth={2} />
            </Svg>
          </View>

          <Row gap={12}>
            <IconButton icon="zoom-out" size={40} onPress={() => setZoomTo(zoom - 0.2)} label={d.crop.zoomOut} />
            <View style={{ width: 120, height: 6, borderRadius: 3, backgroundColor: colors.surfaceAlt, overflow: 'hidden' }}>
              <View style={{ width: `${((zoom - 1) / (MAX_ZOOM - 1)) * 100}%`, height: '100%', backgroundColor: colors.secondary }} />
            </View>
            <IconButton icon="zoom-in" size={40} onPress={() => setZoomTo(zoom + 0.2)} label={d.crop.zoomIn} />
          </Row>
          <Row gap={6}>
            <Feather name="move" size={13} color={colors.textSubtle} />
            <Txt variant="small" color="textSubtle">{d.crop.hint}</Txt>
          </Row>
          {!!failed && <Txt variant="small" color="danger" align="center">{`${d.crop.failed} (${failed})`}</Txt>}

          <Row gap={10} style={{ alignSelf: 'stretch' }}>
            <Button label={d.common.cancel} variant="secondary" onPress={onCancel} style={{ flex: 1 }} />
            <Button label={d.crop.use} icon="check" onPress={save} loading={busy} disabled={!size} style={{ flex: 1 }} />
          </Row>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
