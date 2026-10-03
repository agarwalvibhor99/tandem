import { router } from 'expo-router';
import { Sun } from 'lucide-react-native';
import { View } from 'react-native';

import { AuthLink } from '@/components/auth/auth-link';
import { ConfigurationNotice } from '@/components/auth/configuration-notice';
import { Button } from '@/components/ui/button';
import { Notice } from '@/components/ui/notice';
import { Screen } from '@/components/ui/screen';
import { Surface } from '@/components/ui/surface';
import { Text } from '@/components/ui/text';
import { colors, layout } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';

export default function WelcomeScreen() {
  const { notice } = useAuth();
  return (
    <Screen title="Life, a little more together." description="A calmer place for your everyday plans." standalone>
      <Surface>
        <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <Sun size={layout.featureIconSize} color={colors.accent} />
        </View>
        <Text variant="title">Less coordinating. More living.</Text>
        <Text tone="secondary">Make space for shared plans, everyday to-dos, and time for each other.</Text>
        <Button label="Create an account" onPress={() => router.push('/sign-up')} />
        <AuthLink href="/login" label="Already have an account? Log in" />
      </Surface>
      <ConfigurationNotice />
      {notice && <Notice message={notice} />}
    </Screen>
  );
}
