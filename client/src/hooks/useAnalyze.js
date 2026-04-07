import { useMutation } from '@tanstack/react-query';
import { analyzeUrl } from '../services/apiClient';

export function useAnalyze() {
  return useMutation({
    mutationFn: (url) => analyzeUrl(url),
  });
}
