import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
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
import { joinCoupleSchema } from '@/lib/validation/couple';

export default function JoinSpaceScreen() {
  const { join } = useCoupleActions();
  const couple = useCurrentCouple();
  const { control, handleSubmit } = useForm<z.infer<typeof joinCoupleSchema>>({ resolver: zodResolver(joinCoupleSchema), defaultValues: { code: '' } });
  const submit = handleSubmit(({ code }) => join.mutate(code, { onSuccess: () => router.replace('/partner-connected') }));
  return <Screen standalone title="Join with a code" description="Ask your partner for their invitation code. You’ll share the same space.">
    <Surface>
      {couple.data ? <><Notice message="You already have a shared space. You can’t join a second space yet." /><Button label="Open my shared space" onPress={() => router.replace('/invite-partner')} /></> : <>
        <Controller control={control} name="code" render={({ field: { onChange, onBlur, value, ref }, fieldState }) => <FormField ref={ref} label="Invitation code" placeholder="ABCD-1234-EF56-7890" hint="16 characters. Spaces and hyphens are fine." value={value} onChangeText={onChange} onBlur={onBlur} error={fieldState.error?.message} autoCapitalize="characters" autoCorrect={false} maxLength={64} editable={!join.isPending} returnKeyType="go" onSubmitEditing={() => void submit()} />} />
        {join.isError && <Notice error message={coupleErrorMessage(join.error)} />}
        <Button label="Join our space" loading={join.isPending} onPress={() => void submit()} />
      </>}
    </Surface>
    <AuthLink href="/create-space" label="Create a space instead" />
    <ConnectionExit />
  </Screen>;
}
