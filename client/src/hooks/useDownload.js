import { useMutation } from '@tanstack/react-query';
import { startDownload } from '../services/apiClient';

export function useDownload() {
  return useMutation({
    mutationFn: (data) => startDownload(data),
  });
}
