import Stripe from 'stripe';
import { loadStripe } from '@stripe/stripe-js';
import type { Stripe as StripeClient } from '@stripe/stripe-js';

// Server-side Stripe instance - will only be used in API routes
// This will not be included in client-side bundles
let stripe: Stripe | undefined;
if (typeof window === 'undefined') {
  // Only initialize on the server side
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
}

// Helper function to format amount for Stripe (converts dollars to cents)
export const formatAmountForStripe = (amount: number): number => {
  return Math.round(amount * 100);
};

// Client-side singleton pattern for Stripe.js
let stripePromise: Promise<StripeClient | null> | null = null;
export const getStripeClient = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
  }
  return stripePromise;
};

// Export the stripe instance for server-side use
export { stripe };
