/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
"use client";

// src/components/steps/ReviewStep.tsx
import { useEffect, useState } from "react";
import { useWizardStore } from "~/lib/store";
import { api, type RouterOutputs } from "~/utils/api";
import { Button } from "~/components/ui/button";
import { SuccessMessage } from "~/components/common/SuccessMessage";
import { LoadingSpinner } from "~/components/common/LoadingSpinner";
import Image from "next/image";
import { generatePDF } from "~/utils/pdf-generator";
import { uploadPdf } from "~/utils/supabase-storage";
import { useErrorHandler } from "~/hooks/useErrorHandler";
import { useTranslations } from 'next-intl';

// Define Letter type based on router output
type Letter = RouterOutputs["letter"]["getLetter"];

export default function ReviewStep() {
  const { letterId, setCurrentStep } = useWizardStore();
  const [isLoading, setIsLoading] = useState(true);
  const [letter, setLetter] = useState<Letter | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const { handleError } = useErrorHandler();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const t = useTranslations('reviewStep');
  
  const letterQuery = api.letter.getLetter.useQuery(
    { id: letterId ?? "" },
    { enabled: !!letterId }
  );
  
  const updateLetterMutation = api.letter.updateLetter.useMutation();

  useEffect(() => {
    if (letterQuery.data) {
      setLetter(letterQuery.data);
      setIsLoading(false);
    }
  }, [letterQuery.data]);

  const downloadPdf = async () => {
    try {
      setIsDownloading(true);      
      // Get the letter data
      const letter = await letterQuery.refetch();
      
      if (!letter.data) {
        throw new Error('Failed to fetch letter data');
      }
      
      // Generate the PDF on the client side
      const { pdfBytes, fileName } = await generatePDF(letter.data);
      
      // Save the PDF to storage 
      const pdfUrl = await uploadPdf(pdfBytes, 'pdfs');
      
      // Update the letter's pdfUrl in the database
      if (pdfUrl && letterId) {
        await updateLetterMutation.mutateAsync({
          id: letterId,
          pdfUrl: pdfUrl,
        });
      }
      
      // Download the PDF
      downloadBinaryFile(pdfBytes, fileName ?? "letter.pdf");
      
      setSuccessMessage("PDF downloaded and saved to your account!");
    } catch (error) {
      handleError(error, "PDF Generation Error");
    } finally {
      setIsDownloading(false);
    }
  };

  // Helper function to download binary data
  function downloadBinaryFile(base64Data: string, fileName: string) {
    const byteCharacters = atob(base64Data);
    const byteArrays = [];
    
    for (let offset = 0; offset < byteCharacters.length; offset += 512) {
      const slice = byteCharacters.slice(offset, offset + 512);
      
      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }
      
      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }
    
    const blob = new Blob(byteArrays, { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    
    URL.revokeObjectURL(url);
  }

  const handleSwapAddresses = async () => {
    if (!letter || !letterId) return;
    
    // Create temporary variables to hold original values
    const tempName = letter.senderName;
    const tempAddress = letter.senderAddress;
    
    // Update letter in state
    setLetter({
      ...letter,
      senderName: letter.receiverName,
      senderAddress: letter.receiverAddress,
      receiverName: tempName,
      receiverAddress: tempAddress,
    });
    
    // Update letter in database
    await updateLetterMutation.mutateAsync({
      id: letterId,
      senderName: letter.receiverName,
      senderAddress: letter.receiverAddress,
      receiverName: tempName,
      receiverAddress: tempAddress,
    });

    setSuccessMessage("Addresses swapped successfully!");
  };

  const handleEditSection = (section: "addresses" | "content" | "signature") => {
    if (section === "addresses") {
      setCurrentStep("addresses");
    } else if (section === "content") {
      setCurrentStep("content");
    } else if (section === "signature") {
      setCurrentStep("signature");
    }
  };

  if (isLoading || !letter) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <LoadingSpinner size="lg" message="Loading letter details..." />
      </div>
    );
  }

  return (
    <div className="rounded-lg p-6">
      <h2 className="mb-4 text-center text-2xl font-bold text-gray-800">
        {t('title')}
      </h2>
      
      <SuccessMessage message={successMessage} />
      
      <div className="mb-8">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-500">{t('addressesSection')}</h3>
            <div className="flex space-x-2">
              <button
                onClick={handleSwapAddresses}
                className="text-sm font-medium text-blue-600 hover:underline"
              >
                {t('swapAddresses')}
              </button>
              <button
                onClick={() => handleEditSection("addresses")}
                className="text-sm text-blue-600 hover:underline"
              >
                {t('edit')}
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-md border border-gray-200 bg-white p-4">
              <h4 className="mb-2 text-xs font-medium text-gray-400">{t('fromLabel')}</h4>
              <div className="text-sm">
                <p className="font-medium">{letter.senderName}</p>
                <p className="whitespace-pre-line">{letter.senderAddress}</p>
              </div>
            </div>
            
            <div className="rounded-md border border-gray-200 bg-white p-4">
              <h4 className="mb-2 text-xs font-medium text-gray-400">{t('toLabel')}</h4>
              <div className="text-sm">
                <p className="font-medium">{letter.receiverName}</p>
                <p className="whitespace-pre-line">{letter.receiverAddress}</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-500">{t('contentSection')}</h3>
            <button
              onClick={() => handleEditSection("content")}
              className="text-sm text-blue-600 hover:underline"
            >
              {t('edit')}
            </button>
          </div>
          <div className="whitespace-pre-line rounded-md border border-gray-200 bg-white p-4">
            {letter.content}
          </div>
        </div>
        
        {letter.signatureUrl && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-500">{t('signatureSection')}</h3>
              <button
                onClick={() => handleEditSection("signature")}
                className="text-sm text-blue-600 hover:underline"
              >
                {t('edit')}
              </button>
            </div>
            <div className="rounded-md border border-gray-200 bg-white p-4">
              <Image 
                src={letter.signatureUrl}
                alt="Your signature"
                width={200}
                height={80}
                className="h-16 w-auto object-contain"
              />
            </div>
          </div>
        )}
      </div>
      
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
          onClick={() => {
            alert(t('paymentAlert'));
            void downloadPdf();
          }}
        >
          {t('payButton')}
        </Button>
      </div>
    </div>
  );
}
