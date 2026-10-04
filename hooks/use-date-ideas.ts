import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { useCurrentCouple } from '@/hooks/use-current-couple';
import { getDateIdeaApi } from '@/services/dates';
import type { DateIdea, DateIdeaInput } from '@/types/date-idea';

export const dateIdeaKeys = {
  all: (userId: string) => ['date-ideas', userId] as const,
  list: (userId: string, coupleId: string) => [...dateIdeaKeys.all(userId), 'list', coupleId] as const,
  detail: (userId: string, id: string) => [...dateIdeaKeys.all(userId), 'detail', id] as const,
};
export function useDateIdeas(active = true) {
  const userId = useAuth().session?.user.id ?? '';
  const couple = useCurrentCouple();
  const coupleId = couple.data?.id ?? '';
  const query = useQuery({ queryKey: dateIdeaKeys.list(userId, coupleId), enabled: !!userId && !!coupleId && active,
    queryFn: ({ signal }) => getDateIdeaApi().all(coupleId, signal) });
  return { couple, query };
}
export function useDateIdea(id: string) {
  const userId = useAuth().session?.user.id ?? '';
  return useQuery({ queryKey: dateIdeaKeys.detail(userId, id), enabled: !!userId && !!id,
    queryFn: ({ signal }) => getDateIdeaApi().get(id, signal) });
}
export function useDateIdeaActions() {
  const userId = useAuth().session?.user.id ?? '';
  const client = useQueryClient();
  const refresh = () => client.invalidateQueries({ queryKey: dateIdeaKeys.all(userId) });
  const create = useMutation({ mutationFn: (input: DateIdeaInput) => getDateIdeaApi().create(input), networkMode: 'always', onSuccess: refresh });
  const update = useMutation({ mutationFn: ({ idea, input }: { idea: DateIdea; input: DateIdeaInput }) => getDateIdeaApi().update(idea, input), networkMode: 'always', onSuccess: refresh });
  const setStatus = useMutation({ mutationFn: ({ idea, status }: { idea: DateIdea; status: DateIdea['status'] }) => getDateIdeaApi().setStatus(idea, status), networkMode: 'always', onSuccess: refresh });
  return { create, update, setStatus };
}
