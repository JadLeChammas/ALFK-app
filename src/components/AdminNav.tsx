import { router, usePathname } from 'expo-router';
import { ScrollView } from 'react-native';

import { useStore } from '@/data/store';
import { useI18n } from '@/i18n';
import { Chip, type IconName } from './ui/primitives';

export function AdminNav() {
  const { d } = useI18n();
  const { db } = useStore();
  const pathname = usePathname();
  const pending = db.users.filter((u) => !u.approved).length;
  const reports = db.conversations.filter((c) => c.report && !c.report.resolved).length;
  const unread = db.contacts.filter((c) => !c.read).length;
  const tabs: { href: string; label: string; icon: IconName; count?: number }[] = [
    { href: '/admin', label: d.nav.dashboard, icon: 'bar-chart-2' },
    { href: '/admin/approbations', label: d.nav.approvals, icon: 'user-check', count: pending || undefined },
    { href: '/admin/membres', label: d.nav.members, icon: 'users' },
    { href: '/admin/contenus', label: d.nav.content, icon: 'layers', count: reports || undefined },
    { href: '/admin/contact', label: d.nav.contact, icon: 'inbox', count: unread || undefined },
    { href: '/admin/journal', label: d.nav.logs, icon: 'list' },
    { href: '/admin/guides', label: d.guide.adminNav, icon: 'map' },
    { href: '/admin/generique', label: d.credits.nav, icon: 'film' },
  ];
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
      {tabs.map((t) => (
        <Chip key={t.href} label={t.label} icon={t.icon} count={t.count} active={pathname === t.href} onPress={() => router.replace(t.href as never)} />
      ))}
    </ScrollView>
  );
}
