import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Notice } from '@/components/ui/notice';
import { useCompletionFailures } from '@/hooks/use-tasks';
import { taskErrorMessage } from '@/lib/tasks/errors';
export function CompletionNotice() {
  const failures = useCompletionFailures();
  const [dismissed, setDismissed] = useState(0);
  const visible = failures.filter((failure) => failure.submittedAt > dismissed);
  if (!visible.length) return null;
  return <>
    {visible.map((failure) => <Notice key={`${failure.change?.task.id}:${failure.submittedAt}`} error message={`“${failure.change?.task.title}”: ${taskErrorMessage(failure.error)} Your checkbox change was undone.`} />)}
    <Button label="Dismiss" variant="secondary" onPress={() => setDismissed(Math.max(...visible.map((failure) => failure.submittedAt)))} />
  </>;
}
