import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { View } from 'react-native';

import { useDialogs } from '@/components/ui/Dialogs';
import { Flag } from '@/components/ui/Flag';
import { Card, ListRow, Row, Switch, Tap, type IconName } from '@/components/ui/primitives';
import { Grid, PageHeader, Screen } from '@/components/ui/Screen';
import { Txt } from '@/components/ui/Txt';
import { useMe, useStore } from '@/data/store';
import { LANGUAGES, useI18n } from '@/i18n';
import { useLayout } from '@/theme/layout';
import { useTheme, type ThemePreference } from '@/theme/ThemeProvider';
import { brand, palettes, radius } from '@/theme/tokens';

export default function Settings() {
  const { isMobile } = useLayout();
  const { d, lang, setLang } = useI18n();
  const { colors, preference, setPreference } = useTheme();
  const { actions, isRemote } = useStore();
  const { confirm, toast } = useDialogs();
  const me = useMe();
  const [notif, setNotif] = useState({ messages: true, events: true, birthdays: true });

  const themes: { value: ThemePreference; label: string; icon: IconName }[] = [
    { value: 'light', label: d.settings.light, icon: 'sun' },
    { value: 'dark', label: d.settings.dark, icon: 'moon' },
    { value: 'system', label: d.settings.system, icon: 'monitor' },
  ];

  const account = (
    <Section title={d.settings.account} icon="user" card>
      <ListRow icon="edit-2" title={d.settings.editProfile} onPress={() => router.push('/profil/modifier')} />
      <ListRow icon="key" title={d.settings.changePassword} onPress={() => router.push('/profil/modifier')} last />
    </Section>
  );
  const notifications = (
    <Section title={d.settings.notifications} icon="bell" card>
      <ListRow icon="message-circle" title={d.settings.notifMessages} right={<Switch value={notif.messages} onValueChange={(v) => setNotif((n) => ({ ...n, messages: v }))} />} />
      <ListRow icon="calendar" title={d.settings.notifEvents} right={<Switch value={notif.events} onValueChange={(v) => setNotif((n) => ({ ...n, events: v }))} />} />
      <ListRow icon="gift" title={d.settings.notifBirthdays} right={<Switch value={notif.birthdays} onValueChange={(v) => setNotif((n) => ({ ...n, birthdays: v }))} />} last />
    </Section>
  );
  const privacy = (
    <Section title={d.settings.privacy} icon="eye" hint={d.settings.privacyHint} card>
      <ListRow icon="mail" title={d.settings.showEmail} right={<Switch value={me.privacy.showEmail} onValueChange={(v) => actions.updatePrivacy({ showEmail: v })} />} />
      <ListRow icon="phone" title={d.settings.showPhone} right={<Switch value={me.privacy.showPhone} onValueChange={(v) => actions.updatePrivacy({ showPhone: v })} />} />
      <ListRow icon="gift" title={d.settings.showBirthday} right={<Switch value={me.privacy.showBirthday} onValueChange={(v) => actions.updatePrivacy({ showBirthday: v })} />} last />
    </Section>
  );
  const security = (
    <Section title={d.settings.security} icon="shield" card>
      <ListRow icon="smartphone" title={d.settings.sessions} subtitle={d.settings.thisDevice} />
      <ListRow icon="log-out" title={d.settings.signOutAll} onPress={() => toast(d.common.done)} />
      <ListRow icon="lock" title={d.auth.password} onPress={() => router.push('/profil/modifier')} last />
    </Section>
  );

  return (
    <Screen maxWidth={1040}>
      <PageHeader title={d.settings.title} subtitle={d.settings.subtitle} />

      <Section title={d.settings.appearance} icon="droplet" hint={d.settings.appearanceHint}>
        <Grid min={isMobile ? 96 : 150} gap={isMobile ? 8 : 12} max={3}>
          {themes.map((t) => {
            const active = preference === t.value;
            return (
              <Tap
                key={t.value}
                onPress={() => setPreference(t.value)}
                accessibilityRole="radio"
                accessibilityState={{ checked: active }}
                style={{ borderRadius: radius.hero, borderWidth: 2, borderColor: active ? colors.primary : colors.border, padding: isMobile ? 6 : 10, gap: 10, backgroundColor: colors.surface, height: '100%' }}
                hoverStyle={!active && { borderColor: colors.borderStrong }}>
                <ThemePreview mode={t.value} />
                <Row gap={8} style={{ paddingHorizontal: 4, paddingBottom: 2 }}>
                  {!isMobile && <Feather name={t.icon} size={15} color={active ? colors.primary : colors.textMuted} />}
                  <Txt variant="bodyStrong" numberOfLines={1} style={{ flex: 1, fontSize: isMobile ? 13 : 15, color: active ? colors.primary : colors.text }}>{t.label}</Txt>
                  {active && <Feather name="check-circle" size={16} color={colors.primary} />}
                </Row>
              </Tap>
            );
          })}
        </Grid>
      </Section>

      <Section title={d.settings.language} icon="globe" hint={d.settings.languageMore}>
        <Grid min={isMobile ? 140 : 200} gap={12} max={2}>
          {LANGUAGES.map((l) => {
            const active = lang === l.code;
            return (
              <Tap
                key={l.code}
                onPress={() => setLang(l.code)}
                accessibilityRole="radio"
                accessibilityState={{ checked: active }}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: isMobile ? 14 : 16, borderRadius: radius.card, borderWidth: 2, borderColor: active ? colors.primary : colors.border, backgroundColor: colors.surface }}
                hoverStyle={!active && { borderColor: colors.borderStrong }}>
                <Flag code={l.country} size={20} />
                <Txt variant="bodyStrong" style={{ flex: 1 }}>{l.label}</Txt>
                <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: active ? colors.primary : colors.borderStrong, alignItems: 'center', justifyContent: 'center' }}>
                  {active && <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary }} />}
                </View>
              </Tap>
            );
          })}
        </Grid>
      </Section>

      {/* Two independent stacks, so short cards never leave a gap beside tall ones. */}
      {isMobile ? (
        <View style={{ gap: 16 }}>
          {account}
          {notifications}
          {privacy}
          {security}
        </View>
      ) : (
        <View style={{ flexDirection: 'row', gap: 16, alignItems: 'flex-start' }}>
          <View style={{ flex: 1, gap: 16 }}>
            {account}
            {privacy}
          </View>
          <View style={{ flex: 1, gap: 16 }}>
            {notifications}
            {security}
          </View>
        </View>
      )}

      <Section title={d.settings.danger} icon="alert-triangle" card danger>
        <ListRow icon="log-out" title={d.common.signOut} onPress={actions.signOut} />
        {!isRemote && <ListRow icon="refresh-ccw" title={d.settings.resetDemo} subtitle={d.common.demo} onPress={async () => (await confirm({ title: d.settings.resetDemo, danger: true })) && actions.resetDemo()} />}
        <ListRow
          icon="trash-2"
          title={d.settings.deleteAccount}
          subtitle={d.settings.deleteAccountHint}
          danger
          last
          onPress={async () => {
            if (await confirm({ title: d.settings.deleteAccount, message: d.settings.deleteAccountHint, danger: true, confirmLabel: d.common.delete })) {
              const r = await actions.deleteMyAccount();
              if (!r.ok) toast(d.auth.errors.unknown, 'danger');
            }
          }}
        />
      </Section>
    </Screen>
  );
}

