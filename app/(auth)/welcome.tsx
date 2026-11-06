import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { AuthLink } from '@/components/auth/auth-link';
import { ConfigurationNotice } from '@/components/auth/configuration-notice';
import { Button } from '@/components/ui/button';
import { Notice } from '@/components/ui/notice';
import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { TogetherArt } from '@/components/ui/together-art';
import { spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';

export default function WelcomeScreen() {
  const { notice } = useAuth();
  return <Screen title="" description="" pageTitle="Welcome" standalone>
    <TogetherArt />
    <View style={styles.copy}>
      <Text variant="eyebrow" tone="secondary">Life, managed together</Text>
      <Text variant="display" accessibilityRole="header">A little more{ '\n' }in sync.</Text>
      <Text tone="secondary">For the lists, plans, payments and everyday moments that make up a life together.</Text>
    </View>
    <View style={styles.actions}>
      <Button label="Get started →" size="large" onPress={() => router.push('/sign-up')} />
      <AuthLink href="/login" label="Already have an account? Log in" />
    </View>
    <ConfigurationNotice />
    {notice && <Notice message={notice} />}
  </Screen>;
}
const styles = StyleSheet.create({ copy: { gap: spacing.md }, actions: { marginTop: spacing.xl, gap: spacing.md } });
