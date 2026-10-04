import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Platform } from 'react-native';
import { ItemForm } from '@/components/lists/item-form';
import { ActionPanel } from '@/components/ui/action-panel';
import { ActionRow } from '@/components/ui/action-row';
import { Button } from '@/components/ui/button';
import { Notice } from '@/components/ui/notice';
import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { colors } from '@/constants/theme';
import { useList, useListActions, useListItems } from '@/hooks/use-lists';
import { listErrorMessage } from '@/lib/lists/errors';
export default function EditItemScreen() {
  const { id, itemId } = useLocalSearchParams<{ id: string; itemId: string }>();
  const list = useList(id ?? '');
  const items = useListItems(id ?? '');
  const item = items.data?.find((row) => row.id === itemId);
  const { remove } = useListActions();
  const [confirming, setConfirming] = useState(false);
  const deleteItem = () => { if (item) remove.mutate(item, { onSuccess: () => router.replace({ pathname: '/list/[id]', params: { id: id! } }) }); };
  const requestDelete = () => {
    if (Platform.OS === 'web') { setConfirming(true); return; }
    Alert.alert('Delete item?', 'This removes it for both of you.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: deleteItem }]);
  };
  return <Screen standalone title="Edit item" description={list.data?.name ?? 'Shared list'}>
    {(list.isPending || items.isPending) && <ActivityIndicator color={colors.accent} />}
    {list.data && item && <><ItemForm listId={list.data.id} type={list.data.type} item={item} onSaved={() => router.replace({ pathname: '/list/[id]', params: { id: list.data!.id } })} />
      <ActionPanel description="Use this when the item no longer belongs on the list.">
        {remove.error && <Notice error message={listErrorMessage(remove.error)} />}
        {confirming ? <><Text variant="label">Delete this item for both of you?</Text><Text tone="secondary">This removes it from the shared list. This can’t be undone.</Text><ActionRow><Button grow label="Yes, delete item" variant="danger" loading={remove.isPending} onPress={deleteItem} /><Button grow variant="secondary" label="Keep item" onPress={() => setConfirming(false)} /></ActionRow></> : <Button variant="secondary" label="Delete item" onPress={requestDelete} />}
      </ActionPanel></>}
    {(list.isError || items.isError) && <Notice error message="We couldn’t load this item." />}
    {items.isSuccess && !item && <Text>This item is no longer available.</Text>}
    <Button variant="secondary" label="Back to list" onPress={() => router.back()} />
  </Screen>;
}
