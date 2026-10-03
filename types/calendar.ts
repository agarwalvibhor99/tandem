export type CalendarVisibility = 'private' | 'shared';
export type CalendarEvent = {
  id: string; couple_id: string | null; owner_id: string; title: string;
  start_at: string; end_at: string; visibility: CalendarVisibility;
  location: string; notes: string; created_at: string; updated_at: string;
};
export type CalendarEventInput = Pick<CalendarEvent, 'couple_id' | 'title' | 'start_at' | 'end_at' | 'visibility' | 'location' | 'notes'>;
export type CalendarEntry = {
  id: string | null; couple_id: string | null; owner_id: string; title: string;
  start_at: string; end_at: string; visibility: CalendarVisibility;
  location: string | null; notes: string | null; created_at: string | null; updated_at: string | null;
};
export type TimeInterval = { start: Date; end: Date };
