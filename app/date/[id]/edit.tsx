import { useLocalSearchParams } from 'expo-router';
import { ActivityIndicator } from 'react-native';
import { DateIdeaForm } from '@/components/dates/date-idea-form';
import { Button } from '@/components/ui/button';
import { Notice } from '@/components/ui/notice';
import { Screen } from '@/components/ui/screen';
import { colors } from '@/constants/theme';
import { useDateIdea } from '@/hooks/use-date-ideas';
export default function EditDateIdeaScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const idea = useDateIdea(id ?? '');
  return <Screen standalone title="Edit date idea" description="Make this plan easy to recognize later.">
    {idea.isPending && <ActivityIndicator color={colors.accent} accessibilityLabel="Loading date idea" />}
    {idea.isError && <><Notice error message="We couldn’t load this idea." /><Button label="Try again" onPress={() => void idea.refetch()} /></>}
    {idea.isSuccess && !idea.data && <Notice error message="This idea is no longer available." />}
    {idea.data && <DateIdeaForm idea={idea.data} />}
  </Screen>;
}
