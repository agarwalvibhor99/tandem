import { router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { ItemForm } from '@/components/lists/item-form';
import { ListItemRow } from '@/components/lists/list-item-row';
import { Button } from '@/components/ui/button';
import { Notice } from '@/components/ui/notice';
import { Screen } from '@/components/ui/screen';
import { Surface } from '@/components/ui/surface';
import { Text } from '@/components/ui/text';
import { colors, spacing } from '@/constants/theme';
import { useList, useListActions, useListItems, usePendingItemCompletions } from '@/hooks/use-lists';
import { listErrorMessage } from '@/lib/lists/errors';
import type { ListItem } from '@/types/list';

export default function ListDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const list = useList(id ?? '');
  const items = useListItems(id ?? '');
  const { complete } = useListActions();
  const pending = usePendingItemCompletions();
  const overrides = new Map(pending.map(({ item, completed }) => [item.id, completed]));
  const rows = (items.data ?? []).map((item) => ({ item, completed: overrides.get(item.id) ?? item.completed }));
  const remaining = rows.filter(({ completed }) => !completed);
  const done = rows.filter(({ completed }) => completed);
  const renderRow = ({ item, completed }: { item: ListItem; completed: boolean }) => <ListItemRow key={item.id} item={item} completed={completed} busy={overrides.has(item.id)} onToggle={() => complete.mutate({ item, completed: !completed })} />;
  return <Screen standalone title={list.data?.name ?? 'List'} description={list.data ? `${list.data.type} · Shared with your space` : 'Your shared list'}>
    {list.isPending && <ActivityIndicator color={colors.accent} accessibilityLabel="Loading list" />}
    {list.isError && <><Notice error message="We couldn’t load this list." /><Button label="Try again" onPress={() => void list.refetch()} /></>}
    {list.isSuccess && !list.data && <Surface><Text variant="heading">List unavailable</Text><Text tone="secondary">It may have been removed, or you may no longer have access.</Text></Surface>}
    {list.data && <>
      <Surface><View style={styles.quickHeader}><Text variant="heading">Quick add</Text><Pressable accessibilityRole="button" accessibilityLabel="Add with details" onPress={() => router.push({ pathname: '/list/[id]/add', params: { id: list.data!.id, details: '1' } })}><Text variant="label" tone="accent">Details</Text></Pressable></View><ItemForm listId={list.data.id} type={list.data.type} compact onSaved={() => void items.refetch()} /></Surface>
      {complete.isError && <Notice error message={listErrorMessage(complete.error)} />}
      {items.isPending && <ActivityIndicator color={colors.accent} accessibilityLabel="Loading items" />}
      {items.isError && <><Notice error message="We couldn’t load your items." /><Button label="Try again" onPress={() => void items.refetch()} /></>}
      {items.isSuccess && rows.length === 0 && <Surface><Text variant="heading">Your list is empty</Text><Text tone="secondary">Add the first thing you need. Your partner will see it here too.</Text></Surface>}
      {rows.length > 0 && <Surface><Text variant="heading">To get · {remaining.length}</Text><View style={styles.rows}>{remaining.map(renderRow)}</View>{done.length > 0 && <><Text variant="heading">Done · {done.length}</Text><View style={styles.rows}>{done.map(renderRow)}</View></>}</Surface>}
      {items.data?.length === 500 && <Text variant="caption" tone="secondary">Showing the first 500 items. Check or remove older items to keep this list manageable.</Text>}
    </>}
  </Screen>;
}
const styles = StyleSheet.create({ rows: { gap: spacing.xs }, quickHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md } });
