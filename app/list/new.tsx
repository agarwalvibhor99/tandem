import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { HeroTextField } from '@/components/ui/hero-text-field';
import { IconTile } from '@/components/ui/icon-tile';
import { Notice } from '@/components/ui/notice';
import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { useCurrentCouple } from '@/hooks/use-current-couple';
import { useListActions } from '@/hooks/use-lists';
import { listErrorMessage } from '@/lib/lists/errors';
import { listSchema } from '@/lib/validation/list';
import { colors, layout, spacing } from '@/constants/theme';
import { listTypes, type ListInput, type ListType } from '@/types/list';

const defaultNames: Record<ListType, string> = { Groceries: 'Groceries', Shopping: 'Shopping', Packing: 'Packing', Custom: '' };
const listTypeIcons: Record<ListType, string> = { Groceries: '🧺', Shopping: '🛍️', Packing: '🧳', Custom: '✨' };

export default function NewListScreen() {
  const couple = useCurrentCouple();
  const { create } = useListActions();
  const form = useForm<ListInput>({ resolver: zodResolver(listSchema), defaultValues: { couple_id: couple.data?.id ?? '', name: defaultNames.Groceries, type: 'Groceries' } });
  const type = useWatch({ control: form.control, name: 'type' });
  const name = useWatch({ control: form.control, name: 'name' });
  const submit = form.handleSubmit((value) => create.mutate({ ...value, couple_id: couple.data?.id ?? '' }, { onSuccess: (list) => router.replace({ pathname: '/list/[id]', params: { id: list.id } }) }));

  return <Screen standalone title="New list" description="">
    <View style={styles.form}>
      <Controller control={form.control} name="name" render={({ field: { ref, onChange, onBlur, value }, fieldState }) => <View style={styles.hero}>
        <HeroTextField ref={ref} accessibilityLabel="What list do you need?" placeholder={type === 'Custom' ? 'What list do you need?' : defaultNames[type]} value={value} onChangeText={onChange} onBlur={onBlur} editable={!create.isPending} maxLength={100} autoCapitalize="sentences" returnKeyType="done" />
        {fieldState.error?.message && <Text variant="caption" style={styles.error}>{fieldState.error.message}</Text>}
      </View>} />
      <Controller control={form.control} name="type" render={({ field }) => <View style={styles.section} accessibilityRole="radiogroup">
        <Text variant="label">Kind of list</Text>
        <View style={styles.tiles}>{listTypes.map((value) => <IconTile key={value} icon={listTypeIcons[value]} label={value} selected={field.value === value} disabled={create.isPending} onPress={() => { if (form.getValues('name') === defaultNames[field.value]) form.setValue('name', defaultNames[value], { shouldValidate: true }); field.onChange(value); }} />)}</View>
      </View>} />
      {!couple.data && <Notice message="Create a shared space before making lists together." />}
      {create.error && <Notice error message={listErrorMessage(create.error)} />}
      <Button label="Create list" loading={create.isPending} disabled={!couple.data || !name?.trim()} onPress={() => void submit()} />
    </View>
  </Screen>;
}

const styles = StyleSheet.create({
  form: { gap: layout.fieldGap },
  hero: { gap: spacing.sm },
  section: { gap: spacing.sm },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  error: { color: colors.error },
});
