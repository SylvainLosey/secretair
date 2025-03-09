'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import Link from 'next/link';
import { CheckCircle } from 'lucide-react';

export default function SuccessPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [isVerified, setIsVerified] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const verifyPayment = async () => {
      if (!sessionId) {
        setIsVerified(false);
        setIsLoading(false);
        return;
      }

      try {
        // Call your API or trpc to verify the payment
        const response = await fetch('/api/verify-payment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ sessionId }),
        });

        const data = await response.json();
        setIsVerified(data.success);
      } catch (error) {
        console.error('Error verifying payment:', error);
        setIsVerified(false);
      } finally {
        setIsLoading(false);
      }
    };

    void verifyPayment();
  }, [sessionId]);

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-12">
      <Card className="max-w-lg mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-6 w-6 text-green-500" />
            Thank You for Your Order
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isVerified ? (
            <>
              <p className="text-lg">
                Your payment was successful! Your letter will be processed and sent shortly.
              </p>
              <p>
                A confirmation email will be sent to you with the tracking information when your letter is dispatched.
              </p>
            </>
          ) : (
            <p className="text-lg text-amber-600">
              We have received your order, but we are still processing your payment. You will receive a confirmation email once the payment is confirmed.
            </p>
          )}
          
          <div className="pt-4">
            <Link href="/">
              <Button>Return to Home</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 