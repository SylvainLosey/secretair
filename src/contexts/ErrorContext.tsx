"use client";

import React, { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import { toast } from 'sonner';

// For future Sentry integration
// import * as Sentry from '@sentry/nextjs';

type ErrorContextType = {
  captureError: (error: unknown, userMessage: string, report?: boolean) => void;
  captureMessage: (message: string, report?: boolean) => void;
};

const ErrorContext = createContext<ErrorContextType | undefined>(undefined);

export function ErrorProvider({ children }: { children: ReactNode }) {
  const captureError = (error: unknown, userMessage: string, report = false) => {
    // 1. Always log to console
    console.error(`${userMessage}:`, error);
    
    // 2. Show user-friendly toast
    toast.error(userMessage);
    
    // 3. Optional: Report to monitoring service
    if (report) {
      // Sentry example (uncomment when needed)
      // Sentry.captureException(error);
    }
  };

  const captureMessage = (message: string, report = false) => {
    // 1. Show toast to user
    toast.error(message);
    
    // 2. Optional: Report to monitoring
    if (report) {
      // Sentry.captureMessage(message);
    }
  };

  const value = {
    captureError,
    captureMessage,
  };

  return (
    <ErrorContext.Provider value={value}>
      {children}
    </ErrorContext.Provider>
  );
}

export function useErrorContext() {
  const context = useContext(ErrorContext);
  if (context === undefined) {
    throw new Error('useErrorContext must be used within an ErrorProvider');
  }
  return context;
} 