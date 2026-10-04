import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { ChoiceChips } from '@/components/ui/choice-chips';
import { FormField } from '@/components/ui/form-field';
import { Notice } from '@/components/ui/notice';
import { Screen } from '@/components/ui/screen';
import { useCurrentCouple } from '@/hooks/use-current-couple';
import { useListActions } from '@/hooks/use-lists';
import { listErrorMessage } from '@/lib/lists/errors';
import { listSchema } from '@/lib/validation/list';
import { listTypes, type ListInput, type ListType } from '@/types/list';

const defaultNames: Record<ListType, string> = { Groceries: 'Groceries', Shopping: 'Shopping', Packing: 'Packing', Custom: '' };
export default function NewListScreen() {
  const couple = useCurrentCouple();
  const { create } = useListActions();
  const form = useForm<ListInput>({ resolver: zodResolver(listSchema), defaultValues: { couple_id: couple.data?.id ?? '', name: defaultNames.Groceries, type: 'Groceries' } });
  const type = useWatch({ control: form.control, name: 'type' });
  const submit = form.handleSubmit((value) => create.mutate({ ...value, couple_id: couple.data?.id ?? '' }, { onSuccess: (list) => router.replace({ pathname: '/list/[id]', params: { id: list.id } }) }));
  return <Screen standalone title="New list" description="Start with a name. You can add things as you think of them.">
    <Controller control={form.control} name="type" render={({ field }) => <ChoiceChips label="What kind of list?" value={field.value} options={listTypes.map((value) => ({ value, label: value }))} disabled={create.isPending} onChange={(next) => { if (form.getValues('name') === defaultNames[field.value]) form.setValue('name', defaultNames[next]); field.onChange(next); }} />} />
    <Controller control={form.control} name="name" render={({ field, fieldState }) => <FormField label="List name" placeholder={type === 'Custom' ? 'e.g. Weekend away' : undefined} value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} error={fieldState.error?.message} maxLength={100} editable={!create.isPending} />} />
    {create.error && <Notice error message={listErrorMessage(create.error)} />}
    <Button label="Create list" loading={create.isPending} disabled={!couple.data} onPress={() => void submit()} />
  </Screen>;
}
