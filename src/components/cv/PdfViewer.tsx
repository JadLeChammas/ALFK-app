import { Feather } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, View } from 'react-native';

import { Txt } from '@/components/ui/Txt';
import { useI18n } from '@/i18n';
import { openExternal } from '@/lib/links';
import { useTheme } from '@/theme/ThemeProvider';
import { brand, fonts } from '@/theme/tokens';

/**
 * PDF CVs drawn with pdf.js (Mozilla's renderer, public/pdfjs, loaded only when a CV is shown):
 * phones can't show a PDF inside a page (Android draws nothing, iPhone only a frozen first page),
 * pdf.js draws the pages the same everywhere.
 *  · CvPreview: the first page, zoomed out and locked; a tap opens the viewer.
 *  · CvViewer: every page, full screen — scroll, zoom (buttons, pinch, double tap), open in a new tab.
 * Web only (the app is a website); the native app opens the PDF with the system viewer.
 */

const PDFJS = '/pdfjs/4.10.38';

type RenderTask = { promise: Promise<void>; cancel: () => void };
type PdfPage = { getViewport: (o: { scale: number }) => { width: number; height: number }; render: (o: { canvasContext: CanvasRenderingContext2D; viewport: unknown }) => RenderTask };
type PdfDoc = { numPages: number; getPage: (n: number) => Promise<PdfPage> };
type PdfLib = { getDocument: (src: { url: string; isEvalSupported?: boolean }) => { promise: Promise<PdfDoc> }; GlobalWorkerOptions: { workerSrc: string } };

let lib: Promise<PdfLib> | null = null;
function loadLib(): Promise<PdfLib> {
  if (lib) return lib;
  lib = new Promise<PdfLib>((resolve, reject) => {
    const w = window as unknown as { pdfjsLib?: PdfLib };
    const ready = () => {
      if (!w.pdfjsLib?.getDocument) return reject(new Error('pdfjs'));
      w.pdfjsLib.GlobalWorkerOptions.workerSrc = `${PDFJS}/pdf.worker.min.mjs`;
      resolve(w.pdfjsLib);
    };
    if (w.pdfjsLib?.getDocument) return ready();
    const s = document.createElement('script');
    s.type = 'module';
    s.src = `${PDFJS}/pdf.min.mjs`;
    s.onload = ready;
    s.onerror = () => reject(new Error('pdfjs'));
    document.head.appendChild(s);
  }).catch((e) => {
    lib = null;
    throw e;
  });
  return lib;
}

const docs = new Map<string, Promise<PdfDoc>>();
function loadDoc(url: string): Promise<PdfDoc> {
  let d = docs.get(url);
  if (!d) {
    d = loadLib().then((l) => l.getDocument({ url, isEvalSupported: false }).promise);
    d.catch(() => docs.delete(url));
    docs.set(url, d);
  }
  return d;
}

/** Draws one page at `cssWidth` CSS pixels (sharp on retina, capped so phones don't run out of memory). */
async function drawPage(doc: PdfDoc, n: number, canvas: HTMLCanvasElement, cssWidth: number, tasks: RenderTask[]) {
  const page = await doc.getPage(n);
  const base = page.getViewport({ scale: 1 });
  const dpr = Math.min(window.devicePixelRatio || 1, 2, 2600 / cssWidth);
  const vp = page.getViewport({ scale: (cssWidth / base.width) * dpr });
  canvas.width = Math.floor(vp.width);
  canvas.height = Math.floor(vp.height);
  canvas.style.width = `${cssWidth}px`;
  canvas.style.height = `${Math.floor(vp.height / dpr)}px`;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const task = page.render({ canvasContext: ctx, viewport: vp });
  tasks.push(task);
  await task.promise;
}

const ignoreCancel = (e: unknown) => {
  if ((e as { name?: string })?.name !== 'RenderingCancelledException') throw e;
};

