interface Window {
  Stripe?: (publishableKey: string) => {
    redirectToCheckout: (options: { sessionId: string }) => Promise<{ error?: Error }>;
  };
} 