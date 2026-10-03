import { useMutation, useMutationState, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { useCurrentCouple } from '@/hooks/use-current-couple';
import { getListApi } from '@/services/lists';
import type { ListInput, ListItem, ListItemInput } from '@/types/list';

export const listKeys = {
  all: (userId: string) => ['lists', userId] as const,
  list: (userId: string, coupleId: string) => [...listKeys.all(userId), 'all', coupleId] as const,
  detail: (userId: string, id: string) => [...listKeys.all(userId), 'detail', id] as const,
  items: (userId: string, id: string) => [...listKeys.all(userId), 'items', id] as const,
  groceryCount: (userId: string) => [...listKeys.all(userId), 'grocery-count'] as const,
  completion: (userId: string) => [...listKeys.all(userId), 'completion'] as const,
};

export type ItemCompletion = { item: ListItem; completed: boolean };
export function useLists(active = true) {
  const userId = useAuth().session?.user.id ?? '';
  const couple = useCurrentCouple();
  const coupleId = couple.data?.id ?? '';
  const query = useQuery({ queryKey: listKeys.list(userId, coupleId), enabled: !!userId && !!coupleId && active,
    queryFn: ({ signal }) => getListApi().all(coupleId, signal) });
  return { couple, query };
}
export function useList(id: string) {
  const userId = useAuth().session?.user.id ?? '';
  return useQuery({ queryKey: listKeys.detail(userId, id), enabled: !!userId && !!id,
    queryFn: ({ signal }) => getListApi().get(id, signal) });
}
export function useListItems(id: string) {
  const userId = useAuth().session?.user.id ?? '';
  return useQuery({ queryKey: listKeys.items(userId, id), enabled: !!userId && !!id,
    queryFn: ({ signal }) => getListApi().items(id, signal) });
}
export function useGroceryCount(enabled = true) {
  const userId = useAuth().session?.user.id ?? '';
  return useQuery({ queryKey: listKeys.groceryCount(userId), enabled: !!userId && enabled,
    queryFn: ({ signal }) => getListApi().remainingGroceries(signal) });
}
export function usePendingItemCompletions() {
  const userId = useAuth().session?.user.id ?? '';
  return useMutationState({ filters: { mutationKey: listKeys.completion(userId), status: 'pending' },
    select: (mutation) => mutation.state.variables as ItemCompletion });
}
export function useListActions() {
  const userId = useAuth().session?.user.id ?? '';
  const client = useQueryClient();
  const refresh = () => client.invalidateQueries({ queryKey: listKeys.all(userId) });
  const create = useMutation({ mutationFn: (input: ListInput) => getListApi().create(input), networkMode: 'always', onSuccess: refresh });
  const add = useMutation({ mutationFn: (input: ListItemInput) => getListApi().addItem(input), networkMode: 'always', onSuccess: refresh });
  const edit = useMutation({ mutationFn: ({ item, input }: { item: ListItem; input: ListItemInput }) => getListApi().editItem(item, input), networkMode: 'always', onSuccess: refresh });
  const remove = useMutation({ mutationFn: (item: ListItem) => getListApi().removeItem(item), networkMode: 'always', onSuccess: refresh });
  const complete = useMutation({ mutationKey: listKeys.completion(userId),
    mutationFn: ({ item, completed }: ItemCompletion) => getListApi().completeItem(item, completed),
    networkMode: 'always', onSettled: refresh });
  return { create, add, edit, remove, complete };
}
