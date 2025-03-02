"use client";

import { useEffect, useRef } from 'react';
import { toast } from 'sonner';

interface SuccessMessageProps {
  message: string | null;
  className?: string;
}

export function SuccessMessage({ message }: SuccessMessageProps) {
  const prevMessageRef = useRef<string | null>(null);
  
  useEffect(() => {
    if (message && message !== prevMessageRef.current) {
      toast.success(message);
      prevMessageRef.current = message;
    }
    
    if (!message) {
      prevMessageRef.current = null;
    }
  }, [message]);

  return null;
} 