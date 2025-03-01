import { useEffect } from 'react';

export function useAutoSave<T>(
  data: T,
  saveFunction: () => Promise<void>,
  deps: unknown[],
  delay = 1000,
  isLoading = false
) {
  useEffect(() => {
    if (isLoading) return;
    
    const timer = setTimeout(() => {
      void saveFunction();
    }, delay);
    
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, saveFunction, delay, ...deps]);
} 