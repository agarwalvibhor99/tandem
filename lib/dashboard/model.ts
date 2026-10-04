import type { LucideIcon } from 'lucide-react-native';
import { Coffee } from 'lucide-react-native';

export type DashboardPlaceholder = {
  kind: 'placeholder'; id: string; title: string; headline: string; description: string; icon: LucideIcon;
};
/** Explicit feature state: these cards never masquerade as account data. */
export const dashboardPlaceholders: DashboardPlaceholder[] = [
  { kind: 'placeholder', id: 'date', title: 'Date idea', headline: 'Something to look forward to', description: 'A little space for places and plans you’ll both enjoy.', icon: Coffee },
];
