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
    let resetTimer: NodeJS.Timeout | undefined;
    const timer = setTimeout(() => {
      const saveData = async () => {
        try {
          setSaveStatus('saving');
          await saveFunction();
          setSaveStatus('saved');
          
          // Reset to idle after showing saved for a while
          resetTimer = setTimeout(() => {
            setSaveStatus('idle');
          }, 3000);
        } catch (error) {
          setSaveStatus('error');
          setErrorMessage(error instanceof Error ? error.message : 'Save failed');
        }
      };
      
      void saveData();
    }, delay);
    
    // Single cleanup function that handles both timers
    return () => {
      clearTimeout(timer);
      if (resetTimer) clearTimeout(resetTimer);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, saveFunction, delay, ...deps]);

  return { saveStatus, errorMessage };
} 