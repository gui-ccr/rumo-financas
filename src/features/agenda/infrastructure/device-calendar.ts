import * as Calendar from 'expo-calendar/legacy';

import { addDays, parseISODate } from '@/shared/domain/dates';

import type { AgendaRange, DeviceEventSource } from '../domain/agenda';

export type CalendarStatus = 'granted' | 'denied' | 'undetermined';

/**
 * Uses the legacy module on purpose: in Expo Go the newer CalendarNext API is a stub,
 * while the legacy module reads the device calendars there too.
 */
function toStatus(granted: boolean, status: string): CalendarStatus {
  if (granted) return 'granted';
  return status === 'denied' ? 'denied' : 'undetermined';
}

/** Reads the permission without showing a prompt. */
export async function readCalendarPermission(): Promise<CalendarStatus> {
  const res = await Calendar.getCalendarPermissionsAsync();
  return toStatus(res.granted, String(res.status));
}

/** Shows the system prompt. Only called when the user asks for their agenda. */
export async function requestCalendarAccess(): Promise<CalendarStatus> {
  const res = await Calendar.requestCalendarPermissionsAsync();
  return toStatus(res.granted, String(res.status));
}

/**
 * Events from every calendar on the device (Google Calendar syncs here on Android, and
 * Notion Calendar shows up through the Google account). Read only. Returns [] without permission.
 */
export async function readDeviceEvents(range: AgendaRange): Promise<DeviceEventSource[]> {
  if ((await readCalendarPermission()) !== 'granted') return [];

  const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
  if (calendars.length === 0) return [];
  const colorById = new Map(calendars.map((c) => [c.id, c.color]));

  const from = parseISODate(range.start);
  const to = parseISODate(addDays(range.end, 1)); // exclusive upper bound
  const events = await Calendar.getEventsAsync(
    calendars.map((c) => c.id),
    from,
    to,
  );

  return events.map((e) => ({
    id: e.id,
    title: e.title,
    start: new Date(e.startDate),
    end: new Date(e.endDate),
    allDay: e.allDay,
    color: colorById.get(e.calendarId),
  }));
}
