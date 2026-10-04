export const reminderRecurrences = ['none', 'daily', 'weekly', 'monthly'] as const;
export type ReminderRecurrence = (typeof reminderRecurrences)[number];
export type ReminderVisibility = 'private' | 'shared';

export type Reminder = {
  id: string;
  couple_id: string | null;
  created_by: string;
  assigned_to: string | null;
  title: string;
  notes: string;
  remind_at: string;
  visibility: ReminderVisibility;
  recurrence: ReminderRecurrence;
  completed: boolean;
  created_at: string;
  updated_at: string;
};

export type UpcomingReminder = Reminder & { next_occurrence_at: string };

export type ReminderInput = Pick<Reminder, 'couple_id' | 'assigned_to' | 'title' | 'notes' | 'remind_at' | 'visibility' | 'recurrence'>;
