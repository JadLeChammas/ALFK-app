import { LinearGradient } from 'expo-linear-gradient';
import { router, usePathname } from 'expo-router';
import { useRef } from 'react';
import { ScrollView, View } from 'react-native';

import { useStore } from '@/data/store';
import { useI18n } from '@/i18n';
import { useLayout } from '@/theme/layout';
import { useTheme } from '@/theme/ThemeProvider';
import { Chip, type IconName } from './ui/primitives';
import { awaitsApproval } from '@/data/members';

export function AdminNav() {
  const { d } = useI18n();
  const { db } = useStore();
  const pathname = usePathname();
  const { isMobile } = useLayout();
  const { colors } = useTheme();
  const scroller = useRef<ScrollView>(null);
  const pending = db.users.filter(awaitsApproval).length;
  const reports = db.conversations.filter((c) => c.report && !c.report.resolved).length;
  const unread = db.contacts.filter((c) => !c.read).length;
  const tabs: { href: string; label: string; icon: IconName; count?: number }[] = [
    { href: '/admin', label: d.nav.dashboard, icon: 'bar-chart-2' },
    { href: '/admin/approbations', label: d.nav.approvals, icon: 'user-check', count: pending || undefined },
    { href: '/admin/membres', label: d.nav.members, icon: 'users' },
    { href: '/admin/honneur', label: d.honoraryAdmin.nav, icon: 'award' },
    { href: '/admin/contenus', label: d.nav.content, icon: 'layers', count: reports || undefined },
    { href: '/admin/contact', label: d.nav.contact, icon: 'inbox', count: unread || undefined },
    { href: '/admin/urgent', label: d.urgent.nav, icon: 'alert-triangle' },
    { href: '/admin/emails', label: d.emails.nav, icon: 'mail' },
    { href: '/admin/partenaires', label: d.adminPartners.nav, icon: 'eye' },
    { href: '/admin/whatsapp', label: d.adminWhatsapp.nav, icon: 'message-square' },
    { href: '/admin/journal', label: d.nav.logs, icon: 'list' },
    { href: '/admin/guides', label: d.guide.adminNav, icon: 'map' },
    { href: '/admin/histoire', label: d.site.nav.lfk, icon: 'book' },
    { href: '/admin/generique', label: d.credits.nav, icon: 'film' },
  ];
  const active = tabs.find((t) => t.href === pathname);
  const chip = (t: (typeof tabs)[number]) => (
    <Chip label={t.label} icon={t.icon} count={t.count} active={t === active} onPress={() => router.replace(t.href as never)} />
  );

  // Wide screens: every tab visible, wrapping if needed.
  if (!isMobile) {
    return (
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {tabs.map((t) => (
          <View key={t.href}>{chip(t)}</View>
        ))}
      </View>
    );
  }
  // Phones: one swipeable line that opens on the current tab, with a fade showing there is more.
  return (
    <View>
      <ScrollView ref={scroller} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingRight: 40 }}>
        {tabs.map((t) => (
          <View
            key={t.href}
            onLayout={
              t === active
                ? (e) => {
                    const x = e.nativeEvent.layout.x;
                    scroller.current?.scrollTo({ x: Math.max(0, x - 24), animated: false });
                  }
                : undefined
            }>
            {chip(t)}
          </View>
        ))}
      </ScrollView>
      <LinearGradient colors={[`${colors.bg}00`, colors.bg]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} pointerEvents="none" style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 40 }} />
    </View>
  );
}
