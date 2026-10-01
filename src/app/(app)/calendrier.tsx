import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Linking, View } from 'react-native';

import { Sheet } from '@/components/forms';
import { ProceduresCard } from '@/components/ProceduresCard';
import { useDialogs } from '@/components/ui/Dialogs';
import { Avatar, Badge, Button, Card, Chip, IconButton, Input, Row, SectionHeader, Tap, toneColors, type IconName, type Tone } from '@/components/ui/primitives';
import { Grid, PageHeader, Screen } from '@/components/ui/Screen';
import { Txt } from '@/components/ui/Txt';
import { occurrencesAround, type Occurrence } from '@/data/keyDates';
import { can } from '@/data/permissions';
import { fullName, useApprovedMembers, useMe, useStore } from '@/data/store';
import type { KeyDate, KeyDateCategory } from '@/data/types';
import { LANGUAGES, useI18n } from '@/i18n';
import { useLayout } from '@/theme/layout';
import { useTheme } from '@/theme/ThemeProvider';

const CATEGORIES: KeyDateCategory[] = ['demarches', 'francophonie', 'aefe', 'lfk', 'france', 'koweit', 'amicale'];
const CATEGORY_TONE: Record<KeyDateCategory, Tone> = { francophonie: 'violet', aefe: 'info', lfk: 'primary', france: 'danger', koweit: 'success', amicale: 'ink', demarches: 'secondary' };

type Item = { key: string; kind: 'date' | 'birthday' | 'event'; title: string; tone: Tone; icon: IconName; href?: string; avatar?: { uri?: string; name: string }; keyDate?: KeyDate; occ?: Occurrence; phase?: 'start' | 'end' };

