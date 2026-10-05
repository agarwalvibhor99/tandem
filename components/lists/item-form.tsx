import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { ChoiceChips } from '@/components/ui/choice-chips';
import { CounterControl } from '@/components/ui/counter-control';
import { FormField } from '@/components/ui/form-field';
import { IconTile } from '@/components/ui/icon-tile';
import { Notice } from '@/components/ui/notice';
import { Text } from '@/components/ui/text';
import { colors, layout, radii, spacing } from '@/constants/theme';
import { useListActions } from '@/hooks/use-lists';
import { listErrorMessage } from '@/lib/lists/errors';
import { itemSchema } from '@/lib/validation/list';
import { groceryCategories, type GroceryCategory, type ListItem, type ListItemInput, type ListType } from '@/types/list';

const grocerySuggestions = ['Milk', 'Eggs', 'Bananas', 'Bread', 'Chicken', 'Rice'];
const quantitySuggestions = ['carton', 'pack', 'bottle', 'bag', 'lb', 'dozen'];
function quantityParts(value: string | null | undefined) {
  const match = (value ?? '').trim().match(/^(\d+)(?:\s+(.+))?$/);
  return { count: match ? Number(match[1]) : 1, unit: match?.[2] ?? '' };
}
function quantityValue(count: number, unit: string) {
  const normalized = Math.max(1, Math.min(99, count));
  return unit ? `${normalized} ${unit}` : String(normalized);
}
const categoryEmoji: Record<GroceryCategory, string> = {
  Produce: '🥬', Dairy: '🥛', Meat: '🥩', Frozen: '🧊', Pantry: '🥫', Snacks: '🍪', Household: '🧴', Other: '🛒',
};

