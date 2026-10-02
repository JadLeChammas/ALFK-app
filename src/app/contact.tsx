import { Feather } from '@expo/vector-icons';
import { Seo } from '@/components/Seo';
import { router, type Href } from 'expo-router';
import { useState } from 'react';
import { Platform, ScrollView, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { INSTAGRAM_HANDLE, InstagramMark, instagramLinkProps } from '@/components/site/Instagram';
import { Container, SiteFrame } from '@/components/site/SiteFrame';
import { LogoMark } from '@/components/ui/Logo';
import { Button, Card, Chip, FieldRow, Input, Tap, type IconName } from '@/components/ui/primitives';
import { Txt } from '@/components/ui/Txt';
import { fullName, useStore } from '@/data/store';
import { useI18n } from '@/i18n';
import { useLayout } from '@/theme/layout';
import { useTheme } from '@/theme/ThemeProvider';
import { brand, fonts, radius } from '@/theme/tokens';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Public contact page — lands in the admin contact inbox (separate from member messages).
 * Layout after 21st.dev « Contact 01 » (shadcnspace: info column + form, 6/1/5 grid) and
 * « Centered Contact Form » (ln-dev7: paired fields, full-width send).
 */
export default function Contact() {
  const { d } = useI18n();
  const l = d.legal;
  const { colors } = useTheme();
  const { isDesktop, isMobile } = useLayout();
  const { me, actions } = useStore();
  const blank = { name: me ? fullName(me) : '', email: me?.email ?? '', subject: '', message: '' };
  const [form, setForm] = useState(blank);
  const [topic, setTopic] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [touched, setTouched] = useState(false);
  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));
  const emailOk = EMAIL.test(form.email.trim());
  const valid = !!(form.name.trim() && emailOk && form.subject.trim() && form.message.trim());

  const topics: { key: string; label: string; icon: IconName }[] = [
    { key: 'membership', label: l.topicMembership, icon: 'user-plus' },
    { key: 'events', label: l.topicEvents, icon: 'calendar' },
    { key: 'partnership', label: l.topicPartnership, icon: 'briefcase' },
    { key: 'orientation', label: l.topicOrientation, icon: 'compass' },
    { key: 'other', label: l.topicOther, icon: 'message-circle' },
  ];
  // Picking a topic fills the subject, unless the visitor already wrote their own.
  const pick = (t: (typeof topics)[number]) => {
    const previous = topics.find((x) => x.key === topic)?.label;
    setTopic(t.key);
    setForm((f) => (!f.subject.trim() || f.subject === previous ? { ...f, subject: t.label } : f));
  };
  const send = () => {
    setTouched(true);
    if (!valid) return;
    actions.submitContact({ ...form, name: form.name.trim(), email: form.email.trim() });
    setSent(true);
  };
  const again = () => {
    setForm(blank);
    setTopic(null);
    setTouched(false);
    setSent(false);
  };

  const ways: { href: Href; icon: IconName; title: string; sub: string }[] = [
    { href: '/bureau', icon: 'users', title: d.site.nav.bureau, sub: l.wayBoardSub },
    { href: '/adherer', icon: 'user-plus', title: d.site.nav.join, sub: l.wayJoinSub },
    { href: '/association', icon: 'heart', title: d.site.nav.association, sub: l.wayAssociationSub },
  ];

  return (
    <SiteFrame>
      <Seo title={l.contactTitle} description={l.contactLead} />
      <Container style={{ paddingTop: isMobile ? 24 : 48, paddingBottom: isMobile ? 40 : 72 }}>
        <View style={{ flexDirection: isDesktop ? 'row' : 'column', gap: isDesktop ? 48 : 20, alignItems: 'stretch' }}>
          {/* Info panel */}
          <Animated.View entering={FadeIn.duration(500)} style={{ flex: isDesktop ? 5 : undefined }}>
            <View style={{ flex: 1, backgroundColor: brand.navy, borderRadius: radius.hero + 4, padding: isMobile ? 24 : 40, gap: isMobile ? 22 : 28, overflow: 'hidden' }}>
              <View pointerEvents="none" style={{ position: 'absolute', top: -140, right: -100, width: 380, height: 380, borderRadius: 190, backgroundColor: brand.blue, opacity: 0.14, ...(Platform.OS === 'web' ? ({ filter: 'blur(70px)' } as object) : {}) }} />
              <View pointerEvents="none" style={{ position: 'absolute', right: -40, bottom: -40, opacity: 0.07 }}>
                <LogoMark size={isMobile ? 200 : 280} />
              </View>

              <View style={{ gap: 12 }}>
                <Txt style={{ fontFamily: fonts.semibold, fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: brand.blue }}>Contact</Txt>
                <Txt style={{ fontFamily: fonts.serif, fontSize: isMobile ? 44 : 60, lineHeight: isMobile ? 46 : 62, letterSpacing: -0.6, color: '#FFFFFF' }}>{l.contactTitle}</Txt>
                <Txt style={{ fontFamily: fonts.regular, fontSize: isMobile ? 15 : 17, lineHeight: isMobile ? 23 : 27, color: 'rgba(231, 236, 242,0.82)', maxWidth: 460 }}>{l.contactLead}</Txt>
              </View>

              <View style={{ gap: 4, marginTop: isDesktop ? 'auto' : 0 }}>
                <Txt style={{ fontFamily: fonts.semibold, fontSize: 11, letterSpacing: 1.6, textTransform: 'uppercase', color: 'rgba(231, 236, 242,0.6)', marginBottom: 6 }}>{l.otherWays}</Txt>
                {ways.map((w, i) => (
                  <Tap
                    key={w.title}
                    onPress={() => router.push(w.href)}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12, borderTopWidth: i ? 1 : 0, borderTopColor: 'rgba(231, 236, 242,0.12)' }}
                    hoverStyle={{ opacity: 0.85 }}>
                    <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(215, 180, 106,0.16)', alignItems: 'center', justifyContent: 'center' }}>
                      <Feather name={w.icon} size={17} color={brand.blue} />
                    </View>
                    <View style={{ flex: 1, gap: 1 }}>
                      <Txt style={{ fontFamily: fonts.semibold, fontSize: 15, color: '#FFFFFF' }}>{w.title}</Txt>
                      <Txt numberOfLines={2} style={{ fontFamily: fonts.regular, fontSize: 13, color: 'rgba(231, 236, 242,0.65)' }}>{w.sub}</Txt>
                    </View>
                    <Feather name="arrow-up-right" size={18} color="rgba(231, 236, 242,0.7)" />
                  </Tap>
                ))}
                <Tap
                  {...instagramLinkProps()}
                  role="link"
                  accessibilityLabel={`Instagram ${INSTAGRAM_HANDLE}`}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12, borderTopWidth: 1, borderTopColor: 'rgba(231, 236, 242,0.12)' }}
                  hoverStyle={{ opacity: 0.85 }}>
                  <InstagramMark size={40} />
                  <View style={{ flex: 1, gap: 1 }}>
                    <Txt style={{ fontFamily: fonts.semibold, fontSize: 15, color: '#FFFFFF' }}>Instagram</Txt>
                    <Txt numberOfLines={2} style={{ fontFamily: fonts.regular, fontSize: 13, color: 'rgba(231, 236, 242,0.65)' }}>{d.site.footer.followUs} · {INSTAGRAM_HANDLE}</Txt>
                  </View>
                  <Feather name="arrow-up-right" size={18} color="rgba(231, 236, 242,0.7)" />
                </Tap>
              </View>
            </View>
          </Animated.View>

          {/* Form */}
          <Animated.View entering={FadeInDown.delay(120).duration(550)} style={{ flex: isDesktop ? 6 : undefined }}>
            <Card style={{ flex: 1, padding: isMobile ? 20 : 32, gap: 20, borderRadius: radius.hero + 4 }}>
              {sent ? (
                <Animated.View entering={FadeIn.duration(400)} style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, paddingVertical: 48 }}>
                  <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: colors.successSoft, alignItems: 'center', justifyContent: 'center' }}>
                    <Feather name="check" size={30} color={colors.success} />
                  </View>
                  <Txt style={{ fontFamily: fonts.serif, fontSize: 36, lineHeight: 40, color: colors.text, textAlign: 'center' }}>{l.sentTitle}</Txt>
                  <Txt color="textMuted" style={{ textAlign: 'center', maxWidth: 340 }}>{l.sentSub}</Txt>
                  <View style={{ marginTop: 8 }}>
                    <Button label={l.sendAnother} variant="secondary" icon="edit-3" onPress={again} />
                  </View>
                </Animated.View>
              ) : (
                <>
                  <View style={{ gap: 10 }}>
                    <Txt variant="smallStrong" color="textMuted">{l.topic}</Txt>
                    {/* One line: equal tiles on wide screens, swipes sideways on phones. */}
                    {isMobile ? (
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -20 }} contentContainerStyle={{ gap: 8, paddingHorizontal: 20 }}>
                        {topics.map((t) => (
                          <Chip key={t.key} label={t.label} icon={t.icon} active={topic === t.key} onPress={() => pick(t)} />
                        ))}
                      </ScrollView>
                    ) : (
                      <View role="radiogroup" style={{ flexDirection: 'row', gap: 8 }}>
                        {topics.map((t) => {
                          const on = topic === t.key;
                          return (
                            <Tap
                              key={t.key}
                              role="radio"
                              aria-checked={on}
                              onPress={() => pick(t)}
                              style={{ flex: 1, minWidth: 0, alignItems: 'center', gap: 8, paddingVertical: 14, paddingHorizontal: 4, borderRadius: radius.card, borderWidth: 1, borderColor: on ? colors.ink : colors.border, backgroundColor: on ? colors.ink : colors.surface }}
                              hoverStyle={!on && { borderColor: colors.borderStrong, backgroundColor: colors.surfaceAlt }}>
                              <Feather name={t.icon} size={18} color={on ? colors.onInk : colors.secondaryStrong} />
                              <Txt numberOfLines={1} style={{ fontFamily: fonts.semibold, fontSize: 12, color: on ? colors.onInk : colors.text }}>{t.label}</Txt>
                            </Tap>
                          );
                        })}
                      </View>
                    )}
                  </View>
                  <FieldRow>
                    <Input label={l.name} value={form.name} onChangeText={set('name')} icon="user" containerStyle={{ flex: 1 }} error={touched && !form.name.trim() ? d.common.required : undefined} />
                    <Input
                      label={d.auth.email}
                      value={form.email}
                      onChangeText={set('email')}
                      icon="mail"
                      autoCapitalize="none"
                      keyboardType="email-address"
                      containerStyle={{ flex: 1 }}
                      error={touched && !emailOk ? (form.email.trim() ? l.emailInvalid : d.common.required) : undefined}
                    />
                  </FieldRow>
                  <Input label={l.subject} value={form.subject} onChangeText={set('subject')} icon="tag" error={touched && !form.subject.trim() ? d.common.required : undefined} />
                  <Input
                    label={l.message}
                    value={form.message}
                    onChangeText={set('message')}
                    placeholder={l.messagePlaceholder}
                    multiline
                    style={{ minHeight: 140, textAlignVertical: 'top' }}
                    error={touched && !form.message.trim() ? d.common.required : undefined}
                  />
                  <Button full label={d.common.send} iconRight="arrow-right" onPress={send} />
                </>
              )}
            </Card>
          </Animated.View>
        </View>
      </Container>
    </SiteFrame>
  );
}
