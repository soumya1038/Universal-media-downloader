import { useQuery } from '@tanstack/react-query';
import { getJobStatus } from '../services/apiClient';

export function useJobStatus(jobId) {
  return useQuery({
    queryKey: ['job', jobId],
    queryFn: () => getJobStatus(jobId),
    enabled: !!jobId,
    refetchInterval: (query) => {
      const status = query.state.data?.data?.status;
      if (status === 'completed' || status === 'failed') return false;
      return 2000;
    },
  });
}