export function ItemForm({ listId, type, item, onSaved, compact = false, initialDetailsOpen = false }: { listId: string; type: ListType; item?: ListItem; onSaved: () => void; compact?: boolean; initialDetailsOpen?: boolean }) {
  const { add, edit } = useListActions();
  const [baseline, setBaseline] = useState(item);
  const [detailsOpen, setDetailsOpen] = useState(() => !compact && (initialDetailsOpen || (!!item && (!!item.quantity || !!item.category || !!item.notes))));
  const busy = add.isPending || edit.isPending;
  const form = useForm<ListItemInput>({ resolver: zodResolver(itemSchema), defaultValues: item ? { list_id: item.list_id, name: item.name, quantity: item.quantity, category: item.category, notes: item.notes } : { list_id: listId, name: '', quantity: null, category: null, notes: '' } });
  const changedElsewhere = !!item && !!baseline && item.updated_at !== baseline.updated_at;
  const submit = form.handleSubmit((value) => {
    const input = { ...value, list_id: listId, category: type === 'Groceries' ? value.category : null };
    if (baseline) edit.mutate({ item: baseline, input }, { onSuccess: onSaved });
    else add.mutate(input, { onSuccess: () => { form.reset(); onSaved(); } });
  });
  return <>
    {changedElsewhere && <><Notice message="This item changed while you were editing. Load the latest version before saving." /><Button variant="secondary" label="Load latest version" onPress={() => { if (item) { setBaseline(item); setDetailsOpen(!!item.quantity || !!item.category || !!item.notes); form.reset({ list_id: item.list_id, name: item.name, quantity: item.quantity, category: item.category, notes: item.notes }); edit.reset(); } }} /></>}
    {compact ? (
      <Controller
        control={form.control}
        name="name"
        render={({ field, fieldState }) => (
          <View style={styles.quickAddRow}>
            <View style={styles.quickAddInput}>
              <FormField label="Add an item" placeholder={type === 'Groceries' ? 'e.g. Milk' : 'e.g. Phone charger'} value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} error={fieldState.error?.message} editable={!busy} maxLength={160} returnKeyType="done" onSubmitEditing={() => { void submit(); }} />
            </View>
            <Button label="Add" size="compact" loading={busy} disabled={changedElsewhere} onPress={() => void submit()} />
          </View>
        )}
      />
    ) : (
      <Controller
        control={form.control}
        name="name"
        render={({ field, fieldState }) => (
          <View style={styles.section}>
            <FormField label="What do you need?" placeholder={type === 'Groceries' ? 'e.g. Milk' : 'e.g. Phone charger'} value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} error={fieldState.error?.message} editable={!busy} maxLength={160} returnKeyType="next" />
            {type === 'Groceries' && !item && <View style={styles.inlineGroup}>
              <Text variant="caption" tone="secondary">Often added</Text>
              <View style={styles.chipRow}>{grocerySuggestions.map((suggestion) => (
                <Pressable key={suggestion} accessibilityRole="button" accessibilityLabel={`Use ${suggestion}`} onPress={() => field.onChange(suggestion)} style={styles.softChip}>
                  <Text variant="label">{suggestion}</Text>
                </Pressable>
              ))}</View>
            </View>}
          </View>
        )}
      />
    )}
    {!compact && !detailsOpen && <Button label="More details" variant="quiet" accessibilityState={{ expanded: detailsOpen }} onPress={() => setDetailsOpen(true)} />}
    {!compact && detailsOpen && <>
      <View style={styles.detailHeader}>
        <Text variant="label" tone="secondary">Optional details</Text>
        <Button label="Hide" variant="quiet" accessibilityState={{ expanded: detailsOpen }} onPress={() => setDetailsOpen(false)} />
      </View>
      <Controller control={form.control} name="quantity" render={({ field }) => {
        const { count, unit } = quantityParts(field.value);
        return <View style={styles.section}>
          <CounterControl label="Quantity" value={count} min={1} max={99} disabled={busy} onChange={(next) => field.onChange(quantityValue(next, unit))} />
          {type === 'Groceries' && <View style={styles.chipRow}>{quantitySuggestions.map((suggestion) => {
            const selected = unit === suggestion;
            return <Pressable key={suggestion} accessibilityRole="button" accessibilityLabel={`Use ${suggestion}`} accessibilityState={{ selected }} onPress={() => field.onChange(quantityValue(count, selected ? '' : suggestion))} style={[styles.softChip, selected && styles.softChipSelected]}>
              <Text variant="label" tone={selected ? 'inverse' : 'default'}>{suggestion}</Text>
            </Pressable>;
          })}</View>}
        </View>;
      }} />
      {type === 'Groceries' && <Controller control={form.control} name="category" render={({ field }) => <View style={styles.section}>
        <Text variant="label">Category</Text>
        <View style={styles.categoryGrid}>
          {groceryCategories.map((category) => {
            const selected = field.value === category;
            return <IconTile key={category} icon={categoryEmoji[category]} label={category} selected={selected} onPress={() => field.onChange(selected ? null : category)} />;
          })}
        </View>
      </View>} />}
      {type !== 'Groceries' && <Controller control={form.control} name="category" render={({ field }) => <ChoiceChips label="Category (optional)" value={field.value ?? ''} options={[{ value: '' as const, label: 'None' }, ...groceryCategories.map((value) => ({ value, label: value }))]} onChange={(next) => field.onChange(next || null)} disabled={busy} />} />}
      <Controller control={form.control} name="notes" render={({ field, fieldState }) => <FormField label="Notes" placeholder="Size, brand or anything useful" multiline numberOfLines={3} value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} error={fieldState.error?.message} editable={!busy} maxLength={2000} />} />
    </>}
    {(add.error || edit.error) && <Notice error message={listErrorMessage(add.error ?? edit.error)} />}
    {!compact && <Button label={item ? 'Save changes' : 'Save item'} loading={busy} disabled={changedElsewhere} onPress={() => void submit()} />}
    {compact && <Text variant="caption" tone="secondary">Both of you can add to this list.</Text>}
  </>;
}

const styles = StyleSheet.create({
  quickAddRow: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm },
  quickAddInput: { flex: 1 },
  detailHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  section: { gap: spacing.sm },
  inlineGroup: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  softChip: { minHeight: layout.minTouchTarget, borderRadius: radii.pill, backgroundColor: colors.surfaceMuted, paddingHorizontal: spacing.md, justifyContent: 'center' },
  softChipSelected: { backgroundColor: colors.accent },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
