import { ConnectionCard } from '@/components/couples/connection-card';
import { useState } from 'react';
import { ActivityIndicator } from 'react-native';
import { router } from 'expo-router';

import { Button } from '@/components/ui/button';
import { Notice } from '@/components/ui/notice';
import { Screen } from '@/components/ui/screen';
import { Surface } from '@/components/ui/surface';
import { Text } from '@/components/ui/text';
import { colors } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useProfile } from '@/hooks/use-profile';
import { authErrorMessage } from '@/lib/auth/errors';

export default function MoreScreen() {
  const auth = useAuth();
  const profile = useProfile();
  const [loggingOut, setLoggingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function logout() {
    setLoggingOut(true);
    setError(null);
    try { await auth.logout(); }
    catch (cause) { setError(authErrorMessage(cause)); }
    finally { setLoggingOut(false); }
  }

  return (
    <Screen title="More" description="Your shared life, all in one place.">
      <ConnectionCard />
      <Surface>
        <Text variant="title">Money</Text>
        <Text tone="secondary">Track personal or shared spending and keep the balance clear.</Text>
        <Button label="Open money" onPress={() => router.push('/money')} />
      </Surface>
      <Surface>
        <Text variant="title">Reminders</Text>
        <Text tone="secondary">Keep small promises visible at the right time.</Text>
        <Button label="Open reminders" onPress={() => router.push('/reminders')} accessibilityLabel="Open reminders" />
      </Surface>
      <Surface>
        <Text variant="title">Date ideas</Text>
        <Text tone="secondary">Save things you’d love to do and find a time that fits.</Text>
        <Button label="Open date ideas" onPress={() => router.push('/dates')} />
      </Surface>
      <Surface>
        <Text variant="title" accessibilityRole="header">Your account</Text>
        {profile.isPending ? <ActivityIndicator color={colors.accent} accessibilityLabel="Loading your profile" /> : profile.isError ? (
          <>
            <Notice error message="We couldn’t load your profile. You can try again or log out below." />
            <Button label="Try again" loading={profile.isFetching} onPress={() => void profile.refetch()} />
          </>
        ) : (
          <>
            <Text variant="heading">{profile.data.name}</Text>
            <Text tone="secondary">{profile.data.email}</Text>
          </>
        )}
        {error && <Notice error message={error} />}
        <Button label="Log out" loading={loggingOut} onPress={() => void logout()} />
      </Surface>
    </Screen>
  );
}