const ymd = (y: number, m: number, day: number) => `${y}-${String(m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

/** Important dates (Francophonie, AEFE, LFK, France…), procedures (Parcoursup, exams…), members' birthdays and events, month by month. */
export default function Calendar() {
  const { d, f, lang } = useI18n();
  const { colors } = useTheme();
  const { isMobile } = useLayout();
  const { db, actions } = useStore();
  const { confirm } = useDialogs();
  const me = useMe();
  const members = useApprovedMembers();
  const admin = me.role === 'admin';
  const today = new Date();
  const [cursor, setCursor] = useState({ y: today.getFullYear(), m: today.getMonth() });
  const [selected, setSelected] = useState<string>(ymd(today.getFullYear(), today.getMonth(), today.getDate()));
  const [adding, setAdding] = useState(false);
  const params = useLocalSearchParams<{ only?: string }>();
  // « Démarches » only: what students look at.
  const [onlyProcedures, setOnlyProcedures] = useState(params.only === 'demarches');
  const locale = LANGUAGES.find((l) => l.code === lang)?.locale ?? 'fr-FR';

  // Everything happening in the displayed month, by YYYY-MM-DD.
  const byDay = useMemo(() => {
    const map = new Map<string, Item[]>();
    const push = (day: string, it: Item) => map.set(day, [...(map.get(day) ?? []), it]);
    const { y, m } = cursor;
    for (const k of db.keyDates) {
      if (onlyProcedures && k.category !== 'demarches') continue;
      const icon: IconName = k.category === 'demarches' ? 'clipboard' : 'star';
      // A period shows on its first and last day; the days in between are listed when selected.
      for (const o of occurrencesAround(k, y)) {
        const base = { kind: 'date' as const, title: k.title, tone: CATEGORY_TONE[k.category], icon, keyDate: k, occ: o };
        if (o.start.getFullYear() === y && o.start.getMonth() === m) push(ymd(y, m, o.start.getDate()), { ...base, key: `${k.id}s`, phase: o.range ? 'start' : undefined });
        if (o.range && o.end.getFullYear() === y && o.end.getMonth() === m) push(ymd(y, m, o.end.getDate()), { ...base, key: `${k.id}e`, phase: 'end' });
      }
    }
    if (onlyProcedures) return map;
    for (const u of members) {
      if (!u.birthDate || (!u.privacy.showBirthday && u.id !== me.id && !admin)) continue;
      const [, bm, bd] = u.birthDate.split('-').map(Number);
      if (bm - 1 !== m) continue;
      push(ymd(y, m, bd), { key: `b${u.id}`, kind: 'birthday', title: f(d.calendar.birthdayOf, { name: fullName(u) }), tone: 'warning', icon: 'gift', href: `/membre/${u.id}`, avatar: { uri: u.avatar, name: fullName(u) } });
    }
    if (can(me, 'viewEvents')) {
      for (const e of db.events) {
        const dt = new Date(e.date);
        if (dt.getFullYear() !== y || dt.getMonth() !== m) continue;
        push(ymd(y, m, dt.getDate()), { key: e.id, kind: 'event', title: e.title, tone: 'neutral', icon: 'calendar', href: `/evenements/${e.id}` });
      }
    }
    return map;
  }, [cursor, db.keyDates, db.events, members, me, admin, d, f, onlyProcedures]);

  const { y, m } = cursor;
  const first = new Date(y, m, 1);
  const lead = (first.getDay() + 6) % 7; // weeks start on Monday
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const cells = [...Array(lead).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  while (cells.length % 7) cells.push(null);
  const weekdays = Array.from({ length: 7 }, (_, i) => new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(new Date(2024, 0, 1 + i)));
  const todayKey = ymd(today.getFullYear(), today.getMonth(), today.getDate());

  const move = (delta: number) => {
    const dt = new Date(y, m + delta, 1);
    setCursor({ y: dt.getFullYear(), m: dt.getMonth() });
    setSelected(ymd(dt.getFullYear(), dt.getMonth(), 1));
  };
  const monthItems = [...byDay.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1));
  const selectedItems = byDay.get(selected) ?? [];
  const selDay = Number(selected.slice(8));
  // Periods running through the selected day (not starting or ending on it).
  const selDate = new Date(y, m, selDay);
  const during: Item[] = db.keyDates.flatMap((k) =>
    (onlyProcedures && k.category !== 'demarches') ? [] :
    occurrencesAround(k, y)
      .filter((o) => o.range && o.start < selDate && o.end > selDate)
      .map((o) => ({ key: `${k.id}d`, kind: 'date' as const, title: k.title, tone: CATEGORY_TONE[k.category], icon: (k.category === 'demarches' ? 'clipboard' : 'star') as IconName, keyDate: k, occ: o })),
  );
  const short = (dt: Date) => `${dt.getDate()} ${d.months[dt.getMonth()]}`;

  const removeDate = async (k: KeyDate) => {
    if (await confirm({ title: d.common.delete, message: k.title, danger: true, confirmLabel: d.common.delete })) actions.deleteKeyDate(k.id);
  };

  const grid = (
    <Card style={{ gap: 14 }}>
      <Row gap={8} wrap>
        <Chip label={d.calendar.all} active={!onlyProcedures} onPress={() => setOnlyProcedures(false)} />
        <Chip label={d.calendar.onlyProcedures} icon="clipboard" active={onlyProcedures} onPress={() => setOnlyProcedures(true)} />
      </Row>
      <Row wrap style={{ justifyContent: 'space-between' }}>
        <Txt variant="h2" style={{ textTransform: 'capitalize' }}>{`${d.months[m]} ${y}`}</Txt>
        <Row gap={8}>
          <Button label={d.common.today} size="sm" variant="secondary" onPress={() => { setCursor({ y: today.getFullYear(), m: today.getMonth() }); setSelected(todayKey); }} />
          <IconButton icon="chevron-left" size={36} onPress={() => move(-1)} label={d.calendar.prev} />
          <IconButton icon="chevron-right" size={36} onPress={() => move(1)} label={d.calendar.next} />
        </Row>
      </Row>
      <View style={{ flexDirection: 'row' }}>
        {weekdays.map((w) => (
          <Txt key={w} variant="caption" align="center" style={{ flex: 1 }}>{w}</Txt>
        ))}
      </View>
      <View style={{ gap: 4 }}>
        {Array.from({ length: cells.length / 7 }, (_, row) => (
          <View key={row} style={{ flexDirection: 'row', gap: 4 }}>
            {cells.slice(row * 7, row * 7 + 7).map((day, i) => {
              if (!day) return <View key={i} style={{ flex: 1 }} />;
              const key = ymd(y, m, day);
              const items = byDay.get(key) ?? [];
              const active = key === selected;
              const isToday = key === todayKey;
              return (
                <Tap
                  key={i}
                  onPress={() => setSelected(key)}
                  style={{ flex: 1, minHeight: isMobile ? 48 : 76, padding: 6, borderRadius: 12, gap: 4, backgroundColor: active ? colors.primarySoft : colors.surfaceAlt, borderWidth: 1, borderColor: active ? colors.primary : 'transparent' }}
                  hoverStyle={!active && { borderColor: colors.border }}>
                  <Txt variant="smallStrong" style={{ color: isToday ? colors.primary : colors.text, textDecorationLine: isToday ? 'underline' : 'none' }}>{day}</Txt>
                  {isMobile ? (
                    <Row gap={3} wrap>
                      {items.slice(0, 3).map((it) => (
                        <View key={it.key} style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: toneColors(colors, it.tone).fg }} />
                      ))}
                    </Row>
                  ) : (
                    items.slice(0, 2).map((it) => {
                      const t = toneColors(colors, it.tone);
                      return (
                        <Txt key={it.key} numberOfLines={1} style={{ fontSize: 10, fontWeight: '600', color: t.fg, backgroundColor: t.bg, borderRadius: 6, paddingHorizontal: 4, paddingVertical: 1, overflow: 'hidden' }}>{it.title}</Txt>
                      );
                    })
                  )}
                  {!isMobile && items.length > 2 && <Txt style={{ fontSize: 10, color: colors.textSubtle }}>+{items.length - 2}</Txt>}
                </Tap>
              );
            })}
          </View>
        ))}
      </View>
      {!onlyProcedures && (
        <Row gap={6} wrap>
          <Badge label={d.calendar.birthdays} tone="warning" icon="gift" />
          {CATEGORIES.map((c) => <Badge key={c} label={d.calendar.categories[c]} tone={CATEGORY_TONE[c]} />)}
          {can(me, 'viewEvents') && <Badge label={d.nav.events} tone="neutral" icon="calendar" />}
        </Row>
      )}
    </Card>
  );

  const renderItem = (it: Item, withDate?: string) => (
    <Row key={it.key + (withDate ?? '')} gap={12}>
      <Tap onPress={() => it.href && router.push(it.href as never)} disabled={!it.href} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        {it.avatar ? (
          <Avatar uri={it.avatar.uri} name={it.avatar.name} size={36} />
        ) : (
          <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: toneColors(colors, it.tone).bg, alignItems: 'center', justifyContent: 'center' }}>
            <Feather name={it.icon} size={16} color={toneColors(colors, it.tone).fg} />
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Txt variant="bodyStrong" numberOfLines={2}>{it.phase ? `${it.phase === 'start' ? d.calendar.start : d.calendar.end} · ${it.title}` : it.title}</Txt>
          <Txt variant="small" color="textSubtle">
            {[
              withDate,
              it.occ?.range && `${short(it.occ.start)} → ${short(it.occ.end)}`,
              it.keyDate ? d.calendar.categories[it.keyDate.category] : it.kind === 'birthday' ? d.calendar.birthdays : d.nav.events,
            ].filter(Boolean).join(' · ')}
          </Txt>
        </View>
      </Tap>
      {!!it.keyDate?.url && <IconButton icon="external-link" size={32} onPress={() => Linking.openURL(it.keyDate!.url!)} label={d.calendar.openLink} />}
      {admin && it.keyDate && <IconButton icon="trash-2" size={32} onPress={() => removeDate(it.keyDate!)} label={d.common.delete} />}
    </Row>
  );

  const aside = (
    <Grid min={300} gap={16}>
      <Card style={{ gap: 12 }}>
        <SectionHeader title={`${selDay} ${d.months[m]}`} icon="sun" />
        {selectedItems.length === 0 && during.length === 0 ? <Txt color="textMuted">{d.calendar.nothing}</Txt> : selectedItems.map((it) => renderItem(it))}
        {during.length > 0 && (
          <>
            <Txt variant="caption" style={{ marginTop: selectedItems.length ? 6 : 0 }}>{d.calendar.during}</Txt>
            {during.map((it) => renderItem(it))}
          </>
        )}
      </Card>
      <ProceduresCard footer={false} />
      <Card style={{ gap: 12 }}>
        <SectionHeader title={d.calendar.thisMonth} icon="list" count={String(monthItems.reduce((a, [, l]) => a + l.length, 0))} />
        {monthItems.length === 0 ? <Txt color="textMuted">{d.calendar.nothing}</Txt> : monthItems.flatMap(([day, list]) => list.map((it) => renderItem(it, `${Number(day.slice(8))} ${d.months[m]}`)))}
      </Card>
    </Grid>
  );

  return (
    <Screen>
      <PageHeader title={d.calendar.title} subtitle={d.calendar.subtitle} right={admin && <Button label={d.calendar.add} icon="plus" variant="secondary" onPress={() => setAdding(true)} />} />
      {grid}
      {aside}
      <KeyDateForm visible={adding} onClose={() => setAdding(false)} />
    </Screen>
  );
}

function KeyDateForm({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { d } = useI18n();
  const { actions } = useStore();
  const { toast } = useDialogs();
  const blank = { title: '', date: '', end: '', period: false, url: '', year: '', category: 'lfk' as KeyDateCategory };
  const [form, setForm] = useState(blank);
  const year = form.year ? parseInt(form.year, 10) : undefined;
  const parse = (v: string) => {
    const [day, month] = v.split('/').map((x) => parseInt(x, 10));
    return { day, month, ok: !!day && !!month && month >= 1 && month <= 12 && day >= 1 && day <= new Date(year ?? 2024, month, 0).getDate() };
  };
  const start = parse(form.date);
  const end = parse(form.end);
  const dd = start.day;
  const mm = start.month;
  const validDate = start.ok;
  const validEnd = !form.period || (end.ok && (end.day !== dd || end.month !== mm));
  const validYear = !form.year || (!!year && year >= 1900 && year <= 2100);
  const url = form.url.trim() && !/^https?:\/\//i.test(form.url.trim()) ? `https://${form.url.trim()}` : form.url.trim();
  const maskDayMonth = (v: string) => {
    const digits = v.replace(/\D/g, '').slice(0, 4);
    return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
  };
  return (
    <Sheet visible={visible} title={d.calendar.add} onClose={onClose}>
      <Input label={d.calendar.titleField} value={form.title} onChangeText={(v) => setForm((f) => ({ ...f, title: v }))} />
      <Row gap={12}>
        <Input label={d.calendar.dateField} value={form.date} onChangeText={(v) => setForm((f) => ({ ...f, date: maskDayMonth(v) }))} placeholder="20/03" keyboardType="number-pad" maxLength={5} containerStyle={{ flex: 1 }} error={form.date.length === 5 && !validDate ? d.calendar.invalidDate : undefined} />
        <Input label={d.calendar.yearField} value={form.year} onChangeText={(v) => setForm((f) => ({ ...f, year: v.replace(/\D/g, '') }))} placeholder="2027" keyboardType="number-pad" maxLength={4} containerStyle={{ flex: 1 }} />
      </Row>
      <Txt variant="small" color="textSubtle">{d.calendar.yearHint}</Txt>
      <Row gap={8} wrap>
        <Chip label={d.calendar.oneDay} active={!form.period} onPress={() => setForm((f) => ({ ...f, period: false }))} />
        <Chip label={d.calendar.period} icon="arrow-right" active={form.period} onPress={() => setForm((f) => ({ ...f, period: true }))} />
      </Row>
      {form.period && (
        <Input label={d.calendar.endField} value={form.end} onChangeText={(v) => setForm((f) => ({ ...f, end: maskDayMonth(v) }))} placeholder="12/03" keyboardType="number-pad" maxLength={5} error={form.end.length === 5 && !validEnd ? d.calendar.invalidDate : undefined} />
      )}
      <Input label={d.calendar.urlField} value={form.url} onChangeText={(v) => setForm((f) => ({ ...f, url: v }))} placeholder="https://www.parcoursup.gouv.fr" autoCapitalize="none" keyboardType="url" />
      <View style={{ gap: 8 }}>
        <Txt variant="smallStrong" color="textMuted">{d.calendar.category}</Txt>
        <Row gap={8} wrap>
          {CATEGORIES.map((c) => (
            <Chip key={c} label={d.calendar.categories[c]} active={form.category === c} onPress={() => setForm((f) => ({ ...f, category: c }))} />
          ))}
        </Row>
      </View>
      <Button
        label={d.common.add}
        full
        size="lg"
        disabled={!form.title.trim() || !validDate || !validYear || !validEnd}
        onPress={() => {
          actions.addKeyDate({ title: form.title.trim(), day: dd, month: mm, year, category: form.category, ...(form.period ? { endDay: end.day, endMonth: end.month } : {}), ...(url ? { url } : {}) });
          toast(d.common.saved);
          setForm(blank);
          onClose();
        }}
      />
    </Sheet>
  );
}
