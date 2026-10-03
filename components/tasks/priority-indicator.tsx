import { Text } from '@/components/ui/text';
import type { Task } from '@/types/task';
export function PriorityIndicator({ priority }: { priority: Task['priority'] }) {
  return <Text variant="caption" tone={priority === 'high' ? 'accent' : 'secondary'}>{priority === 'high' ? '↑ High priority' : priority === 'low' ? '↓ Low priority' : 'Normal priority'}</Text>;
}
