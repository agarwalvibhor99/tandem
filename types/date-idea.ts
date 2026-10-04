export const dateCategories = ['food', 'outdoor', 'entertainment', 'trip', 'at_home', 'activity', 'other'] as const;
export const dateStatuses = ['want_to_do', 'planned', 'done'] as const;
export const dateCostLevels = [1, 2, 3, 4] as const;
export type DateCategory = typeof dateCategories[number];
export type DateStatus = typeof dateStatuses[number];
export type DateCostLevel = typeof dateCostLevels[number];
export type DateMood = 'any' | 'relaxed' | 'active' | 'explore';
export type DateIdea = {
  id: string;
  couple_id: string;
  created_by: string | null;
  title: string;
  category: DateCategory;
  cost_level: DateCostLevel;
  duration_minutes: number;
  location: string;
  notes: string;
  status: DateStatus;
  created_at: string;
  updated_at: string;
};
export type DateIdeaInput = Pick<DateIdea, 'couple_id' | 'title' | 'category' | 'cost_level' | 'duration_minutes' | 'location' | 'notes' | 'status'>;
export const dateCategoryLabel: Record<DateCategory, string> = {
  food: 'Food', outdoor: 'Outdoor', entertainment: 'Entertainment', trip: 'Trip',
  at_home: 'At Home', activity: 'Activity', other: 'Other',
};
export const dateStatusLabel: Record<DateStatus, string> = {
  want_to_do: 'Want to do', planned: 'Planned', done: 'Done',
};
export const dateCostLabel: Record<DateCostLevel, string> = { 1: '$', 2: '$$', 3: '$$$', 4: '$$$$' };
