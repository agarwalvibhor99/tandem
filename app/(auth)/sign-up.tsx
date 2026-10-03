import { zodResolver } from '@hookform/resolvers/zod';
import { useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { TextInput } from 'react-native';

import { AuthLink } from '@/components/auth/auth-link';
import { ConfigurationNotice } from '@/components/auth/configuration-notice';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { Notice } from '@/components/ui/notice';
import { Screen } from '@/components/ui/screen';
import { Surface } from '@/components/ui/surface';
import { Text } from '@/components/ui/text';
import { useAuth } from '@/hooks/use-auth';
import { authErrorMessage } from '@/lib/auth/errors';
import { signUpSchema, type SignUpValues } from '@/lib/validation/auth';

export default function SignUpScreen() {
  const auth = useAuth();
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const [confirmationEmail, setConfirmationEmail] = useState<string | null>(null);
  const { control, handleSubmit, reset, setError, clearErrors, formState: { errors, isSubmitting } } = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema), defaultValues: { name: '', email: '', password: '' },
  });
  const submit = handleSubmit(async (values) => {
    clearErrors('root');
    try {
      const result = await auth.signUp(values);
      reset();
      if (result === 'confirmEmail') setConfirmationEmail(values.email);
    } catch (error) { setError('root', { message: authErrorMessage(error) }); }
  });
  const disabled = isSubmitting || auth.status !== 'signedOut';

  if (confirmationEmail) {
    return (
      <Screen title="Check your inbox" description="One small step before you settle in." standalone>
        <Surface>
          <Text>If a new account can be created for {confirmationEmail}, you’ll receive a confirmation email.</Text>
          <Text tone="secondary">Open the link to confirm your email, then return here to log in. Check your spam folder if it hasn’t arrived.</Text>
          <AuthLink href="/login" label="Go to log in" />
          <Button label="Use a different email" onPress={() => setConfirmationEmail(null)} />
        </Surface>
      </Screen>
    );
  }

  return (
    <Screen title="Make yourself at home" description="Start with an account that’s yours." standalone>
      <ConfigurationNotice />
      <Surface>
        <Controller control={control} name="name" render={({ field, fieldState }) => (
          <FormField label="Your name" value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} ref={field.ref}
            error={fieldState.error?.message} autoComplete="name" textContentType="name" autoCapitalize="words"
            returnKeyType="next" submitBehavior="submit" onSubmitEditing={() => emailRef.current?.focus()} editable={!isSubmitting} />
        )} />
        <Controller control={control} name="email" render={({ field, fieldState }) => (
          <FormField label="Email" value={field.value} onChangeText={field.onChange} onBlur={field.onBlur}
            ref={(input) => { field.ref(input); emailRef.current = input; }} error={fieldState.error?.message}
            keyboardType="email-address" autoCapitalize="none" autoCorrect={false} autoComplete="email" textContentType="emailAddress"
            returnKeyType="next" submitBehavior="submit" onSubmitEditing={() => passwordRef.current?.focus()} editable={!isSubmitting} />
        )} />
        <Controller control={control} name="password" render={({ field, fieldState }) => (
          <FormField label="Password" password hint="Use at least 12 characters. A few memorable words work well."
            value={field.value} onChangeText={field.onChange} onBlur={field.onBlur}
            ref={(input) => { field.ref(input); passwordRef.current = input; }} error={fieldState.error?.message}
            autoCapitalize="none" autoCorrect={false} autoComplete="new-password" textContentType="newPassword"
            returnKeyType="go" onSubmitEditing={() => { if (!disabled) void submit(); }} editable={!isSubmitting} />
        )} />
        {errors.root?.message && <Notice error message={errors.root.message} />}
        <Button label="Create account" loading={isSubmitting} disabled={disabled} onPress={() => void submit()} />
      </Surface>
      {!isSubmitting && <AuthLink href="/login" label="Already have an account? Log in" />}
      {!isSubmitting && <AuthLink href="/welcome" label="Back to welcome" />}
    </Screen>
  );
}
