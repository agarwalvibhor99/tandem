import { ConnectionCard } from '@/components/couples/connection-card';
import { useState } from 'react';
import { ActivityIndicator } from 'react-native';

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
    <Screen title="More" description="Your account and a little room for what’s next.">
      <ConnectionCard />
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
      <Text tone="secondary">Shared expenses, reminders, and date ideas are coming to Tandem.</Text>
    </Screen>
  );
}
