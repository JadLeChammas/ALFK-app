import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { fullName, useInbox, useMe, useStore, useUserMap } from '@/data/store';
import { useI18n } from '@/i18n';
import { useLayout } from '@/theme/layout';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts, radius } from '@/theme/tokens';
import { norm } from './shell/GlobalSearch';
import { useDialogs } from './ui/Dialogs';
import { Avatar, Button, CountBadge, EmptyState, fieldFontSize, IconButton, Row, SearchBar, Tap } from './ui/primitives';
import { useGutter } from './ui/Screen';
import { Txt } from './ui/Txt';

const isOnline = (iso: string) => Date.now() - new Date(iso).getTime() < 15 * 60_000;

/** Two-pane messaging on desktop/tablet, single pane on mobile. */
export function MessagesLayout({ conversationId }: { conversationId?: string }) {
  const { colors } = useTheme();
  const { isMobile } = useLayout();
  const { d } = useI18n();
  const gutter = useGutter();

  if (isMobile) {
    return <View style={{ flex: 1, backgroundColor: colors.bg }}>{conversationId ? <Thread id={conversationId} /> : <ConversationList />}</View>;
  }
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, padding: gutter, paddingBottom: 24 }}>
      <View style={{ flex: 1, maxWidth: 1240, width: '100%', alignSelf: 'center', flexDirection: 'row', borderRadius: radius.card, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, overflow: 'hidden' }}>
        <View style={{ width: 340, borderRightWidth: 1, borderRightColor: colors.border }}>
          <ConversationList activeId={conversationId} />
        </View>
        <View style={{ flex: 1 }}>{conversationId ? <Thread id={conversationId} /> : <EmptyState icon="message-circle" title={d.messages.pick} subtitle={d.messages.emptySub} />}</View>
      </View>
    </View>
  );
}

function ConversationList({ activeId }: { activeId?: string }) {
  const { colors } = useTheme();
  const { d, relative } = useI18n();
  const { isMobile } = useLayout();
  const users = useUserMap();
  const me = useMe();
  const { threads } = useInbox();
  const [q, setQ] = useState('');
  const list = threads.filter((t) => !q || norm(fullName(users.get(t.otherId))).includes(norm(q)));

  return (
    <View style={{ flex: 1 }}>
      <View style={{ padding: isMobile ? 16 : 20, gap: 14 }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <Txt variant={isMobile ? 'h1' : 'h2'}>{d.messages.title}</Txt>
          <IconButton icon="edit" onPress={() => router.push('/annuaire')} label={d.messages.newConversation} size={38} />
        </Row>
        <SearchBar value={q} onChangeText={setQ} placeholder={d.messages.searchPlaceholder} style={{ backgroundColor: colors.surfaceAlt }} />
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: isMobile ? 8 : 10, paddingBottom: 24 }}>
        {list.length === 0 && <EmptyState icon="message-circle" title={d.messages.empty} subtitle={d.messages.emptySub} action={<Button label={d.nav.directory} icon="users" variant="secondary" onPress={() => router.push('/annuaire')} />} />}
        {list.map((t) => {
          const other = users.get(t.otherId);
          const active = t.conversation.id === activeId;
          const mine = t.last!.senderId === me.id;
          return (
            <Tap
              key={t.conversation.id}
              onPress={() => router.replace(`/messages/${t.conversation.id}`)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 16, backgroundColor: active ? colors.primarySoft : 'transparent' }}
              hoverStyle={!active && { backgroundColor: colors.surfaceAlt }}>
              <Avatar uri={other?.avatar} name={fullName(other)} size={46} online={other && isOnline(other.lastActiveAt)} />
              <View style={{ flex: 1, gap: 2 }}>
                <Row style={{ justifyContent: 'space-between' }}>
                  <Txt variant="bodyStrong" numberOfLines={1} style={{ flex: 1, fontSize: 14 }}>{fullName(other)}</Txt>
                  <Txt variant="small" style={{ fontSize: 11, color: t.unread ? colors.primary : colors.textSubtle }}>{relative(t.last!.createdAt)}</Txt>
                </Row>
                <Row>
                  <Txt variant="small" numberOfLines={1} style={{ flex: 1, color: t.unread ? colors.text : colors.textMuted, fontFamily: t.unread ? fonts.semibold : fonts.medium }}>
                    {mine ? d.messages.you : ''}
                    {t.last!.text}
                  </Txt>
                  {t.unread > 0 && <CountBadge n={t.unread} style={{ backgroundColor: colors.primary, borderColor: 'transparent' }} />}
                </Row>
              </View>
            </Tap>
          );
        })}
      </ScrollView>
    </View>
  );
}

