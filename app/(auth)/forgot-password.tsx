import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';

import { AuthLink } from '@/components/auth/auth-link';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { Notice } from '@/components/ui/notice';
import { Screen } from '@/components/ui/screen';
import { Surface } from '@/components/ui/surface';
import { useAuth } from '@/hooks/use-auth';
import { authErrorMessage } from '@/lib/auth/errors';
import { forgotPasswordSchema, type ForgotPasswordValues } from '@/lib/validation/auth';

function resetRedirectUrl() {
  if (typeof window === 'undefined') return undefined;
  return `${window.location.origin}/reset-password`;
}

export default function ForgotPasswordScreen() {
  const auth = useAuth();
  const { control, handleSubmit, setError, clearErrors, formState: { errors, isSubmitting, isSubmitSuccessful } } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });
  const submit = handleSubmit(async (values) => {
    clearErrors('root');
    try {
      await auth.sendPasswordReset(values, resetRedirectUrl());
    } catch (error) {
      setError('root', { message: authErrorMessage(error) });
    }
  });

  return (
    <Screen title="Reset password" description="Enter your email and Tandem will send a secure reset link." standalone>
      <Surface>
        {isSubmitSuccessful ? (
          <>
            <Notice message="If an account exists for that email, a reset link is on its way." />
            <Button label="Back to login" onPress={() => router.replace('/login')} />
          </>
        ) : (
          <>
            <Controller control={control} name="email" render={({ field, fieldState }) => (
              <FormField label="Email" value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} ref={field.ref}
                error={fieldState.error?.message} keyboardType="email-address" autoCapitalize="none" autoCorrect={false}
                autoComplete="email" textContentType="emailAddress" returnKeyType="send" onSubmitEditing={() => { void submit(); }} editable={!isSubmitting} />
            )} />
            {errors.root?.message && <Notice error message={errors.root.message} />}
            <Button label="Send reset link" loading={isSubmitting} onPress={() => void submit()} />
          </>
        )}
      </Surface>
      {!isSubmitting && <AuthLink href="/login" label="Back to login" />}
    </Screen>
  );
}
