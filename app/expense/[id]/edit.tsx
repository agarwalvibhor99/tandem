import { useLocalSearchParams } from 'expo-router';
import { ActivityIndicator } from 'react-native';
import { ExpenseForm } from '@/components/expenses/expense-form';
import { Button } from '@/components/ui/button';
import { Notice } from '@/components/ui/notice';
import { Screen } from '@/components/ui/screen';
import { colors } from '@/constants/theme';
import { useExpense } from '@/hooks/use-expenses';

export default function EditExpenseScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const expense = useExpense(id ?? '');
  return <Screen standalone title="Edit expense" description="Update the amount, payer, split, or notes.">
    {expense.isPending && <ActivityIndicator color={colors.accent} accessibilityLabel="Loading expense" />}
    {expense.isError && <><Notice error message="We couldn’t load this expense." /><Button label="Try again" onPress={() => void expense.refetch()} /></>}
    {expense.isSuccess && !expense.data && <Notice error message="This expense is no longer available." />}
    {expense.data && <ExpenseForm key={expense.data.id} expense={expense.data} />}
  </Screen>;
}