function Thread({ id }: { id: string }) {
  const { colors } = useTheme();
  const { d, f, relative, formatTime, formatDate } = useI18n();
  const { isMobile } = useLayout();
  const insets = useSafeAreaInsets();
  const { db, actions } = useStore();
  const { prompt, toast } = useDialogs();
  const users = useUserMap();
  const me = useMe();
  const scroll = useRef<ScrollView>(null);
  const [text, setText] = useState('');

  const conv = db.conversations.find((c) => c.id === id);
  const isMember = !!conv?.members.includes(me.id);
  const moderation = !isMember && me.role === 'admin' && !!conv?.report;
  const messages = useMemo(() => db.messages.filter((m) => m.conversationId === id), [db.messages, id]);

  useEffect(() => {
    if (isMember) actions.markConversationRead(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, messages.length, isMember]);

  useEffect(() => {
    if (moderation) actions.openReportedConversation(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, moderation]);

  if (!conv || (!isMember && !moderation)) {
    return <EmptyState icon="lock" title={d.messages.pick} />;
  }

  const otherId = isMember ? conv.members.find((m) => m !== me.id)! : conv.members[1];
  const other = users.get(otherId);
  const send = () => {
    if (!text.trim()) return;
    actions.sendMessage(id, text);
    setText('');
  };
  const report = async () => {
    const reason = await prompt({ title: d.messages.report, message: d.messages.reportReason, multiline: true, danger: true, confirmLabel: d.messages.report });
    if (reason) {
      actions.reportConversation(id, reason);
      toast(d.messages.reported);
    }
  };

  const dayStarts = messages.map((m, i) => i === 0 || new Date(m.createdAt).toDateString() !== new Date(messages[i - 1].createdAt).toDateString());
  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12, paddingTop: isMobile ? insets.top + 10 : 12, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.surface }}>
        {isMobile && <IconButton icon="arrow-left" variant="ghost" onPress={() => (router.canGoBack() ? router.back() : router.replace('/messages'))} label={d.nav.back} />}
        <Tap onPress={() => router.push(`/membre/${otherId}`)} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
          {moderation ? (
            <Row gap={0}>
              {conv.members.map((m, i) => (
                <View key={m} style={{ marginLeft: i ? -12 : 0 }}>
                  <Avatar uri={users.get(m)?.avatar} name={fullName(users.get(m))} size={40} ring />
                </View>
              ))}
            </Row>
          ) : (
            <Avatar uri={other?.avatar} name={fullName(other)} size={42} online={other && isOnline(other.lastActiveAt)} />
          )}
          <View style={{ flex: 1 }}>
            <Txt variant="bodyStrong" numberOfLines={1}>{moderation ? conv.members.map((m) => fullName(users.get(m))).join(' ↔ ') : fullName(other)}</Txt>
            {other && !moderation && (
              <Txt variant="small" color={isOnline(other.lastActiveAt) ? 'success' : 'textSubtle'}>
                {isOnline(other.lastActiveAt) ? d.messages.online : f(d.messages.lastSeen, { when: relative(other.lastActiveAt) })}
              </Txt>
            )}
          </View>
        </Tap>
        {isMember && <IconButton icon="flag" variant="ghost" onPress={report} label={d.messages.report} color={colors.textMuted} />}
      </View>

      {moderation && (
        <Row gap={8} style={{ backgroundColor: colors.warningSoft, paddingHorizontal: 16, paddingVertical: 10 }}>
          <Feather name="shield" size={14} color={colors.warning} />
          <Txt variant="smallStrong" style={{ color: colors.warning, flex: 1 }}>{d.messages.moderation} — « {conv.report!.reason} »</Txt>
        </Row>
      )}

      {/* Messages */}
      <ScrollView
        ref={scroll}
        style={{ flex: 1, backgroundColor: colors.bg }}
        contentContainerStyle={{ padding: 16, gap: 6 }}
        onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: false })}>
        <Row gap={6} style={{ alignSelf: 'center', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 999, backgroundColor: colors.surfaceAlt, marginBottom: 8 }}>
          <Feather name="lock" size={11} color={colors.textSubtle} />
          <Txt variant="small" color="textSubtle" style={{ fontSize: 11 }}>{d.messages.privateNote}</Txt>
        </Row>
        {messages.map((m, i) => {
          const showDay = dayStarts[i];
          const mine = moderation ? m.senderId === conv.members[0] : m.senderId === me.id;
          const nextSame = messages[i + 1]?.senderId === m.senderId;
          return (
            <View key={m.id}>
              {showDay && <Txt variant="caption" align="center" style={{ marginVertical: 10 }}>{formatDate(m.createdAt, { weekday: true, year: false })}</Txt>}
              <View style={{ alignSelf: mine ? 'flex-end' : 'flex-start', maxWidth: '78%', marginBottom: nextSame ? 0 : 6 }}>
                <View
                  style={{
                    backgroundColor: mine ? colors.bubbleMine : colors.surface,
                    borderWidth: mine ? 0 : 1,
                    borderColor: colors.border,
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    borderRadius: 20,
                    borderBottomRightRadius: mine && !nextSame ? 6 : 20,
                    borderBottomLeftRadius: !mine && !nextSame ? 6 : 20,
                  }}>
                  <Txt style={{ color: mine ? '#fff' : colors.text, fontFamily: fonts.medium, fontSize: 15, lineHeight: 21 }}>{m.text}</Txt>
                </View>
                {!nextSame && <Txt variant="small" color="textSubtle" style={{ fontSize: 10, marginTop: 4, alignSelf: mine ? 'flex-end' : 'flex-start' }}>{formatTime(m.createdAt)}</Txt>}
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* Composer */}
      {isMember ? (
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 10, padding: 12, paddingBottom: isMobile ? Math.max(insets.bottom, 12) : 12, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.surface }}>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder={d.messages.placeholder}
            placeholderTextColor={colors.textSubtle}
            multiline
            maxLength={5000}
            onKeyPress={(e) => {
              const ev = e.nativeEvent as unknown as { key: string; shiftKey?: boolean };
              if (Platform.OS === 'web' && ev.key === 'Enter' && !ev.shiftKey) {
                (e as unknown as { preventDefault: () => void }).preventDefault();
                send();
              }
            }}
            style={[
              { flex: 1, minHeight: 44, maxHeight: 120, borderRadius: 22, backgroundColor: colors.surfaceAlt, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12, color: colors.text, fontFamily: fonts.medium, fontSize: fieldFontSize(15) },
              Platform.OS === 'web' && ({ outlineStyle: 'none' } as object),
            ]}
          />
          <IconButton icon="send" variant="primary" size={44} onPress={send} label={d.common.send} />
        </View>
      ) : (
        <Row gap={10} style={{ padding: 12, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.surface, justifyContent: 'flex-end' }}>
          <Button
            label={d.admin.resolve}
            icon="check"
            onPress={() => {
              actions.resolveReport(id);
              router.replace('/admin/contenus');
            }}
          />
        </Row>
      )}
    </KeyboardAvoidingView>
  );
}