/** The first page, zoomed out and locked; the whole area opens the viewer. */
export function CvPreview({ url, name, onOpen }: { url: string; name: string; onOpen: () => void }) {
  const { d } = useI18n();
  const { colors } = useTheme();
  const canvas = useRef<HTMLCanvasElement | null>(null);
  const [width, setWidth] = useState(0);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  // the page fits in the card: never wider than 360 px, never taller than 500 px (A4 ≈ 1.414)
  const pageWidth = Math.max(0, Math.min(width - 32, 360, 500 / 1.414));

  useEffect(() => {
    if (!pageWidth || !canvas.current) return;
    let alive = true;
    const tasks: RenderTask[] = [];
    const el = canvas.current;
    loadDoc(url)
      .then((doc) => drawPage(doc, 1, el, pageWidth, tasks))
      .then(() => alive && setState('ready'))
      .catch((e) => {
        try {
          ignoreCancel(e);
        } catch {
          if (alive) setState('error');
        }
      });
    return () => {
      alive = false;
      tasks.forEach((t) => t.cancel());
    };
  }, [url, pageWidth]);

  return (
    <Pressable
      onPress={onOpen}
      accessibilityRole="button"
      accessibilityLabel={`${d.cv.openFile} — ${name}`}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      style={(state) => ({ borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceAlt, alignItems: 'center', paddingVertical: 16, cursor: 'zoom-in', opacity: (state as { hovered?: boolean }).hovered ? 0.96 : 1 }) as object}>
      <View style={{ width: pageWidth || 1, minHeight: pageWidth ? pageWidth * 1.414 : 200, backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, alignItems: 'center', justifyContent: 'center' }}>
        {/* locked: the page can't be scrolled or zoomed here */}
        <canvas ref={canvas} style={{ display: state === 'error' ? 'none' : 'block', pointerEvents: 'none' }} />
        {state === 'loading' && <ActivityIndicator style={{ position: 'absolute' }} color={colors.primary} />}
        {state === 'error' && <Feather name="file-text" size={40} color={colors.textSubtle} />}
      </View>
      <View style={{ position: 'absolute', bottom: 28, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, height: 40, borderRadius: 20, backgroundColor: brand.navy }}>
        <Feather name="maximize-2" size={15} color="#fff" />
        <Txt style={{ fontFamily: fonts.semibold, fontSize: 14, color: '#fff' }}>{d.cv.openFile}</Txt>
      </View>
    </Pressable>
  );
}

const ZOOMS = [0.75, 1, 1.25, 1.5, 2, 2.5, 3];
const clampZoom = (z: number) => Math.min(3, Math.max(0.5, z));

