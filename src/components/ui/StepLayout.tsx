"use client";

import React from 'react';

interface StepLayoutProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  isLoading?: boolean;
  loadingMessage?: string;
  actions?: React.ReactNode;
}

export function StepLayout({
  title,
  description,
  children,
  isLoading = false,
  loadingMessage = "Loading...",
  actions,
}: StepLayoutProps) {
  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="mb-4 flex justify-center">
            <svg className="h-8 w-8 animate-spin text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <p className="text-gray-600">{loadingMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-2">
      <h2 className="mb-5 text-xl font-semibold">{title}</h2>
      {description && <p className="mb-6 text-gray-600">{description}</p>}
      <div className="mb-8">{children}</div>
      {actions && <div className="mt-6">{actions}</div>}
    </div>
  );
} 