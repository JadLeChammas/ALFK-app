import { Feather } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { View } from 'react-native';

import { AdminNav } from '@/components/AdminNav';
import { useDialogs } from '@/components/ui/Dialogs';
import { Avatar, Badge, Button, Card, Chip, IconButton, Input, Row, SearchBar, SectionHeader, Segmented, Tap } from '@/components/ui/primitives';
import { Grid, PageHeader, Screen } from '@/components/ui/Screen';
import { Txt } from '@/components/ui/Txt';
import { fullName, useApprovedMembers, useMe, useStore } from '@/data/store';
import type { UrgentMessage } from '@/data/types';
import { URGENT_REASONS } from '@/data/urgentReasons';
import { useI18n } from '@/i18n';
import { useLayout } from '@/theme/layout';
import { useTheme } from '@/theme/ThemeProvider';

/**
 * Admins: urgent messages. Pick ready-made reasons (an invalid profile photo…) and/or write a message,
 * choose the members (photos shown, to spot the invalid ones) or everyone, and send: it pops up for
 * them on every page until they acknowledge it. Below, what was sent and who has read it.
 */
export default function AdminUrgent() {
  const { d, f } = useI18n();
  const u = d.urgent;
  const { colors } = useTheme();
  const { isMobile } = useLayout();
  const { actions } = useStore();
  const me = useMe();
  const { confirm, toast } = useDialogs();
  const members = useApprovedMembers().filter((x) => x.id !== me.id);

  const [reasons, setReasons] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [mode, setMode] = useState<'selected' | 'all'>('selected');
  const [selected, setSelected] = useState<string[]>([]);
  const [query, setQuery] = useState('');
  const [photosOnly, setPhotosOnly] = useState(false);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return members
      .filter((x) => !photosOnly || !!x.avatar)
      .filter((x) => !q || `${fullName(x)} ${x.promo ?? ''}`.toLowerCase().includes(q))
      .sort((a, b) => a.lastName.localeCompare(b.lastName, 'fr', { sensitivity: 'base' }) || a.firstName.localeCompare(b.firstName, 'fr', { sensitivity: 'base' }));
  }, [members, query, photosOnly]);

  const toggle = (list: string[], v: string) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  const recipients = mode === 'all' ? members.map((x) => x.id) : selected;
  const hasContent = reasons.length > 0 || !!body.trim();

  const submit = async () => {
    if (!hasContent) return toast(u.needContent, 'danger');
    if (!recipients.length) return toast(u.needRecipients, 'danger');
    if (!(await confirm({ title: u.send, message: f(u.confirmSend, { n: recipients.length }), confirmLabel: u.send }))) return;
    actions.sendUrgentMessage(recipients, { title: title.trim(), body: body.trim(), reasons });
    toast(f(u.sent, { n: recipients.length }), 'success');
    setReasons([]);
    setTitle('');
    setBody('');
    setSelected([]);
  };

  return (
    <Screen maxWidth={1040}>
      <PageHeader title={u.title} subtitle={u.subtitle} />
      <AdminNav />

      {/* 1. What: ready-made reasons and/or a message. */}
      <Card style={{ gap: 14 }}>
        <SectionHeader title={u.reasonsLabel} icon="list" />
        <Row gap={8} wrap>
          {URGENT_REASONS.map((r) => (
            <Chip key={r.key} label={u.reasons[r.key].label} icon={r.icon} active={reasons.includes(r.key)} onPress={() => setReasons((l) => toggle(l, r.key))} />
          ))}
        </Row>
        <Txt variant="small" color="textSubtle">{u.reasonsHint}</Txt>
        <Input label={`${u.titleField} (${d.common.optional})`} value={title} onChangeText={setTitle} maxLength={120} />
        <Input label={reasons.length ? `${u.bodyField} (${d.common.optional})` : u.bodyField} value={body} onChangeText={setBody} multiline maxLength={2000} />
      </Card>

      {/* 2. Who: chosen members (photos shown) or everyone. */}
      <Card style={{ gap: 14 }}>
        <SectionHeader title={u.recipients} icon="users" />
        <Segmented
          value={mode}
          onChange={setMode}
          options={[
            { value: 'selected', label: u.chosen, icon: 'user-check' },
            { value: 'all', label: f(u.everyone, { n: members.length }), icon: 'users' },
          ]}
        />
        {mode === 'selected' && (
          <>
            <Row gap={10} wrap>
              <SearchBar value={query} onChangeText={setQuery} placeholder={u.search} style={{ flex: 1, minWidth: 220 }} />
              <Chip label={u.photosOnly} icon="camera" active={photosOnly} onPress={() => setPhotosOnly((v) => !v)} />
            </Row>
            <Row gap={10} wrap style={{ justifyContent: 'space-between' }}>
              <Txt variant="smallStrong" color={selected.length ? 'primary' : 'textMuted'}>{f(u.selectedCount, { n: selected.length })}</Txt>
              {selected.length > 0 && <Button label={u.clear} variant="ghost" size="sm" onPress={() => setSelected([])} />}
            </Row>
            <Grid min={isMobile ? 120 : 140} gap={10}>
              {shown.map((x) => {
                const on = selected.includes(x.id);
                return (
                  <Tap
                    key={x.id}
                    onPress={() => setSelected((l) => toggle(l, x.id))}
                    style={{ alignItems: 'center', gap: 8, padding: 12, borderRadius: 16, borderWidth: 2, borderColor: on ? colors.primary : colors.border, backgroundColor: on ? colors.primarySoft : colors.surface }}>
                    <View>
                      <Avatar uri={x.avatar} name={fullName(x)} size={72} />
                      {on && (
                        <View style={{ position: 'absolute', right: -4, top: -4, width: 24, height: 24, borderRadius: 12, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
                          <Feather name="check" size={14} color="#fff" />
                        </View>
                      )}
                    </View>
                    <Txt variant="smallStrong" align="center" numberOfLines={2}>{fullName(x)}</Txt>
                    {!!x.promo && <Txt variant="small" color="textSubtle">{f(d.common.promo, { year: x.promo })}</Txt>}
                  </Tap>
                );
              })}
            </Grid>
          </>
        )}
      </Card>

      <Button label={recipients.length ? f(u.sendTo, { n: recipients.length }) : u.send} icon="alert-triangle" onPress={submit} disabled={!hasContent || !recipients.length} style={{ alignSelf: isMobile ? 'stretch' : 'flex-start' }} />

      <History />
    </Screen>
  );
}

/** What was sent, newest first: one card per send, with who has read it. */
function History() {
  const { d, f, formatDate } = useI18n();
  const u = d.urgent;
  const { colors } = useTheme();
  const { db, actions } = useStore();
  const { confirm } = useDialogs();
  const users = new Map(db.users.map((x) => [x.id, x]));
  const batches = useMemo(() => {
    const map = new Map<string, UrgentMessage[]>();
    for (const m of db.urgentMessages ?? []) map.set(m.createdAt, [...(map.get(m.createdAt) ?? []), m]);
    return [...map.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1)).slice(0, 20);
  }, [db.urgentMessages]);
  if (!batches.length) return null;

  return (
    <View style={{ gap: 14 }}>
      <SectionHeader title={u.history} icon="clock" count={String(batches.length)} />
      {batches.map(([at, list]) => {
        const first = list[0];
        const read = list.filter((m) => m.acknowledgedAt).length;
        const labels = first.reasons.map((k) => u.reasons[k as keyof typeof u.reasons]?.label).filter(Boolean) as string[];
        return (
          <Card key={at} style={{ gap: 10 }}>
            <Row gap={10} style={{ alignItems: 'flex-start' }}>
              <View style={{ flex: 1, gap: 6 }}>
                <Txt variant="small" color="textSubtle">{formatDate(at)}</Txt>
                {!!first.title && <Txt variant="bodyStrong">{first.title}</Txt>}
                <Row gap={6} wrap>
                  {labels.map((l) => <Badge key={l} label={l} tone="primary" />)}
                  <Badge label={f(u.readBy, { n: read, total: list.length })} tone={read === list.length ? 'success' : 'neutral'} icon="eye" />
                </Row>
                {!!first.body && <Txt variant="small" color="textMuted" numberOfLines={3}>{first.body}</Txt>}
              </View>
              <IconButton
                icon="trash-2"
                size={34}
                label={u.withdraw}
                onPress={async () => {
                  if (await confirm({ title: u.withdraw, message: u.withdrawConfirm, danger: true, confirmLabel: u.withdraw })) list.forEach((m) => actions.deleteUrgentMessage(m.id));
                }}
              />
            </Row>
            <Row gap={6} wrap>
              {list.map((m) => {
                const x = users.get(m.userId);
                return (
                  <Row key={m.id} gap={6} style={{ paddingVertical: 4, paddingLeft: 4, paddingRight: 10, borderRadius: 999, backgroundColor: colors.surfaceAlt }}>
                    <Avatar uri={x?.avatar} name={x ? fullName(x) : '?'} size={22} />
                    <Txt variant="small">{x ? fullName(x) : '—'}</Txt>
                    <Feather name={m.acknowledgedAt ? 'check-circle' : 'circle'} size={13} color={m.acknowledgedAt ? colors.success : colors.textSubtle} />
                  </Row>
                );
              })}
            </Row>
          </Card>
        );
      })}
    </View>
  );
}
