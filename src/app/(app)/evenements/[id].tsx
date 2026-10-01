import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { View } from 'react-native';

import { CATEGORY_TONE, DateBadge } from '@/components/cards';
import { useDialogs } from '@/components/ui/Dialogs';
import { Lightbox } from '@/components/ui/Lightbox';
import { Badge, Button, Card, EmptyState, ListRow, Row, SectionHeader, Tap } from '@/components/ui/primitives';
import { BackLink, Columns, Grid, Screen } from '@/components/ui/Screen';
import { Txt } from '@/components/ui/Txt';
import { fullName, useMe, useStore, useUserMap } from '@/data/store';
import { useI18n } from '@/i18n';
import { addToCalendar, pickImages } from '@/lib/media';
import { useLayout } from '@/theme/layout';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts, radius } from '@/theme/tokens';

export default function EventPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { d, f, formatDate, formatTime } = useI18n();
  const { colors } = useTheme();
  const { isMobile } = useLayout();
  const { db, actions } = useStore();
  const { confirm, toast } = useDialogs();
  const users = useUserMap();
  const me = useMe();
  const [open, setOpen] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const event = db.events.find((e) => e.id === id);
  const photos = useMemo(() => db.photos.filter((p) => p.eventId === id), [db.photos, id]);
  const isAdmin = me.role === 'admin';

  if (!event) {
    return (
      <Screen>
        <BackLink label={d.events.backToEvents} href="/evenements" />
        <EmptyState icon="calendar" title={d.events.notFound} />
      </Screen>
    );
  }

  const upload = async () => {
    const images = await pickImages(true);
    if (!images.length) return;
    setUploading(true);
    const n = await actions.addPhotos(event.id, images);
    setUploading(false);
    toast(n ? f(d.events.photos, { n }) : d.auth.errors.unknown, n ? 'success' : 'danger');
  };

  const removePhoto = async (photoId: string) => {
    if (await confirm({ title: d.events.deletePhoto, danger: true, confirmLabel: d.common.delete })) {
      actions.deletePhoto(photoId);
      setOpen(null);
    }
  };

  const removeEvent = async () => {
    if (await confirm({ title: d.events.deleteEvent, message: event.title, danger: true, confirmLabel: d.common.delete })) {
      actions.deleteEvent(event.id);
      router.replace('/evenements');
    }
  };

  const items = photos.map((p) => ({ id: p.id, uri: p.uri, caption: f(d.events.uploadedBy, { name: fullName(users.get(p.uploadedBy)) }), canDelete: isAdmin || p.uploadedBy === me.id }));
  const visible = photos.slice(0, isMobile ? 8 : 11);
  const extra = photos.length - visible.length;

  return (
    <Screen>
      <BackLink label={d.events.backToEvents} href="/evenements" />

      {/* Cover */}
      <View style={{ height: isMobile ? 280 : 400, borderRadius: radius.hero, overflow: 'hidden', backgroundColor: colors.ink }}>
        <Image source={{ uri: event.cover }} style={{ position: 'absolute', width: '100%', height: '100%' }} contentFit="cover" transition={200} />
        <LinearGradient colors={['rgba(0,18,60,0)', 'rgba(0,18,60,0.92)']} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
        <View style={{ position: 'absolute', top: 20, left: 20 }}>
          <DateBadge iso={event.date} />
        </View>
        <View style={{ flex: 1, justifyContent: 'flex-end', padding: isMobile ? 20 : 36, gap: 10 }}>
          <Badge label={d.events.categories[event.category]} tone={CATEGORY_TONE[event.category]} />
          <Txt style={{ color: '#fff', fontFamily: fonts.serif, fontSize: isMobile ? 36 : 56, lineHeight: isMobile ? 40 : 60, letterSpacing: -0.5 }}>{event.title}</Txt>
          <Row gap={18} wrap>
            <Row gap={6}>
              <Feather name="clock" size={15} color="rgba(255,255,255,0.85)" />
              <Txt style={{ color: 'rgba(255,255,255,0.9)', fontFamily: fonts.semibold, fontSize: 15 }}>{formatDate(event.date, { weekday: true })} · {formatTime(event.date)}</Txt>
            </Row>
            <Row gap={6}>
              <Feather name="map-pin" size={15} color="rgba(255,255,255,0.85)" />
              <Txt style={{ color: 'rgba(255,255,255,0.9)', fontFamily: fonts.semibold, fontSize: 15 }}>{event.location}</Txt>
            </Row>
          </Row>
        </View>
      </View>

      <Columns
        main={
          <>
            <Card>
              <Txt style={{ fontSize: 16, lineHeight: 26 }} color="textMuted">{event.description}</Txt>
              <Row gap={10} wrap style={{ marginTop: 20 }}>
                <Button label={d.events.addToCalendar} icon="calendar" variant="secondary" onPress={() => addToCalendar(event)} />
              </Row>
            </Card>

            {/* Collaborative gallery */}
            <Card>
              <SectionHeader title={d.events.gallery} icon="image" count={f(d.events.photos, { n: photos.length })} />
              <Row gap={10} style={{ justifyContent: 'space-between', marginBottom: 16 }} wrap>
                <Row gap={6} style={{ flexShrink: 1 }}>
                  <Feather name="users" size={13} color={colors.textSubtle} />
                  <Txt variant="small" color="textSubtle" style={{ flexShrink: 1 }}>{d.events.galleryHint}</Txt>
                </Row>
                <Button label={d.events.addPhotos} icon="upload" size="sm" onPress={upload} loading={uploading} />
              </Row>
              {photos.length === 0 ? (
                <EmptyState icon="camera" title={d.events.galleryEmpty} />
              ) : (
                <Grid min={isMobile ? 96 : 150} gap={8}>
                  {visible.map((p, i) => (
                    <Tap key={p.id} onPress={() => setOpen(i)} style={{ aspectRatio: 1, borderRadius: 14, overflow: 'hidden', backgroundColor: colors.surfaceAlt }} hoverStyle={{ opacity: 0.9 }}>
                      <Image source={{ uri: p.uri }} style={{ width: '100%', height: '100%' }} contentFit="cover" transition={200} />
                    </Tap>
                  ))}
                  {extra > 0 && (
                    <Tap onPress={() => setOpen(visible.length)} style={{ aspectRatio: 1, borderRadius: 14, overflow: 'hidden', backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center' }}>
                      <Image source={{ uri: photos[visible.length].uri }} style={{ position: 'absolute', width: '100%', height: '100%', opacity: 0.35 }} contentFit="cover" />
                      <Txt style={{ color: '#fff', fontFamily: fonts.extrabold, fontSize: 24 }}>+{extra}</Txt>
                    </Tap>
                  )}
                </Grid>
              )}
            </Card>
          </>
        }
        aside={
          <>
            <Card>
              <Txt variant="h3" style={{ marginBottom: 4 }}>{d.events.info}</Txt>
              <ListRow icon="calendar" title={formatDate(event.date, { weekday: true })} subtitle={`${d.events.date} · ${formatTime(event.date)}`} />
              <ListRow icon="map-pin" title={event.location} subtitle={d.events.place} />
              <ListRow icon="tag" title={d.events.categories[event.category]} subtitle={d.events.category} last />
            </Card>
            {(isAdmin || event.createdBy === me.id) && (
              <Card style={{ borderColor: colors.borderStrong, borderStyle: 'dashed' }}>
                <Row gap={8} style={{ marginBottom: 12 }}>
                  <Feather name="shield" size={15} color={colors.primary} />
                  <Txt variant="h3">{d.events.manageZone}</Txt>
                </Row>
                <Txt variant="small" color="textMuted" style={{ marginBottom: 14 }}>{d.events.manageHint}</Txt>
                <Button label={d.events.deleteEvent} icon="trash-2" variant="danger" onPress={removeEvent} />
              </Card>
            )}
          </>
        }
      />

      <Lightbox items={items} index={open} onChange={setOpen} onClose={() => setOpen(null)} onDelete={(it) => removePhoto(it.id)} deleteLabel={d.events.deletePhoto} />
    </Screen>
  );
}
