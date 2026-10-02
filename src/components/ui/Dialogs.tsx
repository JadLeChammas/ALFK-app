import { Feather } from '@expo/vector-icons';
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { Animated, Modal, Pressable, View } from 'react-native';

import { useI18n } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, space } from '@/theme/tokens';
import { Button, Input } from './primitives';
import { Txt } from './Txt';

/** `typeToConfirm`: the confirm button stays disabled until this text (e.g. a full name) is typed. */
type ConfirmOpts = { title: string; message?: string; confirmLabel?: string; danger?: boolean; typeToConfirm?: string };

/** Case-, accent- and spacing-insensitive comparison for the type-to-confirm field. */
const loose = (v: string) => v.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
type PromptOpts = ConfirmOpts & { placeholder?: string; initial?: string; secure?: boolean; multiline?: boolean };

type DialogState =
  | ({ kind: 'confirm'; resolve: (v: boolean) => void } & ConfirmOpts)
  | ({ kind: 'prompt'; resolve: (v: string | null) => void } & PromptOpts)
  | null;

type Ctx = {
  confirm: (o: ConfirmOpts) => Promise<boolean>;
  prompt: (o: PromptOpts) => Promise<string | null>;
  toast: (message: string, tone?: 'success' | 'danger') => void;
};

const DialogContext = createContext<Ctx | null>(null);

export function DialogProvider({ children }: { children: ReactNode }) {
  const { colors } = useTheme();
  const { d } = useI18n();
  const [dialog, setDialog] = useState<DialogState>(null);
  const [value, setValue] = useState('');
  const [toastMsg, setToastMsg] = useState<{ text: string; tone: 'success' | 'danger' } | null>(null);
  const [opacity] = useState(() => new Animated.Value(0));
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const confirm = useCallback(
    (o: ConfirmOpts) =>
      new Promise<boolean>((resolve) => {
        setValue('');
        setDialog({ kind: 'confirm', resolve, ...o });
      }),
    []
  );
  const prompt = useCallback(
    (o: PromptOpts) =>
      new Promise<string | null>((resolve) => {
        setValue(o.initial ?? '');
        setDialog({ kind: 'prompt', resolve, ...o });
      }),
    []
  );
  const toast = useCallback(
    (text: string, tone: 'success' | 'danger' = 'success') => {
      if (timer.current) clearTimeout(timer.current);
      setToastMsg({ text, tone });
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();
      timer.current = setTimeout(() => {
        Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => setToastMsg(null));
      }, 2400);
    },
    [opacity]
  );

  useEffect(() => () => void (timer.current && clearTimeout(timer.current)), []);

  const close = (result: boolean) => {
    if (!dialog) return;
    if (dialog.kind === 'confirm') dialog.resolve(result);
    else dialog.resolve(result ? value : null);
    setDialog(null);
  };

  return (
    <DialogContext.Provider value={{ confirm, prompt, toast }}>
      {children}
      <Modal visible={!!dialog} transparent animationType="fade" onRequestClose={() => close(false)}>
        <Pressable style={{ flex: 1, backgroundColor: colors.overlay, alignItems: 'center', justifyContent: 'center', padding: space.xl }} onPress={() => close(false)}>
          <Pressable
            onPress={() => {}}
            style={{ width: '100%', maxWidth: 420, backgroundColor: colors.surface, borderRadius: radius.hero, padding: space.xxl, gap: space.lg, borderWidth: 1, borderColor: colors.border }}>
            {dialog?.danger && (
              <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: colors.dangerSoft, alignItems: 'center', justifyContent: 'center' }}>
                <Feather name="alert-triangle" size={22} color={colors.danger} />
              </View>
            )}
            <View style={{ gap: 6 }}>
              <Txt variant="h2">{dialog?.title}</Txt>
              {dialog?.message && <Txt color="textMuted">{dialog.message}</Txt>}
            </View>
            {dialog?.kind === 'confirm' && dialog.typeToConfirm && (
              <View style={{ gap: 10 }}>
                <Txt variant="small" color="textMuted">{d.common.typeToConfirm}</Txt>
                <View style={{ alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.input, backgroundColor: colors.dangerSoft, borderWidth: 1, borderColor: colors.danger }}>
                  <Txt selectable variant="bodyStrong" style={{ color: colors.danger }}>{dialog.typeToConfirm}</Txt>
                </View>
                <Input
                  autoFocus
                  value={value}
                  onChangeText={setValue}
                  placeholder={dialog.typeToConfirm}
                  autoCapitalize="words"
                  autoCorrect={false}
                  accessibilityLabel={d.common.typeToConfirm}
                  onSubmitEditing={() => loose(value) === loose(dialog.typeToConfirm ?? '') && close(true)}
                />
              </View>
            )}
            {dialog?.kind === 'prompt' && (
              <Input
                autoFocus
                value={value}
                onChangeText={setValue}
                placeholder={dialog.placeholder}
                secureTextEntry={dialog.secure}
                multiline={dialog.multiline}
                onSubmitEditing={() => !dialog.multiline && close(true)}
              />
            )}
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 10, flexWrap: 'wrap' }}>
              <Button label={d.common.cancel} variant="secondary" onPress={() => close(false)} />
              <Button
                label={dialog?.confirmLabel ?? d.common.confirm}
                variant={dialog?.danger ? 'danger' : 'primary'}
                onPress={() => close(true)}
                disabled={(dialog?.kind === 'prompt' && !value.trim()) || (dialog?.kind === 'confirm' && !!dialog.typeToConfirm && loose(value) !== loose(dialog.typeToConfirm))}
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
      {toastMsg && (
        <Animated.View
          pointerEvents="none"
          style={{ position: 'absolute', bottom: 96, left: 0, right: 0, alignItems: 'center', opacity, zIndex: 1000 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.ink, paddingHorizontal: 18, paddingVertical: 12, borderRadius: radius.pill }}>
            <Feather name={toastMsg.tone === 'success' ? 'check-circle' : 'alert-circle'} size={16} color={toastMsg.tone === 'success' ? colors.success : colors.danger} />
            <Txt variant="smallStrong" style={{ color: colors.onInk }}>{toastMsg.text}</Txt>
          </View>
        </Animated.View>
      )}
    </DialogContext.Provider>
  );
}

export function useDialogs() {
  const ctx = useContext(DialogContext);
  if (!ctx) throw new Error('useDialogs must be used inside DialogProvider');
  return ctx;
}
