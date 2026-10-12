import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { ActivityIndicator, TextInput } from 'react-native';

import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { Notice } from '@/components/ui/notice';
import { Screen } from '@/components/ui/screen';
import { Surface } from '@/components/ui/surface';
import { colors } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { authErrorMessage } from '@/lib/auth/errors';
import { getSupabaseClient } from '@/lib/supabase/client';
import { resetPasswordSchema, type ResetPasswordValues } from '@/lib/validation/auth';

async function consumeRecoverySession() {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  const fragment = new URLSearchParams(url.hash.slice(1));
  const code = url.searchParams.get('code');
  const accessToken = fragment.get('access_token');
  const refreshToken = fragment.get('refresh_token');
  if (!code && (!accessToken || !refreshToken)) return;

  const client = getSupabaseClient();
  if (code) {
    const { error } = await client.auth.exchangeCodeForSession(code);
    if (error) throw error;
  } else if (accessToken && refreshToken) {
    const { error } = await client.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
    if (error) throw error;
  }
  url.search = '';
  url.hash = '';
  window.history.replaceState(window.history.state, '', url.pathname);
}

export default function ResetPasswordScreen() {
  const auth = useAuth();
  const passwordRef = useRef<TextInput>(null);
  const [preparing, setPreparing] = useState(true);
  const [setupError, setSetupError] = useState<string | null>(null);
  const { control, handleSubmit, setError, clearErrors, formState: { errors, isSubmitting, isSubmitSuccessful } } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '' },
  });
  const submit = handleSubmit(async (values) => {
    clearErrors('root');
    try {
      await auth.updatePassword(values);
      await auth.logout();
    } catch (error) {
      setError('root', { message: authErrorMessage(error) });
    }
  });
  const canReset = auth.status === 'signedIn';

  useEffect(() => {
    let active = true;
    consumeRecoverySession()
      .catch((error) => {
        if (active) setSetupError(authErrorMessage(error));
      })
      .finally(() => {
        if (active) setPreparing(false);
      });
    return () => { active = false; };
  }, []);

  return (
    <Screen title="Choose a new password" description="Use a password with at least 12 characters." standalone>
      <Surface>
        {isSubmitSuccessful ? (
          <>
            <Notice message="Your password was updated. Log in with the new password." />
            <Button label="Go to login" onPress={() => router.replace('/login')} />
          </>
        ) : (
          <>
            {preparing && <ActivityIndicator color={colors.accent} accessibilityLabel="Opening reset link" />}
            {setupError && <Notice error message={setupError} />}
            {!preparing && !canReset && <Notice error message="This reset link is invalid, expired, or opened in the wrong local app URL. Request a new reset link from Tandem." />}
            <Controller control={control} name="password" render={({ field, fieldState }) => (
              <FormField label="New password" password hint="A few memorable words work well." value={field.value} onChangeText={field.onChange} onBlur={field.onBlur}
                ref={(input) => { field.ref(input); passwordRef.current = input; }} error={fieldState.error?.message}
                autoCapitalize="none" autoCorrect={false} autoComplete="new-password" textContentType="newPassword"
                returnKeyType="go" onSubmitEditing={() => { if (canReset) void submit(); }} editable={!isSubmitting && canReset && !preparing} />
            )} />
            {errors.root?.message && <Notice error message={errors.root.message} />}
            <Button label="Update password" loading={isSubmitting} disabled={!canReset || preparing} onPress={() => void submit()} />
          </>
        )}
      </Surface>
    </Screen>
  );
}
