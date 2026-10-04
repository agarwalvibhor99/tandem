import { useLocalSearchParams } from 'expo-router';
import { ExpenseForm } from '@/components/expenses/expense-form';
import { Screen } from '@/components/ui/screen';
export default function NewExpenseScreen() {
  const { visibility } = useLocalSearchParams<{ visibility?: string }>();
  return <Screen standalone title="Add expense" description="Record what you spent in a few taps."><ExpenseForm initialVisibility={visibility === 'shared' ? 'shared' : visibility === 'private' ? 'private' : undefined} /></Screen>;
}
