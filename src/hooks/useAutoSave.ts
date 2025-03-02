import { useEffect, useState } from 'react';

export function useAutoSave<T>(
  data: T,
  saveFunction: () => Promise<void>,
  deps: unknown[],
  delay = 1000,
  isLoading = false
) {
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isLoading) return;
    
    setSaveStatus('idle');
    const timer = setTimeout(async () => {
      try {
        setSaveStatus('saving');
        await saveFunction();
        setSaveStatus('saved');
        
        // Reset to idle after showing saved for a while
        const resetTimer = setTimeout(() => {
          setSaveStatus('idle');
        }, 3000);
        
        return () => clearTimeout(resetTimer);
      } catch (error) {
        setSaveStatus('error');
        setErrorMessage(error instanceof Error ? error.message : 'Save failed');
      }
    }, delay);
    
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, saveFunction, delay, ...deps]);

  return { saveStatus, errorMessage };
} 