import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format, startOfMonth } from 'date-fns';
import { useAuth } from '@/hooks/use-auth';
import { useCurrentCouple } from '@/hooks/use-current-couple';
import { getExpenseApi } from '@/services/expenses';
import type { ExpenseInput, ExpenseVisibility } from '@/types/expense';

export const expenseKeys = {
  all: (userId: string) => ['expenses', userId] as const,
  history: (userId: string, visibility: ExpenseVisibility, coupleId: string) => [...expenseKeys.all(userId), 'history', visibility, coupleId] as const,
  detail: (userId: string, id: string) => [...expenseKeys.all(userId), 'detail', id] as const,
  summary: (userId: string, visibility: ExpenseVisibility, coupleId: string, monthStart: string) => [...expenseKeys.all(userId), 'summary', visibility, coupleId, monthStart] as const,
};

export function useExpenses(visibility: ExpenseVisibility = 'shared', active = true) {
  const userId = useAuth().session?.user.id ?? '';
  const couple = useCurrentCouple();
  const coupleId = couple.data?.id ?? '';
  const query = useQuery({ queryKey: expenseKeys.history(userId, visibility, coupleId), enabled: !!userId && active && (visibility === 'private' || !!coupleId), queryFn: ({ signal }) => getExpenseApi().all(visibility, visibility === 'shared' ? coupleId : null, signal) });
  return { couple, query };
}

export function useExpense(id: string) {
  const userId = useAuth().session?.user.id ?? '';
  return useQuery({ queryKey: expenseKeys.detail(userId, id), enabled: !!userId && !!id, queryFn: ({ signal }) => getExpenseApi().get(id, signal) });
}

export function useExpenseSummary(visibility: ExpenseVisibility = 'shared', active = true) {
  const userId = useAuth().session?.user.id ?? '';
  const couple = useCurrentCouple();
  const coupleId = couple.data?.id ?? '';
  const monthStart = format(startOfMonth(new Date()), 'yyyy-MM-dd');
  const query = useQuery({ queryKey: expenseKeys.summary(userId, visibility, coupleId, monthStart), enabled: !!userId && active && (visibility === 'private' || !!coupleId), queryFn: ({ signal }) => getExpenseApi().summary(monthStart, visibility, signal) });
  return { couple, monthStart, query };
}

export function useExpenseActions() {
  const userId = useAuth().session?.user.id ?? '';
  const client = useQueryClient();
  const refresh = () => client.invalidateQueries({ queryKey: expenseKeys.all(userId) });
  const create = useMutation({ mutationFn: (input: ExpenseInput) => getExpenseApi().create(input), networkMode: 'always', onSuccess: refresh });
  const update = useMutation({ mutationFn: ({ id, input }: { id: string; input: ExpenseInput }) => getExpenseApi().update(id, input), networkMode: 'always', onSuccess: refresh });
  const remove = useMutation({ mutationFn: (id: string) => getExpenseApi().remove(id), networkMode: 'always', onSuccess: refresh });
  return { create, update, remove };
}
