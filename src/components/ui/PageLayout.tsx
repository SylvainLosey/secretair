import React from 'react';
import { Logo } from './Logo';

interface PageLayoutProps {
  children: React.ReactNode;
}

export function PageLayout({ children }: PageLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="bg-navy-700 py-5 shadow-sm">
        <div className="container mx-auto px-4">
          <Logo />
          <p className="text-mint-200">Printer, enveloppe, stamps ? Not needed anymore.</p>
        </div>
      </header>
      
      <main className="flex-grow bg-gray-100 py-8">
        <div className="container mx-auto px-4">
          {children}
        </div>
      </main>
      
      <footer className="bg-navy-700 py-4 shadow-inner">
        <div className="container mx-auto px-4 text-center text-mint-200">
          <p>&copy; {new Date().getFullYear()} SimplerPost - MVP Version</p>
        </div>
      </footer>
    </div>
  );
} 