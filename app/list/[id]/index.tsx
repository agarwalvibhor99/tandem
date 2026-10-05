import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { ItemForm } from '@/components/lists/item-form';
import { ListItemRow } from '@/components/lists/list-item-row';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { LoadingState } from '@/components/ui/loading-state';
import { Notice } from '@/components/ui/notice';
import { Screen } from '@/components/ui/screen';
import { Surface } from '@/components/ui/surface';
import { Text } from '@/components/ui/text';
import { spacing } from '@/constants/theme';
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
    {list.isPending && <LoadingState label="Loading list" />}
    {list.isError && <ErrorState message="We couldn’t load this list." onRetry={() => void list.refetch()} />}
    {list.isSuccess && !list.data && <EmptyState title="List unavailable" description="It may have been removed, or you may no longer have access." action={{ label: 'Back to lists', onPress: () => router.replace('/lists') }} />}
    {list.data && <>
      <Surface><View style={styles.quickHeader}><Text variant="heading">Quick add</Text><Pressable accessibilityRole="button" accessibilityLabel="Add with details" onPress={() => router.push({ pathname: '/list/[id]/add', params: { id: list.data!.id, details: '1' } })}><Text variant="label" tone="accent">Details</Text></Pressable></View><ItemForm listId={list.data.id} type={list.data.type} compact onSaved={() => void items.refetch()} /></Surface>
      {complete.isError && <Notice error message={listErrorMessage(complete.error)} />}
      {items.isPending && <LoadingState label="Loading items" />}
      {items.isError && <ErrorState message="We couldn’t load your items." onRetry={() => void items.refetch()} />}
      {items.isSuccess && rows.length === 0 && <EmptyState title="Your list is empty" description="Add the first thing you need. Your partner will see it here too." />}
      {rows.length > 0 && <Surface><Text variant="heading">To get · {remaining.length}</Text><View style={styles.rows}>{remaining.map(renderRow)}</View>{done.length > 0 && <><Text variant="heading">Done · {done.length}</Text><View style={styles.rows}>{done.map(renderRow)}</View></>}</Surface>}
      {items.data?.length === 500 && <Text variant="caption" tone="secondary">Showing the first 500 items. Check or remove older items to keep this list manageable.</Text>}
    </>}
  </Screen>;
}
const styles = StyleSheet.create({ rows: { gap: spacing.xs }, quickHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md } });
