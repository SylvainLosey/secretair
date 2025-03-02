// src/hooks/useErrorHandler.ts
import { useState } from 'react';

export function useErrorHandler() {
  const [error, setError] = useState<string | null>(null);
  
  const handleError = (error: unknown, customMessage: string) => {
    console.error(`${customMessage}:`, error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    setError(`${customMessage}: ${errorMessage}`);
    return false;
  };
  
  const clearError = () => setError(null);
  
  return { error, handleError, clearError };
}