import { useLocalSearchParams } from 'expo-router';
import { ExpenseForm } from '@/components/expenses/expense-form';
import { Screen } from '@/components/ui/screen';
export default function NewExpenseScreen() {
  const { visibility } = useLocalSearchParams<{ visibility?: string }>();
  return <Screen standalone title="Add expense" description="Log the amount first. Tandem will show the split before saving."><ExpenseForm initialVisibility={visibility === 'shared' ? 'shared' : visibility === 'private' ? 'private' : undefined} /></Screen>;
}
