import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';

import { useContainer } from '@/core/container-context';
import { addDays, parseISODate, type ISODate } from '@/shared/domain/dates';

import { buildAgendaDays, type AgendaItem, type AgendaRange, type AgendaSources } from '../domain/agenda';
import { readCalendarPermission, readDeviceEvents, requestCalendarAccess, type CalendarStatus } from '../infrastructure/device-calendar';

/**
 * Calendar permission. Reads the current state on mount but never prompts by itself:
 * call `request` only when the user opens the agenda and wants their events.
 */
export function useCalendarPermission() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<CalendarStatus>('undetermined');

  useEffect(() => {
    let alive = true;
    readCalendarPermission()
      .then((s) => alive && setStatus(s))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const request = useCallback(async () => {
    const next = await requestCalendarAccess();
    setStatus(next);
    // Events for the visible days were fetched without permission; refetch them now.
    if (next === 'granted') await queryClient.invalidateQueries({ queryKey: ['agenda'] });
    return next;
  }, [queryClient]);

  return { status, request };
}

/** Device events in [start, end] (inclusive days). Empty until the user grants calendar access. */
export function useDeviceEvents(start: ISODate, end: ISODate) {
  return useQuery({
    queryKey: ['agenda', 'events', start, end],
    queryFn: () => readDeviceEvents({ start, end }),
    staleTime: 0,
  });
}

/** Local midnight of a day, as UTC ISO, for comparing against stored reminder times. */
function localMidnightIso(day: ISODate): string {
  return parseISODate(day).toISOString();
}

/**
 * Everything the agenda shows for a range of days, joined per day: device events (when
 * allowed), bills still to pay, incomes still expected, and note reminders.
 */
function useAgendaSources(range: AgendaRange) {
  const { repos } = useContainer();
  return useQuery({
    queryKey: ['agenda', 'items', range.start, range.end],
    queryFn: async () => {
      const [events, bills, incomes, notes] = await Promise.all([
        readDeviceEvents(range),
        repos.bills.occurrencesWithOverdue(range.start, range.end),
        repos.incomes.listPending(),
        repos.notes.listReminders(localMidnightIso(range.start), localMidnightIso(addDays(range.end, 1))),
      ]);
      const sources: AgendaSources = {
        events,
        bills: bills.map((b) => ({
          id: b.id,
          billId: b.billId,
          name: b.billName,
          dueDate: b.dueDate,
          amountCents: b.amountCents,
          paid: b.status === 'paid',
          priority: b.priority,
        })),
        incomes: incomes.map((i) => ({
          id: i.id,
          name: i.incomeName,
          expectedDate: i.expectedDate,
          expectedCents: i.expectedCents,
          received: i.status === 'received',
        })),
        notes: notes.map((n) => ({ id: n.id, title: n.title, remindAt: n.remindAt, done: n.done })),
      };
      return buildAgendaDays(range, sources);
    },
    // Bills and incomes change elsewhere, so the agenda re-reads whenever it is shown again.
    staleTime: 0,
  });
}

/** The week that starts on `start` (seven days). Data is a map from each day to its items. */
export function useAgendaWeek(start: ISODate) {
  return useAgendaSources({ start, end: addDays(start, 6) });
}

/** One day. `items` is that day's list, in display order. */
export function useAgendaDay(date: ISODate) {
  const query = useAgendaSources({ start: date, end: date });
  const items: AgendaItem[] = query.data?.get(date) ?? [];
  return { ...query, items };
}
