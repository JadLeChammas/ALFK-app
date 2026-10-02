import { Feather } from '@expo/vector-icons';
import { router, usePathname } from 'expo-router';
import { useEffect, useState, type ReactNode } from 'react';
import { Modal, Platform, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { can } from '@/data/permissions';
import { fullName, useInbox, useMe, useStore, useUnreadNotifications } from '@/data/store';
import { useI18n } from '@/i18n';
import { useLayout } from '@/theme/layout';
import { useTheme } from '@/theme/ThemeProvider';
import { brand, fonts, radius } from '@/theme/tokens';
import { useRetroTaps } from '@/lib/retro';
import { LogoMark } from '../ui/Logo';
import { Avatar, CountBadge, IconButton, Tap, type IconName } from '../ui/primitives';
import { Txt } from '../ui/Txt';
import { GlobalSearch } from './GlobalSearch';

type NavItem = { href: string; icon: IconName; label: string; short?: string; badge?: number; match?: string[] };

function isActive(pathname: string, item: NavItem) {
  if (item.href === '/') return pathname === '/';
  return [item.href, ...(item.match ?? [])].some((p) => pathname === p || pathname.startsWith(p + '/'));
}

function useNav() {
  const { d } = useI18n();
  const { unread } = useInbox();
  const { db } = useStore();
  const me = useMe();
  const toReview = me.role === 'admin' ? db.publications.filter((p) => p.status === 'pending').length : 0;
  // Same sections in the desktop sidebar and the phone bottom bar (+ "Plus" sheet). "Mon profil" is the
  // user card at the bottom of the sidebar, and the avatar in the phone top bar.
  const home: NavItem = { href: '/', icon: 'home', label: d.nav.home };
  const directory: NavItem = { href: '/annuaire', icon: 'users', label: d.nav.directory, match: ['/membre'] };
  const repere: NavItem = { href: '/repere', icon: 'globe', label: d.nav.repere };
  const orientation: NavItem = { href: '/orientation', icon: 'compass', label: d.nav.orientation };
  const calendar: NavItem = { href: '/calendrier', icon: 'calendar', label: d.nav.calendar };
  const questionsToReview = me.role === 'admin' ? db.questions.filter((q) => q.status === 'pending').length : 0;
  const guide: NavItem = { href: '/guide', icon: 'map', label: d.nav.guide };
  const questions: NavItem = { href: '/questions', icon: 'help-circle', label: d.nav.questions, badge: questionsToReview };
  const events: NavItem[] = can(me, 'viewEvents') ? [{ href: '/evenements', icon: 'star', label: d.nav.events }] : [];
  const publications: NavItem = { href: '/publications', icon: 'book-open', label: d.nav.publications, short: d.nav.publicationsShort, badge: toReview };
  const messages: NavItem = { href: '/messages', icon: 'message-circle', label: d.nav.messages, badge: unread };
  const community: NavItem[] = [{ href: '/whatsapp', icon: 'message-square', label: d.nav.whatsapp }];
  // The Amicale's own pages (also public), opened inside the member space.
  const amicale: NavItem[] = [
    { href: '/association', icon: 'heart', label: d.site.nav.association },
    { href: '/histoire', icon: 'book', label: d.site.nav.lfk },
    { href: '/bureau', icon: 'users', label: d.site.nav.bureau },
    { href: '/partenaires', icon: 'award', label: d.nav.honorary },
  ];
  return {
    main: [home, directory, repere, orientation, guide, questions, calendar, ...events, publications, messages],
    community,
    amicale,
    bar: [home, directory, repere, publications, messages],
    more: [...events, orientation, guide, questions, calendar, ...community, ...amicale],
  };
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

/** Navy brand rail: sky labels, white + red indicator for the active section. */
const RAIL = { text: brand.sky, active: '#FFFFFF', activeBg: 'rgba(102,128,174,0.28)', hover: 'rgba(200,211,229,0.08)', rule: 'rgba(200,211,229,0.14)' };

function Sidebar({ compact }: { compact: boolean }) {
  const logoTap = useRetroTaps(() => router.push('/'));
  const { colors, scheme } = useTheme();
  const { d } = useI18n();
  const me = useMe();
  const { db } = useStore();
  const pathname = usePathname();
  const { main, community, amicale } = useNav();
  const notif = useUnreadNotifications();
  const pending = db.users.filter((u) => !u.approved).length;
  const bottom: NavItem[] = [
    { href: '/parametres', icon: 'settings', label: d.nav.settings },
    { href: '/notifications', icon: 'bell', label: d.nav.notifications, badge: notif },
  ];
  const section = (label: string) => !compact && <Txt style={{ fontFamily: fonts.medium, fontSize: 10, letterSpacing: 1.6, textTransform: 'uppercase', color: 'rgba(200,211,229,0.55)', paddingHorizontal: 12, marginBottom: 6 }}>{label}</Txt>;

  return (
    <View
      style={{
        width: compact ? 76 : 248,
        backgroundColor: colors.rail,
        borderRightWidth: 1,
        borderRightColor: scheme === 'dark' ? colors.border : 'transparent',
        paddingVertical: 20,
        paddingHorizontal: compact ? 12 : 14,
        ...(Platform.OS === 'web' ? ({ height: '100vh', position: 'sticky', top: 0 } as object) : {}),
      }}>
      <Tap onPress={logoTap} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: compact ? 5 : 8, marginBottom: 16 }}>
        <LogoMark size={compact ? 40 : 34} />
        {!compact && (
          <View>
            <Txt style={{ fontFamily: fonts.serif, fontSize: 22, lineHeight: 24, color: '#fff' }}>{d.app.name}</Txt>
            <Txt style={{ fontFamily: fonts.medium, fontSize: 9, letterSpacing: 1.6, color: RAIL.text }}>ALFK · KOWEÏT</Txt>
          </View>
        )}
      </Tap>
      <ScrollView style={{ flex: 1, marginHorizontal: -4 }} contentContainerStyle={{ paddingHorizontal: 4 }} showsVerticalScrollIndicator={false}>
      <View style={{ gap: 2 }}>
        {main.map((item) => (
          <SideLink key={item.href} item={item} active={isActive(pathname, item)} compact={compact} />
        ))}
      </View>
      <View style={{ marginTop: 12, gap: 2 }}>
        {section(d.nav.community)}
        {[...community, ...amicale].map((item) => (
          <SideLink key={item.href} item={item} active={isActive(pathname, item)} compact={compact} />
        ))}
      </View>

      {me.role === 'admin' && (
        <View style={{ marginTop: 12, gap: 2 }}>
          {section(d.nav.admin)}
          <SideLink item={{ href: '/admin', icon: 'shield', label: d.nav.dashboard, badge: pending }} active={isActive(pathname, { href: '/admin', icon: 'shield', label: '' })} compact={compact} />
        </View>
      )}
      {me.role !== 'admin' && can(me, 'viewStats') && (
        <View style={{ marginTop: 12, gap: 2 }}>
          {section(d.nav.leadership)}
          <SideLink item={{ href: '/statistiques', icon: 'bar-chart-2', label: d.nav.stats }} active={isActive(pathname, { href: '/statistiques', icon: 'bar-chart-2', label: '' })} compact={compact} />
        </View>
      )}
      </ScrollView>
      <View style={{ gap: 2, marginBottom: 10, marginTop: 8 }}>
        {bottom.map((item) => (
          <SideLink key={item.href} item={item} active={isActive(pathname, item)} compact={compact} />
        ))}
      </View>
      <Tap
        onPress={() => router.push('/profil')}
        accessibilityLabel={d.nav.profile}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: compact ? 6 : 10, borderRadius: radius.card, borderWidth: 1, borderColor: pathname.startsWith('/profil') ? brand.red : RAIL.rule, backgroundColor: pathname.startsWith('/profil') ? RAIL.activeBg : 'transparent', justifyContent: compact ? 'center' : 'flex-start' }}
        hoverStyle={{ backgroundColor: RAIL.hover }}>
        <Avatar uri={me.avatar} name={fullName(me)} size={36} />
        {!compact && (
          <>
            <View style={{ flex: 1 }}>
              <Txt variant="smallStrong" numberOfLines={1} style={{ color: '#fff' }}>{fullName(me)}</Txt>
              <Txt variant="small" numberOfLines={1} style={{ color: RAIL.text }}>{me.fonction ?? d.roles[me.role]}</Txt>
            </View>
            <Feather name="chevron-right" size={16} color={RAIL.text} />
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
        height: 35,
        paddingHorizontal: compact ? 0 : 12,
        justifyContent: compact ? 'center' : 'flex-start',
        borderRadius: radius.input,
        backgroundColor: active ? RAIL.activeBg : 'transparent',
      }}
      hoverStyle={!active && { backgroundColor: RAIL.hover }}>
      {active && <View style={{ position: 'absolute', left: compact ? 4 : 0, top: 9, bottom: 9, width: 3, borderRadius: 2, backgroundColor: brand.red }} />}
      <View>
        <Feather name={item.icon} size={18} color={active ? '#fff' : RAIL.text} />
        {compact && !!item.badge && <CountBadge n={item.badge} style={{ position: 'absolute', top: -8, right: -10, borderColor: colors.rail }} />}
      </View>
      {!compact && (
        <>
          <Txt style={{ flex: 1, fontFamily: active ? fonts.semibold : fonts.medium, fontSize: 14, color: active ? RAIL.active : RAIL.text }}>{item.label}</Txt>
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
    <View style={{ height: 64, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', paddingHorizontal: 36, gap: 12, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.bg }}>
      <Tap
        onPress={onSearch}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 10, height: 40, width: 380, maxWidth: '60%', paddingHorizontal: 14, borderRadius: radius.input, backgroundColor: colors.surfaceAlt, borderWidth: 1, borderColor: colors.border }}
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
  const logoTap = useRetroTaps(() => router.push('/'));
  const { colors } = useTheme();
  const { d } = useI18n();
  const insets = useSafeAreaInsets();
  const notif = useUnreadNotifications();
  const me = useMe();
  const pathname = usePathname();
  const onProfile = pathname.startsWith('/profil');
  return (
    <View style={{ paddingTop: insets.top + 8, paddingBottom: 8, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.rail }}>
      <Tap onPress={logoTap} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <LogoMark size={30} />
        <Txt style={{ fontFamily: fonts.serif, fontSize: 21, lineHeight: 24, color: '#fff' }}>{d.app.name}</Txt>
      </Tap>
      <IconButton icon="search" onPress={onSearch} size={38} variant="ghost" color="#fff" label={d.common.search} />
      <IconButton icon="bell" badge={notif} onPress={() => router.push('/notifications')} size={38} variant="ghost" color="#fff" label={d.nav.notifications} />
      <Tap onPress={() => router.push('/profil')} accessibilityLabel={d.nav.profile} style={{ borderRadius: 21, borderWidth: 2, borderColor: onProfile ? brand.red : 'transparent' }}>
        <Avatar uri={me.avatar} name={fullName(me)} size={34} />
      </Tap>
    </View>
  );
}

function BottomNav() {
  const { colors, scheme } = useTheme();
  const { d } = useI18n();
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const { bar, more } = useNav();
  const [open, setOpen] = useState(false);
  const moreItem: NavItem = { href: '#more', icon: 'grid', label: d.nav.more, match: more.map((m) => m.href) };
  const tab = (item: NavItem, active: boolean, onPress: () => void) => (
    <Tap key={item.href} onPress={onPress} style={{ flex: 1, minWidth: 0, alignItems: 'center', gap: 4 }} accessibilityLabel={item.label}>
      <View style={{ width: 44, height: 28, borderRadius: radius.input, alignItems: 'center', justifyContent: 'center', backgroundColor: active ? brand.red : 'transparent' }}>
        <Feather name={item.icon} size={19} color={active ? '#FFFFFF' : brand.sky} />
        {!!item.badge && <CountBadge n={item.badge} style={{ position: 'absolute', top: -4, right: 4, borderColor: colors.rail }} />}
      </View>
      <Txt numberOfLines={1} style={{ fontFamily: active ? fonts.bold : fonts.medium, fontSize: 10, letterSpacing: -0.1, color: active ? '#FFFFFF' : brand.sky }}>{item.short ?? item.label}</Txt>
    </Tap>
  );
  return (
    <View style={{ flexDirection: 'row', backgroundColor: colors.rail, paddingBottom: Math.max(insets.bottom, 8), paddingTop: 8, borderTopWidth: 1, borderTopColor: scheme === 'dark' ? colors.border : 'transparent' }}>
      {bar.map((item) => tab(item, isActive(pathname, item), () => router.navigate(item.href as never)))}
      {tab(moreItem, open || more.some((m) => isActive(pathname, m)), () => setOpen(true))}
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable onPress={() => setOpen(false)} style={{ flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' }}>
          <Pressable onPress={() => {}} style={{ backgroundColor: colors.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingTop: 10, paddingHorizontal: 16, paddingBottom: Math.max(insets.bottom, 16) + 8, gap: 6 }}>
            <View style={{ alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, marginBottom: 10 }} />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              {more.map((item) => {
                const active = isActive(pathname, item);
                return (
                  <Tap
                    key={item.href}
                    onPress={() => {
                      setOpen(false);
                      router.navigate(item.href as never);
                    }}
                    style={{ flexBasis: '30%', flexGrow: 1, alignItems: 'center', gap: 8, paddingVertical: 16, borderRadius: 18, backgroundColor: active ? colors.primarySoft : colors.surfaceAlt }}>
                    <Feather name={item.icon} size={22} color={active ? colors.primary : colors.text} />
                    <Txt variant="smallStrong" numberOfLines={1} style={{ color: active ? colors.primary : colors.text }}>{item.label}</Txt>
                  </Tap>
                );
              })}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
