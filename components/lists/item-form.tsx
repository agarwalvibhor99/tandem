import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { ChoiceChips } from '@/components/ui/choice-chips';
import { FormField } from '@/components/ui/form-field';
import { Notice } from '@/components/ui/notice';
import { Text } from '@/components/ui/text';
import { useListActions } from '@/hooks/use-lists';
import { listErrorMessage } from '@/lib/lists/errors';
import { itemSchema } from '@/lib/validation/list';
import { groceryCategories, type ListItem, type ListItemInput, type ListType } from '@/types/list';

export function ItemForm({ listId, type, item, onSaved, compact = false }: { listId: string; type: ListType; item?: ListItem; onSaved: () => void; compact?: boolean }) {
  const { add, edit } = useListActions();
  const [baseline, setBaseline] = useState(item);
  const busy = add.isPending || edit.isPending;
  const form = useForm<ListItemInput>({ resolver: zodResolver(itemSchema), defaultValues: item ? { list_id: item.list_id, name: item.name, quantity: item.quantity, category: item.category, notes: item.notes } : { list_id: listId, name: '', quantity: null, category: null, notes: '' } });
  const changedElsewhere = !!item && !!baseline && item.updated_at !== baseline.updated_at;
  const submit = form.handleSubmit((value) => {
    const input = { ...value, list_id: listId, category: type === 'Groceries' ? value.category : null };
    if (baseline) edit.mutate({ item: baseline, input }, { onSuccess: onSaved });
    else add.mutate(input, { onSuccess: () => { form.reset(); onSaved(); } });
  });
  return <>
    {changedElsewhere && <><Notice message="This item changed while you were editing. Load the latest version before saving." /><Button variant="secondary" label="Load latest version" onPress={() => { if (item) { setBaseline(item); form.reset({ list_id: item.list_id, name: item.name, quantity: item.quantity, category: item.category, notes: item.notes }); edit.reset(); } }} /></>}
    <Controller control={form.control} name="name" render={({ field, fieldState }) => <FormField label={compact ? 'Add an item' : 'What do you need?'} placeholder={type === 'Groceries' ? 'e.g. Milk' : 'e.g. Phone charger'} value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} error={fieldState.error?.message} editable={!busy} maxLength={160} returnKeyType={compact ? 'done' : 'next'} onSubmitEditing={() => { if (compact) void submit(); }} />} />
    {!compact && <>
      <Controller control={form.control} name="quantity" render={({ field, fieldState }) => <FormField label="Quantity (optional)" placeholder="e.g. 2 cartons" value={field.value ?? ''} onChangeText={field.onChange} onBlur={field.onBlur} error={fieldState.error?.message} editable={!busy} maxLength={40} />} />
      {type === 'Groceries' && <Controller control={form.control} name="category" render={({ field }) => <ChoiceChips label="Category (optional)" value={field.value ?? ''} options={[{ value: '' as const, label: 'None' }, ...groceryCategories.map((value) => ({ value, label: value }))]} onChange={(next) => field.onChange(next || null)} disabled={busy} />} />}
      <Controller control={form.control} name="notes" render={({ field, fieldState }) => <FormField label="Notes (optional)" placeholder="Size, brand or anything useful" multiline numberOfLines={3} value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} error={fieldState.error?.message} editable={!busy} maxLength={2000} />} />
    </>}
    {(add.error || edit.error) && <Notice error message={listErrorMessage(add.error ?? edit.error)} />}
    <Button label={item ? 'Save changes' : compact ? 'Add item' : 'Save item'} loading={busy} disabled={changedElsewhere} onPress={() => void submit()} />
    {compact && <Text variant="caption" tone="secondary">Both of you can add to this list.</Text>}
  </>;
}
