import { createElement, forwardRef, useImperativeHandle, useRef, type ReactNode } from 'react';
import { Platform } from 'react-native';

/**
 * Password managers (iCloud Keychain on iPhone and Mac, Google Password Manager, 1Password,
 * Bitwarden…) offer to save a login when they see a real form with a user name and a password being
 * sent. React Native Web draws plain <div>s, so on the web the sign-in and sign-up fields are wrapped
 * in an actual <form>: the app's own button sends it (`submit()` → requestSubmit), the browser sees the
 * submission, the app does the rest. Native: the children as they are.
 */
export type CredentialFormHandle = { submit: () => void };

export const CredentialForm = forwardRef<CredentialFormHandle, { onSubmit: () => void; children: ReactNode }>(function CredentialForm({ onSubmit, children }, ref) {
  const form = useRef<HTMLFormElement | null>(null);
  useImperativeHandle(
    ref,
    () => ({
      submit: () => {
        const f = form.current;
        if (!f) return onSubmit();
        if (typeof f.requestSubmit === 'function') f.requestSubmit();
        else f.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
      },
    }),
    [onSubmit]
  );
  if (Platform.OS !== 'web') return <>{children}</>;
  return createElement(
    'form',
    {
      ref: form,
      method: 'post',
      action: '',
      autoComplete: 'on',
      noValidate: true,
      onSubmit: (e: { preventDefault: () => void }) => {
        e.preventDefault();
        onSubmit();
      },
      // no box of its own: the fields keep the layout of the screen around them
      style: { display: 'contents' },
    },
    children,
    // lets « Enter » send the form too; invisible and out of the tab order
    createElement('button', { type: 'submit', tabIndex: -1, 'aria-hidden': true, style: { position: 'absolute', width: 1, height: 1, padding: 0, border: 0, opacity: 0, overflow: 'hidden', pointerEvents: 'none' } })
  );
});

/**
 * After a successful sign-in or sign-up: asks the browser to save the login (Credential Management
 * API — Chrome, Edge, Android show their « Save password? » prompt). Safari has no such API; it
 * prompts from the form submission above. Does nothing elsewhere or if the user already saved it.
 */
export async function offerToSavePassword(id: string, password: string, name?: string) {
  if (Platform.OS !== 'web' || typeof window === 'undefined' || !id || !password) return;
  const Ctor = (window as unknown as { PasswordCredential?: new (data: { id: string; password: string; name?: string }) => Credential }).PasswordCredential;
  if (!Ctor || !navigator.credentials?.store) return;
  try {
    await navigator.credentials.store(new Ctor({ id, password, name }));
  } catch {
    // refused or unavailable: the browser's own heuristics may still offer it
  }
}
