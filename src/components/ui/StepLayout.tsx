"use client";

import React from 'react';

interface StepLayoutProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

export function StepLayout({ title, description, children }: StepLayoutProps) {
  return (
    <div className="flex flex-col">
      <h2 className="mb-2 text-center text-2xl font-bold text-gray-800">{title}</h2>
      {description && (
        <p className="mb-6 text-center text-gray-600">{description}</p>
      )}
      <div className="flex-1">{children}</div>
    </div>
  );
} 