import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Modal, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { COUNTRIES, countrySearchText } from '@/data/countries';
import { can } from '@/data/permissions';
import { fullName, useApprovedMembers, useStore } from '@/data/store';
import { useI18n } from '@/i18n';
import { useLayout } from '@/theme/layout';
import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';
import { eggs, legendQuery, searchEgg } from '@/lib/eggs';
import { LegendCard } from '../EasterEggs';
import { Avatar, SearchBar, Tap, type IconName } from '../ui/primitives';
import { Flag } from '../ui/Flag';
import { Txt } from '../ui/Txt';

export const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export function GlobalSearch({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { colors } = useTheme();
  const { d, f, formatDate, country } = useI18n();
  const { db, me } = useStore();
  const members = useApprovedMembers();
  const { isMobile } = useLayout();
  const insets = useSafeAreaInsets();
  const [q, setQ] = useState('');
  // Closed however it was (Close, tap outside, Escape, a result): it opens empty next time.
  const close = () => {
    setQ('');
    onClose();
  };

  const results = useMemo(() => {
    const n = norm(q.trim());
    if (n.length < 2) return null;
    const m = members
      .filter((u) => norm(`${fullName(u)} ${u.school ?? ''} ${(u.otherSchools ?? []).map((s) => s.name).join(' ')} ${u.employer ?? ''} ${u.jobTitle ?? ''} ${u.promo ?? ''} ${u.city ?? ''}`).includes(n))
      .slice(0, 6);
    const years = [...new Set(members.map((u) => u.promo).filter(Boolean) as number[])].sort((a, b) => b - a);
    const promos = years.filter((y) => String(y).includes(n) || norm(f(d.common.promo, { year: y })).includes(n)).slice(0, 4);
    const countries = COUNTRIES.filter((c) => norm(countrySearchText(c.code)).includes(n)).slice(0, 4);
    const events = can(me, 'viewEvents') ? db.events.filter((e) => norm(`${e.title} ${e.location}`).includes(n)).slice(0, 4) : [];
    const pubs = db.publications.filter((p) => p.status === 'published').filter((p) => norm(`${p.title} ${p.excerpt}`).includes(n)).slice(0, 4);
    return { m, promos, countries, events, pubs };
  }, [q, members, db.events, db.publications, d, f, me]);

  // Easter eggs: mode words, and the legends' cards.
  useEffect(() => {
    const egg = searchEgg(q);
    if (egg) eggs.emit(egg);
  }, [q]);
  const legend = legendQuery(q);

  const go = (href: string) => {
    close();
    router.push(href as never);
  };

  const count = results ? results.m.length + results.promos.length + results.countries.length + results.events.length + results.pubs.length : 0;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
      <Pressable onPress={close} style={{ flex: 1, backgroundColor: colors.overlay, alignItems: 'center', paddingTop: isMobile ? insets.top + 8 : 90, paddingHorizontal: isMobile ? 8 : 16 }}>
        <Pressable
          onPress={() => {}}
          style={{ width: '100%', maxWidth: 640, maxHeight: isMobile ? '92%' : '75%', backgroundColor: colors.surface, borderRadius: radius.hero, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' }}>
          <View style={{ padding: 14, borderBottomWidth: 1, borderBottomColor: colors.border, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <SearchBar value={q} onChangeText={setQ} placeholder={d.search.placeholder} autoFocus style={{ flex: 1, backgroundColor: colors.surfaceAlt }} />
            <Tap onPress={close} style={{ paddingHorizontal: 8 }}>
              <Txt variant="smallStrong" color="textMuted">{d.common.close}</Txt>
            </Tap>
          </View>
          <ScrollView contentContainerStyle={{ padding: 10 }} keyboardShouldPersistTaps="handled">
            {legend && <LegendCard legend={legend} onOpen={go} />}
            {!results && <Txt variant="small" color="textSubtle" style={{ padding: 16 }}>{d.search.empty}</Txt>}
            {results && count === 0 && !legend && <Txt variant="small" color="textSubtle" style={{ padding: 16 }}>{d.common.noResults}</Txt>}
            {results && results.m.length > 0 && (
              <Group title={d.search.members}>
                {results.m.map((u) => (
                  <Item key={u.id} onPress={() => go(`/membre/${u.id}`)} leading={<Avatar uri={u.avatar} name={fullName(u)} size={34} />} title={fullName(u)} subtitle={[u.promo && f(d.common.promo, { year: u.promo }), u.school].filter(Boolean).join(' · ')} />
                ))}
              </Group>
            )}
            {results && results.promos.length > 0 && (
              <Group title={d.search.promos}>
                {results.promos.map((y) => (
                  <Item key={y} onPress={() => go(`/annuaire/promo/${y}`)} icon="users" title={f(d.common.promo, { year: y })} subtitle={f(d.common.members, { n: members.filter((u) => u.promo === y).length })} />
                ))}
              </Group>
            )}
            {results && results.countries.length > 0 && (
              <Group title={d.search.countries}>
                {results.countries.map((c) => (
                  <Item key={c.code} onPress={() => go(`/repere?country=${c.code}`)} leading={<View style={{ width: 34, alignItems: 'center' }}><Flag code={c.code} size={18} /></View>} title={country(c.code)} subtitle={f(d.common.members, { n: members.filter((u) => u.country === c.code).length })} />
                ))}
              </Group>
            )}
            {results && results.events.length > 0 && (
              <Group title={d.search.events}>
                {results.events.map((e) => (
                  <Item key={e.id} onPress={() => go(`/evenements/${e.id}`)} leading={<Image source={{ uri: e.cover }} style={{ width: 34, height: 34, borderRadius: 10 }} />} title={e.title} subtitle={`${formatDate(e.date)} · ${e.location}`} />
                ))}
              </Group>
            )}
            {results && results.pubs.length > 0 && (
              <Group title={d.search.publications}>
                {results.pubs.map((p) => (
                  <Item key={p.id} onPress={() => go(`/publications/${p.id}`)} icon="file-text" title={p.title} subtitle={formatDate(p.date)} />
                ))}
              </Group>
            )}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={{ marginBottom: 8 }}>
      <Txt variant="caption" style={{ paddingHorizontal: 10, paddingVertical: 8 }}>{title}</Txt>
      {children}
    </View>
  );
}

function Item({ title, subtitle, onPress, leading, icon }: { title: string; subtitle?: string; onPress: () => void; leading?: ReactNode; icon?: IconName }) {
  const { colors } = useTheme();
  return (
    <Tap onPress={onPress} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10, borderRadius: 14 }} hoverStyle={{ backgroundColor: colors.surfaceAlt }}>
      {leading ?? (
        <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
          <Feather name={icon ?? 'search'} size={16} color={colors.primary} />
        </View>
      )}
      <View style={{ flex: 1 }}>
        <Txt variant="bodyStrong" numberOfLines={1}>{title}</Txt>
        {!!subtitle && <Txt variant="small" color="textMuted" numberOfLines={1}>{subtitle}</Txt>}
      </View>
      <Feather name="arrow-up-right" size={15} color={colors.textSubtle} />
    </Tap>
  );
}
