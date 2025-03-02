import React from 'react';
import Image from 'next/image';

interface LogoProps {
  className?: string;
  textColor?: string;
}

export function Logo({ className = ""}: LogoProps) {
  return (
    <div className={`flex items-center ${className}`}>
      <Image 
        src="/printmail.svg" 
        alt="PrintMail Logo" 
        width={120} 
        height={22} 
        className="h-8 w-auto filter brightness-0 invert-[1]" 
      />
    </div>
  );
} 