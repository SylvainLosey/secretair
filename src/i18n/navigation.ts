import { createSharedPathnamesNavigation } from 'next-intl/navigation';
import { locales } from './locales';

// Create shared navigation functions
export const { Link, redirect, usePathname, useRouter } = 
  createSharedPathnamesNavigation({ locales }); 