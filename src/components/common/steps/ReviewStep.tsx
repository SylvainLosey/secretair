/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
"use client";

// src/components/steps/ReviewStep.tsx
import {  useState } from "react";
import { useWizardStore } from "~/lib/store";
import { api, type RouterOutputs } from "~/utils/api";
import { Button } from "~/components/ui/button";
import { LoadingSpinner } from "~/components/common/LoadingSpinner";
import Image from "next/image";
import { generatePDF } from "~/utils/pdf-generator";
import { uploadPdf } from "~/utils/supabase-storage";
import { useErrorHandler } from "~/hooks/useErrorHandler";
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { env } from "~/env";

// Define Letter type based on router output
type Letter = RouterOutputs["letter"]["getLetter"];

export default function ReviewStep() {
  const { letterId } = useWizardStore();
  const t = useTranslations('reviewStep');
  const [letter, setLetter] = useState<Letter | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const { handleError } = useErrorHandler();

  // Stripe loading
  const loadStripeScript = async () => {
    if (!window.Stripe) {
      const script = document.createElement('script');
      script.src = 'https://js.stripe.com/v3/';
      script.async = true;
      document.body.appendChild(script);
    }
    return window.Stripe;
  };

  // Fetch letter data
  const { data, isLoading: isFetchingLetter } = api.letter.getLetter.useQuery(
    { id: letterId ?? "" },
    {
      enabled: !!letterId,
      onSuccess: (data) => {
        if (data) {
          setLetter(data);
          setIsLoading(false);
        }
      },
      onError: (error) => {
        handleError(error, "Failed to load letter data");
        setIsLoading(false);
      },
    }
  );

  // Generate and download the PDF
  const downloadPdf = async () => {
    if (!letter) return;
    
    try {
      setIsDownloading(true);
      
      // Generate PDF
      const pdfResult = await generatePDF(letter);
      
      // If we have a blob, either download it or upload it
      if (pdfResult.blob) {
        // Create a URL for the PDF blob
        const pdfUrl = URL.createObjectURL(pdfResult.blob);
        
        // Create a link element to trigger the download
        const link = document.createElement('a');
        link.href = pdfUrl;
        link.download = `letter_${letter.id}.pdf`; 
        link.click();
        
        // Clean up the URL object after download
        URL.revokeObjectURL(pdfUrl);
        
        // Also upload to Supabase for persistence
        if (letter.id) {
          void uploadPdf(pdfResult.blob, letter.id);
        }
      }
    } catch (error) {
      handleError(error, "Failed to generate PDF");
    } finally {
      setIsDownloading(false);
    }
  };

  // Handle payment with Stripe
  const handlePayment = async () => {
    if (!letter) return;
    
    try {
      setIsProcessingPayment(true);
      
      // First ensure PDF is generated and uploaded
      const pdfResult = await generatePDF(letter);
      if (pdfResult.blob && letter.id) {
        await uploadPdf(pdfResult.blob, letter.id);
      }
      
      // Request checkout session from our API
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          letterId: letter.id,
          letterPrice: 5.99, // Set your price here or fetch from config
        }),
      });
      
      const { sessionId } = await response.json();
      
      // Load Stripe and redirect to checkout
      const Stripe = await loadStripeScript();
      const stripe = Stripe(env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
      await stripe.redirectToCheckout({ sessionId });
    } catch (error) {
      handleError(error, "Payment processing failed");
      toast.error("Failed to process payment. Please try again.");
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Render loading state
  if (isLoading || isFetchingLetter) {
    return <LoadingSpinner size="lg" message={t('loading')} />;
  }

  // Render content if letter exists
  if (!letter) {
    return <div>No letter data found</div>;
  }

  // Format addresses for display
  const formatAddressForDisplay = (address: string) => {
    return address.split('\n').map((line, i) => (
      <span key={i} className="block">{line}</span>
    ));
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">{t('title')}</h2>
      
      {/* Address section */}
      <div className="rounded-lg border p-4">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-lg font-medium">{t('addressesSection')}</h3>
        </div>
        
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <p className="mb-1 text-sm font-medium text-gray-500">{t('fromLabel')}</p>
            <p className="font-medium">{letter.senderName}</p>
            <div className="text-sm text-gray-600">
              {formatAddressForDisplay(letter.senderAddress)}
            </div>
          </div>
          
          <div>
            <p className="mb-1 text-sm font-medium text-gray-500">{t('toLabel')}</p>
            <p className="font-medium">{letter.receiverName}</p>
            <div className="text-sm text-gray-600">
              {formatAddressForDisplay(letter.receiverAddress)}
            </div>
          </div>
        </div>
      </div>
      
      {/* Content section */}
      <div className="rounded-lg border p-4">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-lg font-medium">{t('contentSection')}</h3>
        </div>
        <div className="whitespace-pre-wrap">{letter.content}</div>
      </div>
      
      {/* Signature section */}
      {letter.signatureUrl && (
        <div className="rounded-lg border p-4">
          <div className="mb-2">
            <h3 className="text-lg font-medium">{t('signatureSection')}</h3>
          </div>
          <div className="flex justify-center">
            <Image 
              src={letter.signatureUrl} 
              alt="Signature" 
              width={200} 
              height={100} 
              className="h-auto max-w-full"
            />
          </div>
        </div>
      )}
      
      <div className="flex justify-center space-x-4">        
        <Button
          variant="outline"
          onClick={downloadPdf}
          disabled={isDownloading}
        >
          {isDownloading ? (
            <>
              <svg className="mr-2 h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {t('downloadingButton')}
            </>
          ) : (
            <>
              <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {t('downloadButton')}
            </>
          )}
        </Button>
        
        <Button
          variant="default"
          onClick={handlePayment}
          disabled={isProcessingPayment}
        >
          {isProcessingPayment ? (
            <>
              <svg className="mr-2 h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </>
          ) : (
            <>
              <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              {t('payButton')}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
