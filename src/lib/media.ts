import * as ImagePicker from 'expo-image-picker';
import { Platform, Share } from 'react-native';

/** Opens the photo library; returns picked image URIs (empty when cancelled). */
export async function pickImages(multiple = true): Promise<string[]> {
  if (Platform.OS !== 'web') {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return [];
  }
  const res = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsMultipleSelection: multiple,
    selectionLimit: multiple ? 10 : 1,
    allowsEditing: !multiple,
    aspect: multiple ? undefined : [1, 1],
    quality: 0.6,
  });
  if (res.canceled || !res.assets) return [];
  return res.assets.map((a) => a.uri);
}

/** Adds an event to the user's calendar: downloads an .ics on web, opens the share sheet on native. */
export async function addToCalendar(ev: { title: string; date: string; location: string; description: string }) {
  const start = new Date(ev.date);
  const end = new Date(start.getTime() + 3 * 3_600_000);
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const esc = (s: string) => s.replace(/([,;\\])/g, '\\$1').replace(/\n/g, '\\n');
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Amicale LFK//FR',
    'BEGIN:VEVENT',
    `UID:${fmt(start)}-${Math.random().toString(36).slice(2)}@amicale-lfk`,
    `DTSTAMP:${fmt(new Date())}`,
    `DTSTART:${fmt(start)}`,
    `DTEND:${fmt(end)}`,
    `SUMMARY:${esc(ev.title)}`,
    `LOCATION:${esc(ev.location)}`,
    `DESCRIPTION:${esc(ev.description)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
  if (Platform.OS === 'web') {
    const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `${ev.title.replace(/[^\w-]+/g, '_')}.ics`;
    a.click();
    URL.revokeObjectURL(url);
    return;
  }
  await Share.share({ title: ev.title, message: `${ev.title}\n${start.toLocaleString()}\n${ev.location}` });
}
