import type { Task, TaskInput } from './task';
import type { ListInput, ListItem, ListItemInput, SharedList } from './list';
import type { CalendarEntry, CalendarEvent, CalendarEventInput } from './calendar';
import type { Expense, ExpenseSplit, ExpenseSummaryRow } from './expense';
import type { Reminder, ReminderInput } from './reminder';
import type { DateIdea, DateIdeaInput } from './date-idea';

/** Matches the checked-in migrations. Regenerate from the live schema after deployment. */
export type Profile = {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  timezone: string;
  couple_onboarding_skipped_at: string | null;
  created_at: string;
  updated_at: string;
};

export type Couple = { id: string; name: string; created_by: string | null; created_at: string; updated_at: string };
export type CoupleMembership = { id: string; couple_id: string; user_id: string; role: 'owner' | 'member'; joined_at: string };
export type CoupleMember = CoupleMembership & { name: string };
export type CoupleInvite = { id: string; couple_id: string; invite_code: string; created_by: string | null; expires_at: string; accepted_at: string | null; created_at: string };
type ReadOnlyTable<Row> = { Row: Row; Insert: never; Update: never; Relationships: [] };

export type Database = {
  public: {
    Tables: {
      calendar_events: { Row: CalendarEvent; Insert: CalendarEventInput & { id?: string }; Update: Partial<CalendarEventInput>; Relationships: [] };
      expenses: { Row: Expense; Insert: never; Update: never; Relationships: [] };
      expense_splits: { Row: ExpenseSplit; Insert: never; Update: never; Relationships: [] };
      reminders: { Row: Reminder; Insert: ReminderInput; Update: Partial<ReminderInput & Pick<Reminder, 'completed'>>; Relationships: [] };
      date_ideas: { Row: DateIdea; Insert: DateIdeaInput; Update: Partial<Omit<DateIdeaInput, 'couple_id'>>; Relationships: [] };
      lists: { Row: SharedList; Insert: ListInput; Update: never; Relationships: [] };
      list_items: { Row: ListItem; Insert: ListItemInput; Update: Partial<Pick<ListItem, 'name' | 'quantity' | 'category' | 'notes' | 'completed'>>; Relationships: [] };
      tasks: { Row: Task; Insert: TaskInput & { id?: string; status?: Task['status'] }; Update: Partial<TaskInput & { status: Task['status'] }>; Relationships: [] };
      couples: ReadOnlyTable<Couple>;
      couple_memberships: ReadOnlyTable<CoupleMembership>;
      couple_invites: ReadOnlyTable<CoupleInvite>;
      profiles: {
        Row: Profile;
        Insert: { id: string; name: string; email: string; avatar_url?: string | null; timezone?: string; created_at?: string; updated_at?: string };
        Update: Partial<Pick<Profile, 'name' | 'avatar_url' | 'timezone' | 'couple_onboarding_skipped_at'>>;
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      get_calendar_window: { Args: { window_start: string; window_end: string }; Returns: CalendarEntry[] };
      remaining_grocery_items: { Args: Record<string, never>; Returns: number };
      create_couple: { Args: { space_name: string }; Returns: string };
      generate_couple_invite: { Args: Record<string, never>; Returns: CoupleInvite };
      accept_couple_invite: { Args: { code: string }; Returns: string };
      get_couple_members: { Args: Record<string, never>; Returns: CoupleMember[] };
      create_expense: { Args: { p_title: string; p_amount: number; p_currency: string; p_category: string; p_expense_date: string; p_notes: string; p_paid_by: string; p_visibility: string; p_splits: unknown }; Returns: string };
      update_expense: { Args: { p_expense_id: string; p_title: string; p_amount: number; p_currency: string; p_category: string; p_expense_date: string; p_notes: string; p_paid_by: string; p_visibility: string; p_splits: unknown }; Returns: string };
      delete_expense: { Args: { p_expense_id: string }; Returns: undefined };
      get_expense_summary: { Args: { month_start: string; p_visibility: string }; Returns: ExpenseSummaryRow[] };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
