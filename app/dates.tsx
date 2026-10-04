import { router } from 'expo-router';
import { CalendarSearch, Coffee } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { DateIdeaCard } from '@/components/dates/date-idea-card';
import { Button } from '@/components/ui/button';
import { ChoiceChips } from '@/components/ui/choice-chips';
import { CompactAction } from '@/components/ui/compact-action';
import { Notice } from '@/components/ui/notice';
import { Screen } from '@/components/ui/screen';
import { Surface } from '@/components/ui/surface';
import { Text } from '@/components/ui/text';
import { colors, spacing } from '@/constants/theme';
import { useDateIdeaActions, useDateIdeas } from '@/hooks/use-date-ideas';
import { dateIdeaErrorMessage } from '@/lib/dates/errors';
import { dateCategories, dateCategoryLabel, dateCostLabel, dateCostLevels, dateStatuses, dateStatusLabel, type DateCategory, type DateStatus } from '@/types/date-idea';

type DurationFilter = 'any' | 'short' | 'medium' | 'long';
export default function DatesScreen() {
  const ideas = useDateIdeas();
  const { setStatus } = useDateIdeaActions();
  const [status, chooseStatus] = useState<DateStatus | 'all'>('want_to_do');
  const [category, chooseCategory] = useState<DateCategory | 'any'>('any');
  const [cost, chooseCost] = useState('any');
  const [duration, chooseDuration] = useState<DurationFilter>('any');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const connected = !!ideas.couple.data;
  const rows = (ideas.query.data ?? []).filter((idea) => (status === 'all' || idea.status === status)
    && (category === 'any' || idea.category === category)
    && (cost === 'any' || idea.cost_level <= Number(cost))
    && (duration === 'any' || (duration === 'short' && idea.duration_minutes <= 90)
      || (duration === 'medium' && idea.duration_minutes > 90 && idea.duration_minutes <= 180)
      || (duration === 'long' && idea.duration_minutes > 180)));
  const refreshing = ideas.couple.isFetching || ideas.query.isFetching;
  const refresh = () => { void ideas.couple.refetch(); void ideas.query.refetch(); };
  return <Screen standalone title="Date ideas" description="A shared place for the things you want to try together." refreshing={refreshing} onRefresh={refresh}>
    {ideas.couple.isPending && <ActivityIndicator color={colors.accent} accessibilityLabel="Loading shared space" />}
    {ideas.couple.isError && <><Notice error message="We couldn’t load your shared space." /><Button label="Try again" onPress={() => void ideas.couple.refetch()} /></>}
    {ideas.couple.isSuccess && !connected && <Surface><Text variant="heading">Start collecting ideas together</Text><Text tone="secondary">Create your shared space to save places and plans you’d both like to try.</Text><Button label="Create your shared space" onPress={() => router.push('/create-space')} /></Surface>}
    {connected && <>
      <View style={styles.actions}>
        <CompactAction icon={Coffee} label="Save idea" onPress={() => router.push('/date/new')} />
        <CompactAction icon={CalendarSearch} label="Plan date" onPress={() => router.push('/date-planner')} />
      </View>
      <ChoiceChips label="Show" value={status} options={[{ value: 'all', label: 'All' }, ...dateStatuses.map((value) => ({ value, label: dateStatusLabel[value] }))]} onChange={chooseStatus} />
      <Button label={filtersOpen ? 'Hide filters' : 'Filter ideas'} variant="quiet" accessibilityState={{ expanded: filtersOpen }} onPress={() => setFiltersOpen(!filtersOpen)} />
      {filtersOpen && <Surface>
        <ChoiceChips label="Category" value={category} options={[{ value: 'any', label: 'Any' }, ...dateCategories.map((value) => ({ value, label: dateCategoryLabel[value] }))]} onChange={chooseCategory} />
        <ChoiceChips label="Budget up to" value={cost} options={[{ value: 'any', label: 'Any' }, ...dateCostLevels.map((value) => ({ value: String(value), label: dateCostLabel[value] }))]} onChange={chooseCost} />
        <ChoiceChips label="Time needed" value={duration} options={[{ value: 'any', label: 'Any' }, { value: 'short', label: '90 min or less' }, { value: 'medium', label: '90 min–3 hr' }, { value: 'long', label: 'Over 3 hr' }]} onChange={chooseDuration} />
      </Surface>}
      {ideas.query.isPending && <ActivityIndicator color={colors.accent} accessibilityLabel="Loading date ideas" />}
      {ideas.query.isError && <><Notice error message="We couldn’t load your date ideas." /><Button label="Try again" variant="quiet" onPress={() => void ideas.query.refetch()} /></>}
      {setStatus.error && <Notice error message={dateIdeaErrorMessage(setStatus.error)} />}
      {ideas.query.isSuccess && !ideas.query.data.length && <Surface><Text variant="heading">Your next favorite thing starts here</Text><Text tone="secondary">Save a restaurant, a walk, a movie, or a little plan at home. You can decide when to go later.</Text><Button label="Save your first idea" variant="quiet" onPress={() => router.push('/date/new')} /></Surface>}
      {ideas.query.isSuccess && !!ideas.query.data.length && !rows.length && <Surface><Text variant="heading">No ideas match these filters</Text><Text tone="secondary">Try a different budget, duration, category, or status.</Text><Button label="Show all ideas" variant="quiet" onPress={() => { chooseStatus('all'); chooseCategory('any'); chooseCost('any'); chooseDuration('any'); }} /></Surface>}
      {rows.map((idea) => <DateIdeaCard key={idea.id} idea={idea} saving={setStatus.isPending && setStatus.variables?.idea.id === idea.id} onDone={idea.status === 'done' ? undefined : () => setStatus.mutate({ idea, status: 'done' })} />)}
      {ideas.query.isSuccess && ideas.query.data.length === 200 && <Text variant="caption" tone="secondary">Showing the 200 most recently saved ideas.</Text>}
    </>}
  </Screen>;
}
const styles = StyleSheet.create({ actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm } });
