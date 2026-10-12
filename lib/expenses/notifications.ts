import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { Expense } from '@/types/expense';

export type ExpenseNotificationResult = 'sent' | 'denied' | 'unsupported' | 'unavailable' | 'none';

const money = (value: number, currency = 'USD') => new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(value);

async function permission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (current.canAskAgain === false) return false;
  const next = await Notifications.requestPermissionsAsync();
  return next.granted;
}

function bodyFor(expense: Pick<Expense, 'title' | 'amount' | 'currency'>, creatorName: string) {
  return `${creatorName} added ${expense.title} · ${money(Number(expense.amount), expense.currency)}`;
}

export async function notifyNewSharedExpense(expense: Expense, creatorName: string): Promise<ExpenseNotificationResult> {
  if (Platform.OS === 'web') return 'unsupported';
  try {
    if (!(await permission())) return 'denied';
    if (Platform.OS === 'android') await Notifications.setNotificationChannelAsync('expenses', { name: 'Expenses', importance: Notifications.AndroidImportance.DEFAULT });
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'New shared expense',
        body: bodyFor(expense, creatorName),
        data: { expenseId: expense.id, createdBy: expense.created_by },
        sound: 'default',
      },
      trigger: null,
    });
    return 'sent';
  } catch {
    return 'unavailable';
  }
}
