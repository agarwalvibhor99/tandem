import { router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator } from 'react-native';
import { ItemForm } from '@/components/lists/item-form';
import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { colors } from '@/constants/theme';
import { useList } from '@/hooks/use-lists';
export default function AddItemScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const list = useList(id ?? '');
  return <Screen standalone title="Add an item" description="A little more detail, if it helps.">
    {list.isPending && <ActivityIndicator color={colors.accent} />}
    {list.data && <ItemForm listId={list.data.id} type={list.data.type} onSaved={() => router.back()} />}
    {list.isSuccess && !list.data && <Text>This list is no longer available.</Text>}
    {list.isError && <Text>We couldn’t load this list.</Text>}
  </Screen>;
}
