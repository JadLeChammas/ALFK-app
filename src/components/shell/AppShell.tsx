import { Feather } from '@expo/vector-icons';
import { router, usePathname } from 'expo-router';
import { useEffect, useState, type ReactNode } from 'react';
import { Platform, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { fullName, useInbox, useMe, useStore, useUnreadNotifications } from '@/data/store';
import { useI18n } from '@/i18n';
import { useLayout } from '@/theme/layout';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts, radius } from '@/theme/tokens';
import { LogoLockup, LogoMark } from '../ui/Logo';
import { Avatar, CountBadge, IconButton, Tap, type IconName } from '../ui/primitives';
import { Txt } from '../ui/Txt';
import { GlobalSearch } from './GlobalSearch';

type NavItem = { href: string; icon: IconName; label: string; badge?: number; match?: string[] };

function isActive(pathname: string, item: NavItem) {
  if (item.href === '/') return pathname === '/';
  return [item.href, ...(item.match ?? [])].some((p) => pathname === p || pathname.startsWith(p + '/'));
}

function useNav() {
  const { d } = useI18n();
  const { unread } = useInbox();
  const main: NavItem[] = [
    { href: '/', icon: 'home', label: d.nav.home },
    { href: '/annuaire', icon: 'users', label: d.nav.directory, match: ['/membre'] },
    { href: '/repere', icon: 'globe', label: d.nav.repere },
    { href: '/evenements', icon: 'calendar', label: d.nav.events },
    { href: '/publications', icon: 'book-open', label: d.nav.publications },
    { href: '/messages', icon: 'message-circle', label: d.nav.messages, badge: unread },
    { href: '/profil', icon: 'user', label: d.nav.profile },
  ];
  return main;
}

export function AppShell({ children }: { children: ReactNode }) {
  const { colors } = useTheme();
  const { isDesktop, isMobile } = useLayout();
  const pathname = usePathname();
  const [searchOpen, setSearchOpen] = useState(false);

  // ⌘K / Ctrl+K opens global search on web.
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const immersive = isMobile && /^\/messages\/[^/]+$/.test(pathname);

  return (
    <View style={{ flex: 1, flexDirection: 'row', backgroundColor: colors.bg }}>
      {!isMobile && <Sidebar compact={!isDesktop} />}
      <View style={{ flex: 1, minWidth: 0 }}>
        {!immersive && (isMobile ? <MobileTopBar onSearch={() => setSearchOpen(true)} /> : <TopBar onSearch={() => setSearchOpen(true)} />)}
        <View style={{ flex: 1 }}>{children}</View>
        {isMobile && !immersive && <BottomNav />}
      </View>
      <GlobalSearch visible={searchOpen} onClose={() => setSearchOpen(false)} />
    </View>
  );
}

function Sidebar({ compact }: { compact: boolean }) {
  const { colors } = useTheme();
  const { d } = useI18n();
  const me = useMe();
  const { db } = useStore();
  const pathname = usePathname();
  const nav = useNav();
  const notif = useUnreadNotifications();
  const pending = db.users.filter((u) => !u.approved).length;
  const bottom: NavItem[] = [
    { href: '/parametres', icon: 'settings', label: d.nav.settings },
    { href: '/notifications', icon: 'bell', label: d.nav.notifications, badge: notif },
  ];

  return (
    <View
      style={{
        width: compact ? 76 : 248,
        backgroundColor: colors.surface,
        borderRightWidth: 1,
        borderRightColor: colors.border,
        paddingVertical: 20,
        paddingHorizontal: compact ? 12 : 16,
        ...(Platform.OS === 'web' ? ({ height: '100vh', position: 'sticky', top: 0 } as object) : {}),
      }}>
      <Tap onPress={() => router.push('/')} style={{ paddingHorizontal: compact ? 5 : 8, marginBottom: 28 }}>
        {compact ? <LogoMark size={40} /> : <LogoLockup />}
      </Tap>
      <View style={{ gap: 4 }}>
        {nav.map((item) => (
          <SideLink key={item.href} item={item} active={isActive(pathname, item)} compact={compact} />
        ))}
      </View>
      {me.role === 'admin' && (
        <View style={{ marginTop: 20, gap: 4 }}>
          {!compact && <Txt variant="caption" style={{ paddingHorizontal: 12, marginBottom: 6 }}>{d.nav.admin}</Txt>}
          <SideLink item={{ href: '/admin', icon: 'shield', label: d.nav.dashboard, badge: pending }} active={isActive(pathname, { href: '/admin', icon: 'shield', label: '' })} compact={compact} />
        </View>
      )}
      <View style={{ flex: 1 }} />
      <View style={{ gap: 4, marginBottom: 14 }}>
        {bottom.map((item) => (
          <SideLink key={item.href} item={item} active={isActive(pathname, item)} compact={compact} />
        ))}
      </View>
      <Tap
        onPress={() => router.push('/profil')}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: compact ? 6 : 10, borderRadius: 16, borderWidth: 1, borderColor: colors.border, justifyContent: compact ? 'center' : 'flex-start' }}
        hoverStyle={{ backgroundColor: colors.surfaceAlt }}>
        <Avatar uri={me.avatar} name={fullName(me)} size={36} />
        {!compact && (
          <>
            <View style={{ flex: 1 }}>
              <Txt variant="smallStrong" numberOfLines={1}>{fullName(me)}</Txt>
              <Txt variant="small" color="textSubtle" numberOfLines={1}>{d.roles[me.role]}</Txt>
            </View>
            <Feather name="chevron-right" size={16} color={colors.textSubtle} />
          </>
        )}
      </Tap>
    </View>
  );
}

