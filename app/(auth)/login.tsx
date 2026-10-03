import { zodResolver } from '@hookform/resolvers/zod';
import { useRef } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { TextInput } from 'react-native';

import { AuthLink } from '@/components/auth/auth-link';
import { ConfigurationNotice } from '@/components/auth/configuration-notice';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { Notice } from '@/components/ui/notice';
import { Screen } from '@/components/ui/screen';
import { Surface } from '@/components/ui/surface';
import { useAuth } from '@/hooks/use-auth';
import { authErrorMessage } from '@/lib/auth/errors';
import { loginSchema, type LoginValues } from '@/lib/validation/auth';

export default function LoginScreen() {
  const auth = useAuth();
  const passwordRef = useRef<TextInput>(null);
  const { control, handleSubmit, setError, clearErrors, formState: { errors, isSubmitting } } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema), defaultValues: { email: '', password: '' },
  });
  const submit = handleSubmit(async (values) => {
    clearErrors('root');
    try { await auth.login(values); }
    catch (error) { setError('root', { message: authErrorMessage(error) }); }
  });
  const disabled = isSubmitting || auth.status !== 'signedOut';

  return (
    <Screen title="Welcome back" description="Log in to your little corner of life together." standalone>
      <ConfigurationNotice />
      {auth.notice && <Notice message={auth.notice} />}
      <Surface>
        <Controller control={control} name="email" render={({ field, fieldState }) => (
          <FormField label="Email" value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} ref={field.ref}
            error={fieldState.error?.message} keyboardType="email-address" autoCapitalize="none" autoCorrect={false}
            autoComplete="email" textContentType="emailAddress" returnKeyType="next" submitBehavior="submit"
            onSubmitEditing={() => passwordRef.current?.focus()} editable={!isSubmitting} />
        )} />
        <Controller control={control} name="password" render={({ field, fieldState }) => (
          <FormField label="Password" password value={field.value} onChangeText={field.onChange} onBlur={field.onBlur}
            ref={(input) => { field.ref(input); passwordRef.current = input; }} error={fieldState.error?.message}
            autoCapitalize="none" autoCorrect={false} autoComplete="current-password" textContentType="password"
            returnKeyType="go" onSubmitEditing={() => { if (!disabled) void submit(); }} editable={!isSubmitting} />
        )} />
        {errors.root?.message && <Notice error message={errors.root.message} />}
        <Button label="Log in" loading={isSubmitting} disabled={disabled} onPress={() => void submit()} />
      </Surface>
      {!isSubmitting && <AuthLink href="/sign-up" label="New to Tandem? Create an account" />}
      {!isSubmitting && <AuthLink href="/welcome" label="Back to welcome" />}
    </Screen>
  );
}
