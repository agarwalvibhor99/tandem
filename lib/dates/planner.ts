import type { TimeInterval } from '../../types/calendar.ts';
import type { DateCategory, DateCostLevel, DateIdea, DateMood } from '../../types/date-idea.ts';

export type DateMatch = { idea: DateIdea; slot: TimeInterval };
export type PlanPreferences = { budget: DateCostLevel; category: DateCategory | 'any'; mood: DateMood };

const moodCategories: Record<Exclude<DateMood, 'any'>, readonly DateCategory[]> = {
  relaxed: ['food', 'at_home', 'entertainment'],
  active: ['outdoor', 'activity'],
  explore: ['trip', 'outdoor', 'activity', 'food'],
};

/** Pure, predictable matching. A result always fits wholly inside a common free block. */
export function recommendDateIdeas(ideas: readonly DateIdea[], freeBlocks: readonly TimeInterval[], preferences: PlanPreferences): DateMatch[] {
  return ideas
    .filter((idea) => idea.status !== 'done' && idea.cost_level <= preferences.budget)
    .filter((idea) => preferences.category === 'any' || idea.category === preferences.category)
    .filter((idea) => preferences.mood === 'any' || moodCategories[preferences.mood].includes(idea.category))
    .flatMap((idea) => {
      const block = freeBlocks.find(({ start, end }) => end.getTime() - start.getTime() >= idea.duration_minutes * 60_000);
      return block ? [{ idea, slot: { start: block.start, end: new Date(block.start.getTime() + idea.duration_minutes * 60_000) } }] : [];
    })
    .sort((a, b) => {
      const statusRank = Number(a.idea.status === 'planned') - Number(b.idea.status === 'planned');
      return statusRank || a.idea.cost_level - b.idea.cost_level || a.idea.duration_minutes - b.idea.duration_minutes || a.idea.title.localeCompare(b.idea.title);
    });
}
