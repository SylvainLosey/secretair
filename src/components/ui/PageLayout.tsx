import React from 'react';
import { Logo } from './Logo';

interface PageLayoutProps {
  children: React.ReactNode;
}

export function PageLayout({ children }: PageLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="bg-blue-900 py-5 shadow-sm">
        <div className="container mx-auto px-4">
          <Logo />
          <p className="text-blue-100 text-sm mt-2">Send physical mail without the hassle</p>
        </div>
      </header>
      
      <main className="flex-grow bg-gray-100 py-8">
        <div className="container mx-auto px-4">
          {children}
        </div>
      </main>
      
      <footer className="bg-blue-900 py-4 shadow-inner">
        <div className="container mx-auto px-4 text-center text-blue-100">
          <p>&copy; {new Date().getFullYear()} PrintMail - Making postal mail simple</p>
        </div>
      </footer>
    </div>
  );
} 