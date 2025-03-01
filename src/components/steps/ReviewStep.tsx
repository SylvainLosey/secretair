"use client";

// src/components/steps/ReviewStep.tsx
import { useEffect, useState } from "react";
import { useWizardStore } from "~/lib/store";
import { api, type RouterOutputs } from "~/utils/api";
import { Button } from "~/components/ui/Button";
import { ErrorMessage } from "~/components/ui/ErrorMessage";
import { SuccessMessage } from "~/components/ui/SuccessMessage";
import { LoadingSpinner } from "~/components/ui/LoadingSpinner";
import Image from "next/image";

// Define Letter type based on router output
type Letter = RouterOutputs["letter"]["getLetter"];

export default function ReviewStep() {
  const { letterId, setCurrentStep } = useWizardStore();
  const [isLoading, setIsLoading] = useState(true);
  const [letter, setLetter] = useState<Letter | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
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
    if (!letterId) return;
    
    try {
      setIsDownloading(true);
      setError(null);
      
      const response = await fetch('/api/download-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: letterId }),
      });
      
      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }
      
      // Define the response type
      type PdfResponse = {
        success: boolean;
        pdfBytes?: string;
        fileName?: string;
        message?: string;
      };
      
      // Parse the response with type
      const data = await response.json() as PdfResponse;
      
      if (!data.success || !data.pdfBytes) {
        throw new Error(data.message ?? "Failed to generate PDF");
      }
      
      // Convert base64 to blob
      const byteCharacters = atob(data.pdfBytes);
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
      link.download = data.fileName ?? "letter.pdf";
      link.click();
      
      URL.revokeObjectURL(url);
      
      setSuccessMessage("PDF downloaded successfully!");
      // Removed resetWizard() and router.push("/") to maintain state
    } catch (error: unknown) {
      console.error("Error downloading PDF:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      setError(`Failed to download PDF: ${errorMessage}`);
    } finally {
      setIsDownloading(false);
    }
  };

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
    <div className="rounded-lg bg-gray-50 p-6">
      <h2 className="mb-4 text-center text-2xl font-bold text-gray-800">
        Review Your Letter
      </h2>
      
      <ErrorMessage message={error} />
      <SuccessMessage message={successMessage} />
      
      <div className="mb-8">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-500">Sender & Recipient</h3>
            <div className="flex space-x-2">
              <button
                onClick={handleSwapAddresses}
                className="text-sm font-medium text-blue-600 hover:underline"
              >
                Swap Addresses
              </button>
              <button
                onClick={() => handleEditSection("addresses")}
                className="text-sm text-blue-600 hover:underline"
              >
                Edit
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-md border border-gray-200 bg-white p-4">
              <h4 className="mb-2 text-xs font-medium text-gray-400">From</h4>
              <div className="text-sm">
                <p className="font-medium">{letter.senderName}</p>
                <p className="whitespace-pre-line">{letter.senderAddress}</p>
              </div>
            </div>
            
            <div className="rounded-md border border-gray-200 bg-white p-4">
              <h4 className="mb-2 text-xs font-medium text-gray-400">To</h4>
              <div className="text-sm">
                <p className="font-medium">{letter.receiverName}</p>
                <p className="whitespace-pre-line">{letter.receiverAddress}</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-500">Letter Content</h3>
            <button
              onClick={() => handleEditSection("content")}
              className="text-sm text-blue-600 hover:underline"
            >
              Edit
            </button>
          </div>
          <div className="whitespace-pre-line rounded-md border border-gray-200 bg-white p-4">
            {letter.content}
          </div>
        </div>
        
        {letter.signature && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-500">Signature</h3>
              <button
                onClick={() => handleEditSection("signature")}
                className="text-sm text-blue-600 hover:underline"
              >
                Edit
              </button>
            </div>
            <div className="rounded-md border border-gray-200 bg-white p-4">
              <Image 
                src={letter.signature}
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
          isLoading={isDownloading}
          disabled={isDownloading}
          leftIcon={
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
        >
          Download PDF
        </Button>
        
        <Button
          variant="primary"
          onClick={() => {
            alert("In a real app, this would go to payment. For now, we'll just download the PDF.");
            void downloadPdf();
          }}
        >
          Pay & Send Letter
        </Button>
      </div>
    </div>
  );
}
