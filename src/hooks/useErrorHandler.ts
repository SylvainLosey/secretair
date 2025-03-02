// src/hooks/useErrorHandler.ts
import { useErrorContext } from '~/contexts/ErrorContext';

export function useErrorHandler() {
  const { captureError, captureMessage } = useErrorContext();
  
  const handleError = (error: unknown, customMessage: string, report = false) => {
    captureError(error, customMessage, report);
    return false;
  };
  
  return { 
    handleError,
    captureMessage
  };
}