/** Full screen: every page, scroll, zoom (buttons, pinch, double tap), new tab, close. */
export function CvViewer({ url, name, visible, onClose }: { url: string; name: string; visible: boolean; onClose: () => void }) {
  const { d } = useI18n();
  const [pages, setPages] = useState(0);
  const [failed, setFailed] = useState(false);
  const [box, setBox] = useState(0);
  const [zoom, setZoom] = useState(1);
  const scroller = useRef<HTMLDivElement | null>(null);
  const sheet = useRef<HTMLDivElement | null>(null);
  const canvases = useRef<(HTMLCanvasElement | null)[]>([]);
  const pinch = useRef({ dist: 0, zoom: 1, live: 1, lastTap: 0 });
  // page width at 100 %: the screen width minus a margin, at most an A4 read comfortably
  const fit = Math.max(0, Math.min(box - 24, 820));
  const cssWidth = Math.round(fit * zoom);

  useEffect(() => {
    if (!visible) return;
    let alive = true;
    loadDoc(url)
      .then((doc) => alive && setPages(doc.numPages))
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, [url, visible]);

  // (re)draw every page at the current width and zoom
  useEffect(() => {
    if (!visible || !pages || !cssWidth) return;
    let alive = true;
    const tasks: RenderTask[] = [];
    loadDoc(url).then(async (doc) => {
      for (let n = 1; n <= pages && alive; n++) {
        const el = canvases.current[n - 1];
        if (el) await drawPage(doc, n, el, cssWidth, tasks).catch(ignoreCancel).catch(() => {});
      }
    });
    if (sheet.current) sheet.current.style.transform = '';
    return () => {
      alive = false;
      tasks.forEach((t) => t.cancel());
    };
  }, [url, visible, pages, cssWidth]);

  // pinch to zoom (phones): the pages scale live, then are redrawn sharp when the fingers lift
  useEffect(() => {
    const el = scroller.current;
    if (!visible || !el) return;
    const distance = (t: TouchList) => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
    const start = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        pinch.current.dist = distance(e.touches);
        pinch.current.zoom = zoom;
        pinch.current.live = zoom;
      } else if (e.touches.length === 1) {
        // double tap: 100 % ↔ 200 %
        const now = Date.now();
        if (now - pinch.current.lastTap < 300) setZoom((z) => (z > 1 ? 1 : 2));
        pinch.current.lastTap = now;
      }
    };
    const move = (e: TouchEvent) => {
      if (e.touches.length !== 2 || !pinch.current.dist) return;
      e.preventDefault();
      pinch.current.live = clampZoom(pinch.current.zoom * (distance(e.touches) / pinch.current.dist));
      if (sheet.current) {
        sheet.current.style.transformOrigin = 'top center';
        sheet.current.style.transform = `scale(${pinch.current.live / pinch.current.zoom})`;
      }
    };
    const end = (e: TouchEvent) => {
      if (!pinch.current.dist || e.touches.length > 1) return;
      pinch.current.dist = 0;
      setZoom(Math.round(pinch.current.live * 100) / 100);
    };
    el.addEventListener('touchstart', start, { passive: true });
    el.addEventListener('touchmove', move, { passive: false });
    el.addEventListener('touchend', end);
    return () => {
      el.removeEventListener('touchstart', start);
      el.removeEventListener('touchmove', move);
      el.removeEventListener('touchend', end);
    };
  }, [visible, zoom]);

  const step = (dir: 1 | -1) =>
    setZoom((z) => (dir > 0 ? ZOOMS.find((x) => x > z + 0.01) ?? 3 : [...ZOOMS].reverse().find((x) => x < z - 0.01) ?? 0.5));
  const close = () => {
    setZoom(1);
    onClose();
  };
  const btn = { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.12)' } as const;

  return (
    <Modal visible={visible} animationType="fade" onRequestClose={close} transparent>
      <View style={{ flex: 1, backgroundColor: '#081523' }} onLayout={(e) => setBox(e.nativeEvent.layout.width)}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 10 }}>
          <Txt numberOfLines={1} style={{ flex: 1, color: '#fff', fontFamily: fonts.semibold, fontSize: 14 }}>{name}</Txt>
          <Pressable onPress={() => step(-1)} accessibilityLabel={d.crop.zoomOut} style={btn}>
            <Feather name="zoom-out" size={18} color="#fff" />
          </Pressable>
          <Pressable onPress={() => setZoom(1)} accessibilityRole="button" style={{ minWidth: 52, alignItems: 'center' }}>
            <Txt style={{ color: '#fff', fontFamily: fonts.semibold, fontSize: 13 }}>{`${Math.round(zoom * 100)} %`}</Txt>
          </Pressable>
          <Pressable onPress={() => step(1)} accessibilityLabel={d.crop.zoomIn} style={btn}>
            <Feather name="zoom-in" size={18} color="#fff" />
          </Pressable>
          <Pressable onPress={() => openExternal(url)} accessibilityLabel={d.cv.openTab} style={btn}>
            <Feather name="external-link" size={18} color="#fff" />
          </Pressable>
          <Pressable onPress={close} accessibilityLabel={d.common.close} style={[btn, { backgroundColor: brand.red }]}>
            <Feather name="x" size={20} color="#fff" />
          </Pressable>
        </View>
        <div ref={scroller} style={{ flex: 1, overflow: 'auto', WebkitOverflowScrolling: 'touch', touchAction: 'pan-x pan-y' }}>
          <div ref={sheet} style={{ display: 'flex', flexDirection: 'column', alignItems: cssWidth > box ? 'flex-start' : 'center', gap: 12, padding: 12, minWidth: 'min-content' }}>
            {failed && (
              <Pressable onPress={() => openExternal(url)} style={{ marginTop: 40, alignItems: 'center', gap: 10 }}>
                <Feather name="file-text" size={40} color="#fff" />
                <Txt style={{ color: '#fff', fontFamily: fonts.semibold }}>{d.cv.openTab}</Txt>
              </Pressable>
            )}
            {!failed && !pages && <ActivityIndicator color="#fff" style={{ marginTop: 40 }} />}
            {Array.from({ length: pages }, (_, i) => (
              <canvas
                key={i}
                ref={(el) => {
                  canvases.current[i] = el;
                }}
                style={{ display: 'block', background: '#fff', boxShadow: '0 6px 24px rgba(0,0,0,0.35)', flexShrink: 0 }}
              />
            ))}
          </div>
        </div>
      </View>
    </Modal>
  );
}
