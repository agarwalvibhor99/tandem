import { zodResolver } from '@hookform/resolvers/zod';
import { Redirect, router } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { AuthLink } from '@/components/auth/auth-link';
import { ConnectionExit } from '@/components/couples/connection-exit';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { Notice } from '@/components/ui/notice';
import { Screen } from '@/components/ui/screen';
import { Surface } from '@/components/ui/surface';
import { useCoupleActions } from '@/hooks/use-couple-actions';
import { useCurrentCouple } from '@/hooks/use-current-couple';
import { coupleErrorMessage } from '@/lib/couples/errors';
import { createCoupleSchema } from '@/lib/validation/couple';

export default function CreateSpaceScreen() {
  const couple = useCurrentCouple();
  const { create } = useCoupleActions();
  const { control, handleSubmit } = useForm<z.infer<typeof createCoupleSchema>>({ resolver: zodResolver(createCoupleSchema), defaultValues: { name: 'Our space' } });
  if (couple.data) return <Redirect href="/invite-partner" />;
  return <Screen standalone title="Create your shared space" description="A place for life together. Start your space, then invite your partner.">
    <Surface>
      <Controller control={control} name="name" render={({ field: { onChange, onBlur, value, ref }, fieldState }) => <FormField ref={ref} label="Space name" value={value} onChangeText={onChange} onBlur={onBlur} error={fieldState.error?.message} maxLength={80} autoCapitalize="sentences" editable={!create.isPending} returnKeyType="done" onSubmitEditing={() => void handleSubmit(({ name }) => create.mutate(name, { onSuccess: () => router.replace('/invite-partner') }))()} />} />
      {create.isError && <Notice error message={coupleErrorMessage(create.error)} />}
      <Button label="Create our space" loading={create.isPending} onPress={() => void handleSubmit(({ name }) => create.mutate(name, { onSuccess: () => router.replace('/invite-partner') }))()} />
    </Surface>
    <AuthLink href="/join-space" label="Have a code? Join your partner" />
    <ConnectionExit />
  </Screen>;
}