function Section({ title, icon, hint, children, card, danger }: { title: string; icon: IconName; hint?: string; children: ReactNode; card?: boolean; danger?: boolean }) {
  const { colors } = useTheme();
  const header = (
    <View style={{ gap: 4, marginBottom: card ? 4 : 14 }}>
      <Row gap={8}>
        <Feather name={icon} size={15} color={danger ? colors.danger : colors.secondary} />
        <Txt variant="caption" style={{ color: danger ? colors.danger : colors.textSubtle }}>{title}</Txt>
      </Row>
      {hint && <Txt variant="small" color="textMuted">{hint}</Txt>}
    </View>
  );
  if (card) {
    return (
      <Card style={danger && { borderColor: colors.danger, borderStyle: 'dashed' }}>
        {header}
        {children}
      </Card>
    );
  }
  return (
    <View>
      {header}
      {children}
    </View>
  );
}

/** Miniature of the app in the given theme: navy rail, tinted background, hero panel and two cards. */
function ThemePreview({ mode }: { mode: ThemePreference }) {
  const halves = mode === 'system' ? [palettes.light, palettes.dark] : [palettes[mode]];
  return (
    <View style={{ height: 92, borderRadius: radius.card, overflow: 'hidden', flexDirection: 'row' }}>
      {halves.map((p, i) => (
        <View key={i} style={{ flex: 1, backgroundColor: p.bg, flexDirection: 'row' }}>
          {i === 0 && (
            <View style={{ width: 18, backgroundColor: brand.navy, alignItems: 'center', paddingTop: 8, gap: 5 }}>
              <View style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: '#000' }} />
              <View style={{ width: 9, height: 3, borderRadius: 2, backgroundColor: brand.red }} />
              <View style={{ width: 9, height: 3, borderRadius: 2, backgroundColor: 'rgba(200,211,229,0.5)' }} />
              <View style={{ width: 9, height: 3, borderRadius: 2, backgroundColor: 'rgba(200,211,229,0.5)' }} />
            </View>
          )}
          <View style={{ flex: 1, gap: 5, padding: 7 }}>
            <View style={{ height: 30, borderRadius: 5, backgroundColor: brand.navy, justifyContent: 'center', paddingLeft: 6 }}>
              <View style={{ width: '40%', height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.8)' }} />
            </View>
            <View style={{ flexDirection: 'row', gap: 5, flex: 1 }}>
              <View style={{ flex: 1, borderRadius: 4, backgroundColor: p.surface, borderWidth: 1, borderColor: p.border }} />
              <View style={{ flex: 1, borderRadius: 4, backgroundColor: p.surface, borderWidth: 1, borderColor: p.border }} />
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}
