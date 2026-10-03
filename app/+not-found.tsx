import { router } from 'expo-router';

import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';

export default function NotFoundScreen() {
  return (
    <Screen title="Nothing here yet" description="This link doesn’t lead to a screen in Tandem." standalone>
      <Button label="Go to Today" onPress={() => router.replace('/')} />
    </Screen>
  );
}
