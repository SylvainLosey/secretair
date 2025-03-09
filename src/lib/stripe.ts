import Stripe from 'stripe';
import { env } from '~/env';
import { loadStripe } from '@stripe/stripe-js';
import type { Stripe as StripeClient } from '@stripe/stripe-js';
// Initialize Stripe with your secret key for server-side
export const stripe = new Stripe(env.STRIPE_SECRET_KEY);

// Helper function to format amount for Stripe (converts dollars to cents)
export const formatAmountForStripe = (amount: number): number => {
  return Math.round(amount * 100);
};

// For client-side use
let stripePromise: Promise<StripeClient | null> | null = null;

export const getStripeClient = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
  }
  return stripePromise;
};
