import { Feather } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { View } from 'react-native';

import { AdminNav } from '@/components/AdminNav';
import { useDialogs } from '@/components/ui/Dialogs';
import { Button, Card, Input, Row } from '@/components/ui/primitives';
import { PageHeader, Screen } from '@/components/ui/Screen';
import { Txt } from '@/components/ui/Txt';
import { useApprovedMembers, useStore } from '@/data/store';
import { useI18n } from '@/i18n';
import { useLayout } from '@/theme/layout';
import { useTheme } from '@/theme/ThemeProvider';
import { isWhatsappLink } from '../whatsapp';

const WHATSAPP = '#25D366';
/** The LFK's first promo. */
const FIRST_PROMO = 1989;

/**
 * Admins: every promo with the link of its WhatsApp group — paste it, save, and the promo's members
 * see it on their WhatsApp and promo pages (each member only their own promo's link).
 */
export default function AdminWhatsapp() {
  const { d, f } = useI18n();
  const w = d.adminWhatsapp;
  const { db } = useStore();
  const members = useApprovedMembers();
  // Every promo since the first one (1989) up to the current students' (in three years), newest first.
  const years = useMemo(() => {
    const set = new Set<number>();
    for (let y = FIRST_PROMO; y <= new Date().getFullYear() + 3; y++) set.add(y);
    members.forEach((u) => u.promo && set.add(u.promo));
    db.promos.forEach((p) => set.add(p.year));
    return [...set].sort((a, b) => b - a);
  }, [members, db.promos]);
  const count = (y: number) => members.filter((u) => u.promo === y).length;
  const withLink = db.promos.filter((p) => p.whatsapp).length;

  return (
    <Screen maxWidth={900}>
      <PageHeader title={w.title} subtitle={f(w.subtitle, { n: withLink })} />
      <AdminNav />
      <Card style={{ gap: 4, paddingVertical: 8 }}>
        {years.map((y, i) => (
          <PromoRow key={y} year={y} members={count(y)} link={db.promos.find((p) => p.year === y)?.whatsapp ?? ''} last={i === years.length - 1} />
        ))}
      </Card>
    </Screen>
  );
}

function PromoRow({ year, members, link, last }: { year: number; members: number; link: string; last: boolean }) {
  const { d, f } = useI18n();
  const w = d.adminWhatsapp;
  const { colors } = useTheme();
  const { isMobile } = useLayout();
  const { actions } = useStore();
  const { toast } = useDialogs();
  const [value, setValue] = useState(link);
  const changed = value.trim() !== link;
  const valid = !value.trim() || isWhatsappLink(value);

  const save = () => {
    if (!valid) return toast(d.whatsapp.invalidLink, 'danger');
    actions.setPromoWhatsapp(year, value.trim());
    toast(value.trim() ? f(w.saved, { year }) : f(w.removed, { year }), 'success');
  };

  return (
    <View style={{ flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'stretch' : 'center', gap: 12, paddingVertical: 12, borderBottomWidth: last ? 0 : 1, borderBottomColor: colors.border }}>
      <Row gap={10} style={{ width: isMobile ? undefined : 190 }}>
        <Feather name="message-square" size={18} color={link ? WHATSAPP : colors.textSubtle} />
        <View>
          <Txt variant="bodyStrong">{f(d.common.promo, { year })}</Txt>
          <Txt variant="small" color="textSubtle">{f(d.common.members, { n: members })}</Txt>
        </View>
      </Row>
      <Input
        value={value}
        onChangeText={setValue}
        placeholder="https://chat.whatsapp.com/…"
        autoCapitalize="none"
        keyboardType="url"
        onSubmitEditing={save}
        error={valid ? undefined : d.whatsapp.invalidLink}
        containerStyle={{ flex: 1 }}
      />
      <Button label={d.common.save} icon="check" size="sm" onPress={save} disabled={!changed} style={{ alignSelf: isMobile ? 'flex-start' : 'center' }} />
    </View>
  );
}
