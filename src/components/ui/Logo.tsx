import React from 'react';

interface LogoProps {
  className?: string;
  textColor?: string;
}

export function Logo({ className = "", textColor = "text-mint-100" }: LogoProps) {
  return (
    <div className={`font-bold ${textColor} ${className}`}>
      <span className="text-2xl">Simpler</span>
      <span className="text-2xl">Post</span>
    </div>
  );
} 