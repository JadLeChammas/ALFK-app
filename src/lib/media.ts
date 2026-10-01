import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { Platform, Share } from 'react-native';

import type { PickedDoc, PickedImage } from '@/data/remote';
import { isRemote } from './supabase';

/** Opens the photo library; returns the picked images (empty when cancelled). */
export async function pickImages(multiple = true): Promise<PickedImage[]> {
  // No permission prompt: the system photo picker only returns what the user selects.
  const res = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsMultipleSelection: multiple,
    selectionLimit: multiple ? 10 : 1,
    allowsEditing: !multiple,
    aspect: multiple ? undefined : [1, 1],
    quality: 0.6,
    // Supabase uploads need the bytes; the local demo only keeps the URI.
    base64: isRemote,
  });
  if (res.canceled || !res.assets) return [];
  return res.assets.map((a) => ({ uri: a.uri, base64: a.base64, mimeType: a.mimeType }));
}

/** Largest proof of schooling accepted (the private bucket enforces the same limit). */
export const PROOF_MAX_BYTES = 10 * 1024 * 1024;

/** Proof of schooling: a photo or a scan (image or PDF). Returns null when cancelled. */
export async function pickProof(): Promise<PickedDoc | null> {
  const res = await DocumentPicker.getDocumentAsync({
    type: ['image/*', 'application/pdf'],
    multiple: false,
    copyToCacheDirectory: true,
    // Native uploads to Supabase need the bytes; the web gives a File.
    base64: isRemote && Platform.OS !== 'web',
  });
  if (res.canceled || !res.assets?.[0]) return null;
  const a = res.assets[0];
  return { uri: a.uri, name: a.name, mimeType: a.mimeType, file: a.file, base64: a.base64, size: a.size ?? a.file?.size };
}

/** A CV in PDF. */
export async function pickPdf(): Promise<PickedDoc | null> {
  const res = await DocumentPicker.getDocumentAsync({ type: 'application/pdf', multiple: false, copyToCacheDirectory: true, base64: isRemote && Platform.OS !== 'web' });
  if (res.canceled || !res.assets?.[0]) return null;
  const a = res.assets[0];
  return { uri: a.uri, name: a.name, mimeType: a.mimeType, file: a.file, base64: a.base64, size: a.size ?? a.file?.size };
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
