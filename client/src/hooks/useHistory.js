import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getHistory, deleteHistoryItem, clearAllHistory } from '../services/apiClient';

export function useHistory() {
  return useQuery({
    queryKey: ['history'],
    queryFn: getHistory,
    refetchInterval: 10000,
  });
}

export function useDeleteHistory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteHistoryItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['history'] });
    },
  });
}

export function useClearHistory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: clearAllHistory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['history'] });
    },
  });
}
