import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, View } from 'react-native';

import { AdminNav } from '@/components/AdminNav';
import { RoleBadge } from '@/components/cards';
import { norm } from '@/components/shell/GlobalSearch';
import { useDialogs } from '@/components/ui/Dialogs';
import { FieldRow, Avatar, Button, Card, Chip, IconButton, Input, Row, SearchBar, Segmented, Tap } from '@/components/ui/primitives';
import { PageHeader, Screen } from '@/components/ui/Screen';
import { DateField, PhoneField } from '@/components/ui/fields';
import { Select } from '@/components/ui/Select';
import { Flag } from '@/components/ui/Flag';
import { Txt } from '@/components/ui/Txt';
import { sortedCountries } from '@/data/countries';
import { formatPhone, isValidPhoneNumber, parseFrDate, requiresContact } from '@/data/members';
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
        .filter((u) => !q || norm(`${fullName(u)} ${u.email} ${u.promo ?? ''} ${u.alumniNumber ?? ''} ${u.bureauCode ?? ''}`).includes(norm(q)))
        .sort((a, b) => a.lastName.localeCompare(b.lastName)),
    [db.users, q, role]
  );

  /**
   * Text windows (fonction, Bureau code…) open above the page, not above the member card:
   * hide the card while one is open, then bring it back.
   */
  const fromCard = async (run: (u: User) => Promise<unknown>) => {
    const u = editing;
    if (!u) return;
    setEditing(null);
    // `true` means the member was deleted: nothing to come back to.
    if ((await run(u)) !== true) setEditing(u);
  };
  const remove = async (u: User) => {
    if (await confirm({ title: d.admin.deleteUser, message: f(d.admin.deleteUserConfirm, { name: fullName(u) }), danger: true, confirmLabel: d.common.delete, typeToConfirm: fullName(u) })) {
      const r = await actions.deleteUser(u.id);
      if (!r.ok) toast(r.detail ? `${d.auth.errors.unknown} (${r.detail})` : d.auth.errors.unknown, 'danger');
      setEditing(null);
      return r.ok;
    }
    return false;
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
            <Txt variant="caption" style={{ width: 90 }}>{d.member.alumniNumber}</Txt>
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
                <View style={{ flex: 1, gap: 4 }}>
                  <RoleBadge role={u.role} />
                  {u.role === 'admin' && u.bureauCode && <Txt variant="small" color="textSubtle">{d.member.bureauCode} {u.bureauCode}</Txt>}
                </View>
                <Txt variant="small" color="textMuted" style={{ width: 90 }}>{u.role !== 'honneur' && u.alumniNumber ? u.alumniNumber : '—'}</Txt>
                <Txt variant="small" color="textMuted" style={{ width: 90 }}>{u.promo ?? '—'}</Txt>
              </>
            )}
            <Row gap={6} style={{ width: isMobile ? undefined : 130, justifyContent: 'flex-end' }}>
              <IconButton icon="sliders" size={34} onPress={() => setEditing(u)} label={d.admin.changeRole} />
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
                {['honneur', 'admin'].includes(db.users.find((u) => u.id === editing.id)?.role ?? '') && (
                  <Button
                    label={d.admin.editFonction}
                    icon="briefcase"
                    variant="secondary"
                    full
                    onPress={() =>
                      fromCard(async (u) => {
                        const v = await prompt({ title: d.admin.editFonction, placeholder: d.admin.fonctionField, initial: db.users.find((x) => x.id === u.id)?.fonction });
                        if (v !== null) {
                          actions.setFonction(u.id, v);
                          toast(d.common.saved);
                        }
                      })
                    }
                  />
                )}
                {db.users.find((u) => u.id === editing.id)?.role === 'admin' && (
                  <Button
                    label={`${d.admin.editBureauCode}${db.users.find((u) => u.id === editing.id)?.bureauCode ? ` (${db.users.find((u) => u.id === editing.id)?.bureauCode})` : ''}`}
                    icon="shield"
                    variant="secondary"
                    full
                    onPress={() =>
                      fromCard(async (u) => {
                        const v = await prompt({ title: d.admin.editBureauCode, placeholder: d.admin.bureauCodeField, initial: db.users.find((x) => x.id === u.id)?.bureauCode });
                        if (v === null) return;
                        const r = await actions.setBureauCode(u.id, v);
                        toast(r.ok ? d.admin.codeSaved : d.auth.errors[r.error], r.ok ? 'success' : 'danger');
                      })
                    }
                  />
                )}
                {editing.id !== me.id && <Button label={d.admin.deleteUser} icon="trash-2" variant="danger" full onPress={() => fromCard(remove)} />}
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
  const blank = { firstName: '', lastName: '', email: '', password: '', dial: '+965', phoneNumber: '', birth: '', bureauCode: '', promo: '', fonction: '', gender: 'F' as Gender, role: 'alumni' as Role, country: 'FR' };
  const [form, setForm] = useState(blank);
  const [error, setError] = useState<AuthError | null>(null);
  const [detail, setDetail] = useState<string | null>(null);
  const set = (k: keyof typeof form) => (v: string) => {
    setForm((x) => ({ ...x, [k]: v }));
    setError(null);
  };
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    const promo = parseInt(form.promo, 10);
    const mandatory = requiresContact(form.role);
    const birthDate = form.birth ? parseFrDate(form.birth) : undefined;
    if (birthDate === null || (mandatory && !birthDate)) return setError('birth_date');
    const hasPhone = form.phoneNumber.trim() !== '';
    if ((mandatory || hasPhone) && !isValidPhoneNumber(form.phoneNumber)) return setError('phone');
    const { dial, phoneNumber, birth, bureauCode, ...rest } = form;
    setBusy(true);
    const r = await actions.createUser({
      ...rest,
      promo: Number.isFinite(promo) ? promo : undefined,
      fonction: form.role === 'honneur' && form.fonction.trim() ? form.fonction.trim() : undefined,
      birthDate,
      phone: hasPhone ? formatPhone(dial, phoneNumber) : undefined,
      bureauCode: form.role === 'admin' && bureauCode.trim() ? bureauCode.trim() : undefined,
    });
    setBusy(false);
    if (!r.ok) {
      setDetail(r.detail ?? null);
      return setError(r.error);
    }
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
              <Input label={d.auth.lastName} value={form.lastName} onChangeText={(v) => set('lastName')(v.toLocaleUpperCase('fr'))} autoCapitalize="characters" containerStyle={{ flex: 1 }} />
            </FieldRow>
            <Input label={d.auth.email} icon="mail" value={form.email} onChangeText={set('email')} autoCapitalize="none" keyboardType="email-address" />
            <Input label={d.admin.initialPassword} icon="lock" value={form.password} onChangeText={set('password')} hint={d.auth.passwordHint} />
            <PhoneField label={d.profile.phone} dial={form.dial} number={form.phoneNumber} onDial={set('dial')} onNumber={set('phoneNumber')} required={requiresContact(form.role)} error={error === 'phone' ? d.auth.errors.phone : undefined} />
            <FieldRow>
              <DateField label={d.profile.birthDate} value={form.birth} onChange={set('birth')} required={requiresContact(form.role)} error={error === 'birth_date' ? d.auth.errors.birth_date : undefined} />
              <Input label={d.profile.promoLabel} icon="award" value={form.promo} onChangeText={set('promo')} keyboardType="number-pad" maxLength={4} containerStyle={{ flex: 1 }} />
            </FieldRow>
            <Select label={d.auth.country} value={form.country} onChange={set('country')} searchable options={sortedCountries(lang).map((c) => ({ value: c.code, label: c.name, leading: <Flag code={c.code} /> }))} />
            <View style={{ gap: 8 }}>
              <Txt variant="smallStrong" color="textMuted">{d.auth.gender}</Txt>
              <Segmented value={form.gender} onChange={(g) => setForm((x) => ({ ...x, gender: g }))} options={[{ value: 'F', label: d.gender.F }, { value: 'M', label: d.gender.M }, { value: 'N', label: d.gender.N }]} />
            </View>
            <View style={{ gap: 8 }}>
              <Txt variant="smallStrong" color="textMuted">{d.admin.role}</Txt>
              <Row gap={8} wrap>
                {ROLES.map((r) => <Chip key={r} label={d.roles[r]} active={form.role === r} onPress={() => setForm((x) => ({ ...x, role: r }))} />)}
              </Row>
            </View>
            {form.role === 'honneur' && <Input label={d.admin.fonctionField} icon="briefcase" value={form.fonction} onChangeText={set('fonction')} />}
            {form.role === 'admin' && <Input label={d.admin.bureauCodeField} icon="shield" value={form.bureauCode} onChangeText={(v) => set('bureauCode')(v.replace(/\D/g, '').slice(0, 4))} keyboardType="number-pad" maxLength={4} />}
            {error && error !== 'phone' && error !== 'birth_date' && <Txt variant="smallStrong" color="danger">{d.auth.errors[error]}{error === 'unknown' && detail ? ` (${detail})` : ''}</Txt>}
            <Button label={d.common.create} icon="user-plus" full size="lg" onPress={submit} loading={busy} disabled={!form.firstName || !form.lastName || !form.email || !form.password} />
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