function SideLink({ item, active, compact }: { item: NavItem; active: boolean; compact: boolean }) {
  const { colors } = useTheme();
  return (
    <Tap
      onPress={() => router.push(item.href as never)}
      accessibilityLabel={item.label}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        height: 44,
        paddingHorizontal: compact ? 0 : 12,
        justifyContent: compact ? 'center' : 'flex-start',
        borderRadius: 14,
        backgroundColor: active ? colors.primarySoft : 'transparent',
      }}
      hoverStyle={!active && { backgroundColor: colors.surfaceAlt }}>
      <View>
        <Feather name={item.icon} size={19} color={active ? colors.primary : colors.textMuted} />
        {compact && !!item.badge && <CountBadge n={item.badge} style={{ position: 'absolute', top: -8, right: -10 }} />}
      </View>
      {!compact && (
        <>
          <Txt variant="bodyStrong" style={{ flex: 1, color: active ? colors.primary : colors.text, fontSize: 14 }}>{item.label}</Txt>
          {!!item.badge && <CountBadge n={item.badge} style={{ borderColor: 'transparent' }} />}
        </>
      )}
    </Tap>
  );
}

function TopBar({ onSearch }: { onSearch: () => void }) {
  const { colors } = useTheme();
  const { d } = useI18n();
  const me = useMe();
  const notif = useUnreadNotifications();
  return (
    <View style={{ height: 72, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', paddingHorizontal: 36, gap: 12, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.bg }}>
      <Tap
        onPress={onSearch}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 10, height: 42, width: 380, maxWidth: '60%', paddingHorizontal: 16, borderRadius: radius.pill, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }}
        hoverStyle={{ borderColor: colors.borderStrong }}>
        <Feather name="search" size={16} color={colors.textSubtle} />
        <Txt variant="small" color="textSubtle" numberOfLines={1} style={{ flex: 1 }}>{d.search.placeholder}</Txt>
        {Platform.OS === 'web' && (
          <View style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, borderWidth: 1, borderColor: colors.border }}>
            <Txt style={{ fontFamily: fonts.semibold, fontSize: 10, color: colors.textSubtle }}>Ctrl K</Txt>
          </View>
        )}
      </Tap>
      <IconButton icon="bell" badge={notif} onPress={() => router.push('/notifications')} label={d.nav.notifications} />
      <Tap onPress={() => router.push('/profil')}>
        <Avatar uri={me.avatar} name={fullName(me)} size={40} />
      </Tap>
    </View>
  );
}

function MobileTopBar({ onSearch }: { onSearch: () => void }) {
  const { colors } = useTheme();
  const { d } = useI18n();
  const insets = useSafeAreaInsets();
  const notif = useUnreadNotifications();
  return (
    <View style={{ paddingTop: insets.top + 8, paddingBottom: 8, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.bg, borderBottomWidth: 1, borderBottomColor: colors.border }}>
      <Tap onPress={() => router.push('/')} style={{ flex: 1 }}>
        <LogoLockup compact />
      </Tap>
      <IconButton icon="search" onPress={onSearch} size={38} label={d.common.search} />
      <IconButton icon="bell" badge={notif} onPress={() => router.push('/notifications')} size={38} label={d.nav.notifications} />
      <IconButton icon="settings" onPress={() => router.push('/parametres')} size={38} label={d.nav.settings} />
    </View>
  );
}

function BottomNav() {
  const { colors } = useTheme();
  const { d } = useI18n();
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const { unread } = useInbox();
  const items: NavItem[] = [
    { href: '/', icon: 'home', label: d.nav.home },
    { href: '/annuaire', icon: 'users', label: d.nav.directory, match: ['/membre'] },
    { href: '/evenements', icon: 'calendar', label: d.nav.events },
    { href: '/messages', icon: 'message-circle', label: d.nav.messages, badge: unread },
    { href: '/profil', icon: 'user', label: d.nav.profileShort, match: ['/parametres', '/admin', '/repere', '/publications', '/notifications'] },
  ];
  return (
    <View style={{ flexDirection: 'row', backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border, paddingBottom: Math.max(insets.bottom, 8), paddingTop: 8 }}>
      {items.map((item) => {
        const active = isActive(pathname, item);
        return (
          <Tap key={item.href} onPress={() => router.navigate(item.href as never)} style={{ flex: 1, alignItems: 'center', gap: 4 }} accessibilityLabel={item.label}>
            <View style={{ width: 52, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: active ? colors.primarySoft : 'transparent' }}>
              <Feather name={item.icon} size={20} color={active ? colors.primary : colors.textMuted} />
              {!!item.badge && <CountBadge n={item.badge} style={{ position: 'absolute', top: -4, right: 4 }} />}
            </View>
            <Txt style={{ fontFamily: active ? fonts.bold : fonts.medium, fontSize: 11, color: active ? colors.primary : colors.textMuted }}>{item.label}</Txt>
          </Tap>
        );
      })}
    </View>
  );
}
