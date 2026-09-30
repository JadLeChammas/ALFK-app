import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, View } from 'react-native';

import { AdminNav } from '@/components/AdminNav';
import { RoleBadge } from '@/components/cards';
import { norm } from '@/components/shell/GlobalSearch';
import { useDialogs } from '@/components/ui/Dialogs';
import { FieldRow, Avatar, Button, Card, Chip, IconButton, Input, Row, SearchBar, Segmented, Tap } from '@/components/ui/primitives';
import { PageHeader, Screen } from '@/components/ui/Screen';
import { Select } from '@/components/ui/Select';
import { Flag } from '@/components/ui/Flag';
import { Txt } from '@/components/ui/Txt';
import { COUNTRIES } from '@/data/countries';
import { fullName, useMe, useStore, type AuthError } from '@/data/store';
import type { Gender, Role, User } from '@/data/types';
import { useI18n } from '@/i18n';
import { useLayout } from '@/theme/layout';
import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';

const ROLES: Role[] = ['alumni', 'eleve', 'honneur', 'admin'];

export default function ManageMembers() {
  const { d, f } = useI18n();
  const { colors } = useTheme();
  const { isMobile } = useLayout();
  const { db, actions } = useStore();
  const { confirm, prompt, toast } = useDialogs();
  const me = useMe();
  const [q, setQ] = useState('');
  const [role, setRole] = useState<Role | 'all'>('all');
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);

  const list = useMemo(
    () =>
      db.users
        .filter((u) => u.approved)
        .filter((u) => role === 'all' || u.role === role)
        .filter((u) => !q || norm(`${fullName(u)} ${u.email} ${u.promo ?? ''}`).includes(norm(q)))
        .sort((a, b) => a.lastName.localeCompare(b.lastName)),
    [db.users, q, role]
  );

  const resetPassword = async (u: User) => {
    const pw = await prompt({ title: d.admin.resetPassword, message: fullName(u), placeholder: d.auth.passwordHint, secure: true });
    if (!pw) return;
    const r = actions.adminResetPassword(u.id, pw);
    toast(r.ok ? d.admin.passwordReset : d.auth.errors[r.error], r.ok ? 'success' : 'danger');
  };
  const remove = async (u: User) => {
    if (await confirm({ title: d.admin.deleteUser, message: f(d.admin.deleteUserConfirm, { name: fullName(u) }), danger: true, confirmLabel: d.common.delete })) {
      actions.deleteUser(u.id);
      setEditing(null);
    }
  };

  return (
    <Screen>
      <PageHeader title={d.admin.members} subtitle={d.admin.membersSub} right={<Button label={d.admin.createUser} icon="user-plus" onPress={() => setCreating(true)} />} />
      <AdminNav />
      <Row gap={10} wrap>
        <SearchBar value={q} onChangeText={setQ} placeholder={d.common.search} style={{ flex: 1, minWidth: 220 }} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          <Chip label={d.common.all} active={role === 'all'} onPress={() => setRole('all')} />
          {ROLES.map((r) => (
            <Chip key={r} label={d.roles[r]} active={role === r} onPress={() => setRole(r)} count={db.users.filter((u) => u.approved && u.role === r).length} />
          ))}
        </ScrollView>
      </Row>

      <Card padded={false}>
        {!isMobile && (
          <Row style={{ paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.surfaceAlt }}>
            <Txt variant="caption" style={{ flex: 2 }}>{d.nav.members}</Txt>
            <Txt variant="caption" style={{ flex: 1 }}>{d.admin.role}</Txt>
            <Txt variant="caption" style={{ width: 90 }}>{d.profile.promoLabel}</Txt>
            <Txt variant="caption" style={{ width: 130, textAlign: 'right' }}> </Txt>
          </Row>
        )}
        {list.map((u, i) => (
          <Row key={u.id} gap={12} style={{ paddingHorizontal: isMobile ? 14 : 20, paddingVertical: 12, borderBottomWidth: i === list.length - 1 ? 0 : 1, borderBottomColor: colors.border }}>
            <Tap onPress={() => router.push(`/membre/${u.id}`)} style={{ flex: 2, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Avatar uri={u.avatar} name={fullName(u)} size={38} />
              <View style={{ flex: 1 }}>
                <Txt variant="bodyStrong" numberOfLines={1} style={{ fontSize: 14 }}>{fullName(u)}{u.id === me.id ? ` (${d.common.you})` : ''}</Txt>
                <Txt variant="small" color="textSubtle" numberOfLines={1}>{u.email}</Txt>
              </View>
            </Tap>
            {!isMobile && (
              <>
                <View style={{ flex: 1 }}><RoleBadge role={u.role} /></View>
                <Txt variant="small" color="textMuted" style={{ width: 90 }}>{u.promo ?? '—'}</Txt>
              </>
            )}
            <Row gap={6} style={{ width: isMobile ? undefined : 130, justifyContent: 'flex-end' }}>
              <IconButton icon="sliders" size={34} onPress={() => setEditing(u)} label={d.admin.changeRole} />
              {!isMobile && <IconButton icon="key" size={34} onPress={() => resetPassword(u)} label={d.admin.resetPassword} />}
              {!isMobile && u.id !== me.id && <IconButton icon="trash-2" size={34} onPress={() => remove(u)} color={colors.danger} label={d.admin.deleteUser} />}
            </Row>
          </Row>
        ))}
      </Card>

      {/* Per-member controls */}
      <Modal visible={!!editing} transparent animationType="fade" onRequestClose={() => setEditing(null)}>
        <Pressable onPress={() => setEditing(null)} style={{ flex: 1, backgroundColor: colors.overlay, alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <Pressable onPress={() => {}} style={{ width: '100%', maxWidth: 440, backgroundColor: colors.surface, borderRadius: radius.hero, padding: 24, gap: 18, borderWidth: 1, borderColor: colors.border }}>
            {editing && (
              <>
                <Row gap={12}>
                  <Avatar uri={editing.avatar} name={fullName(editing)} size={48} />
                  <View style={{ flex: 1 }}>
                    <Txt variant="h3">{fullName(editing)}</Txt>
                    <Txt variant="small" color="textSubtle">{editing.email}</Txt>
                  </View>
                  <IconButton icon="x" size={36} onPress={() => setEditing(null)} />
                </Row>
                <View style={{ gap: 8 }}>
                  <Txt variant="smallStrong" color="textMuted">{d.admin.changeRole}</Txt>
                  <Row gap={8} wrap>
                    {ROLES.map((r) => (
                      <Chip
                        key={r}
                        label={d.roles[r]}
                        active={db.users.find((u) => u.id === editing.id)?.role === r}
                        onPress={() => {
                          actions.setRole(editing.id, r);
                          toast(d.common.saved);
                        }}
                      />
                    ))}
                  </Row>
                </View>
                {db.users.find((u) => u.id === editing.id)?.role === 'honneur' && (
                  <Button
                    label={d.admin.editFonction}
                    icon="briefcase"
                    variant="secondary"
                    full
                    onPress={async () => {
                      const v = await prompt({ title: d.admin.editFonction, placeholder: d.admin.fonctionField, initial: db.users.find((u) => u.id === editing.id)?.fonction });
                      if (v !== null) {
                        actions.setFonction(editing.id, v);
                        toast(d.common.saved);
                      }
                    }}
                  />
                )}
                <Button label={d.admin.resetPassword} icon="key" variant="secondary" full onPress={() => resetPassword(editing)} />
                {editing.id !== me.id && <Button label={d.admin.deleteUser} icon="trash-2" variant="danger" full onPress={() => remove(editing)} />}
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      <CreateUserModal visible={creating} onClose={() => setCreating(false)} />
    </Screen>
  );
}

function CreateUserModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { d, lang } = useI18n();
  const { colors } = useTheme();
  const { actions } = useStore();
  const { toast } = useDialogs();
  const blank = { firstName: '', lastName: '', email: '', password: '', phone: '', promo: '', fonction: '', gender: 'F' as Gender, role: 'alumni' as Role, country: 'FR' };
  const [form, setForm] = useState(blank);
  const [error, setError] = useState<AuthError | null>(null);
  const set = (k: keyof typeof form) => (v: string) => {
    setForm((x) => ({ ...x, [k]: v }));
    setError(null);
  };
  const submit = () => {
    const promo = parseInt(form.promo, 10);
    const r = actions.createUser({ ...form, promo: Number.isFinite(promo) ? promo : undefined, fonction: form.role === 'honneur' && form.fonction.trim() ? form.fonction.trim() : undefined });
    if (!r.ok) return setError(r.error);
    toast(d.admin.userCreated);
    setForm(blank);
    onClose();
  };
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: colors.overlay, alignItems: 'center', justifyContent: 'center', padding: 16 }}>
        <Pressable onPress={() => {}} style={{ width: '100%', maxWidth: 560, maxHeight: '92%', backgroundColor: colors.surface, borderRadius: radius.hero, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' }}>
          <Row style={{ justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderBottomColor: colors.border }}>
            <View>
              <Txt variant="h2">{d.admin.createUser}</Txt>
              <Txt variant="small" color="textMuted">{d.admin.createUserSub}</Txt>
            </View>
            <IconButton icon="x" onPress={onClose} size={36} />
          </Row>
          <ScrollView contentContainerStyle={{ padding: 20, gap: 14 }} keyboardShouldPersistTaps="handled">
            <FieldRow>
              <Input label={d.auth.firstName} value={form.firstName} onChangeText={set('firstName')} containerStyle={{ flex: 1 }} />
              <Input label={d.auth.lastName} value={form.lastName} onChangeText={set('lastName')} containerStyle={{ flex: 1 }} />
            </FieldRow>
            <Input label={d.auth.email} icon="mail" value={form.email} onChangeText={set('email')} autoCapitalize="none" keyboardType="email-address" />
            <Input label={d.admin.initialPassword} icon="lock" value={form.password} onChangeText={set('password')} hint={d.auth.passwordHint} />
            <FieldRow>
              <Input label={d.profile.phone} icon="phone" value={form.phone} onChangeText={set('phone')} containerStyle={{ flex: 1 }} />
              <Input label={d.profile.promoLabel} icon="award" value={form.promo} onChangeText={set('promo')} keyboardType="number-pad" maxLength={4} containerStyle={{ flex: 1 }} />
            </FieldRow>
            <Select label={d.auth.country} value={form.country} onChange={set('country')} searchable options={COUNTRIES.map((c) => ({ value: c.code, label: c[lang], leading: <Flag code={c.code} /> }))} />
            <View style={{ gap: 8 }}>
              <Txt variant="smallStrong" color="textMuted">{d.auth.gender}</Txt>
              <Segmented value={form.gender} onChange={(g) => setForm((x) => ({ ...x, gender: g }))} options={[{ value: 'F', label: d.gender.F }, { value: 'M', label: d.gender.M }]} />
            </View>
            <View style={{ gap: 8 }}>
              <Txt variant="smallStrong" color="textMuted">{d.admin.role}</Txt>
              <Row gap={8} wrap>
                {ROLES.map((r) => <Chip key={r} label={d.roles[r]} active={form.role === r} onPress={() => setForm((x) => ({ ...x, role: r }))} />)}
              </Row>
            </View>
            {form.role === 'honneur' && <Input label={d.admin.fonctionField} icon="briefcase" value={form.fonction} onChangeText={set('fonction')} />}
            {error && <Txt variant="smallStrong" color="danger">{d.auth.errors[error]}</Txt>}
            <Button label={d.common.create} icon="user-plus" full size="lg" onPress={submit} disabled={!form.firstName || !form.lastName || !form.email || !form.password} />
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
