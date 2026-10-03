import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Platform } from 'react-native';
import { ItemForm } from '@/components/lists/item-form';
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
      {remove.error && <Notice error message={listErrorMessage(remove.error)} />}
      {confirming ? <><Text>Delete this item for both of you?</Text><Button label="Yes, delete item" loading={remove.isPending} onPress={deleteItem} /><Button variant="secondary" label="Keep item" onPress={() => setConfirming(false)} /></> : <Button variant="secondary" label="Delete item" onPress={requestDelete} />}</>}
    {(list.isError || items.isError) && <Notice error message="We couldn’t load this item." />}
    {items.isSuccess && !item && <Text>This item is no longer available.</Text>}
    <Button variant="secondary" label="Back to list" onPress={() => router.back()} />
  </Screen>;
}
