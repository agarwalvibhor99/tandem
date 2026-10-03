import { router } from 'expo-router';
import { Button } from '@/components/ui/button';
import { Notice } from '@/components/ui/notice';
import { useCoupleActions } from '@/hooks/use-couple-actions';
import { coupleErrorMessage } from '@/lib/couples/errors';

export function ConnectionExit() {
  const { skip } = useCoupleActions();
  return <>
    {skip.isError && <Notice error message={coupleErrorMessage(skip.error)} />}
    <Button label="Skip for now" variant="secondary" loading={skip.isPending} onPress={() => skip.mutate(undefined, { onSuccess: () => router.replace('/') })} />
    {skip.isError && <Button label="Continue to my personal space" variant="secondary" onPress={() => router.replace('/')} />}
  </>;
}
