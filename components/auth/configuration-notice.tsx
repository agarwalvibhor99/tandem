import { Notice } from '@/components/ui/notice';
import { useAuth } from '@/hooks/use-auth';

export function ConfigurationNotice() {
  const { status } = useAuth();
  return status === 'unconfigured'
    ? <Notice message="Sign-in isn’t available yet. Please try again later." />
    : null;
}
