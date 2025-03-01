"use client";

// src/components/steps/ReviewStep.tsx
import { useEffect, useState } from "react";
import { useWizardStore } from "~/lib/store";
import { api } from "~/utils/api";
import { Button } from "~/components/ui/Button";
import type { RouterOutputs } from "~/utils/api";

// Define Letter type based on router output
type Letter = RouterOutputs["letter"]["getLetter"];

export default function ReviewStep() {
  const { letterId, setCurrentStep } = useWizardStore();
  const [isLoading, setIsLoading] = useState(true);
  const [letter, setLetter] = useState<Letter | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  
  const letterQuery = api.letter.getLetter.useQuery(
    { id: letterId ?? "" },
    { enabled: !!letterId }
  );
  
  const generatePdfMutation = api.letter.generatePdf.useMutation();

  useEffect(() => {
    if (letterQuery.data) {
      setLetter(letterQuery.data);
      setIsLoading(false);
    }
  }, [letterQuery.data]);

  const handleEditSection = (section: string) => {
    switch (section) {
      case "sender":
        setCurrentStep(1);
        break;
      case "recipient":
        setCurrentStep(2);
        break;
      case "content":
        setCurrentStep(3);
        break;
      case "signature":
        setCurrentStep(4);
        break;
    }
  };

  const handleGeneratePdf = async () => {
    if (!letterId) return;
    
    try {
      const result = await generatePdfMutation.mutateAsync({ id: letterId });
      
      if (result.success) {
        // For direct download, we'll open the PDF URL in a new tab
        window.open(`/api/pdf/${letterId}`, '_blank');
      }
    } catch (error: unknown) {
      console.error("Error generating PDF:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      alert(`Failed to generate PDF: ${errorMessage}`);
    }
  };

  const downloadPdfDirectly = async () => {
    if (!letterId) return;
    
    try {
      setIsDownloading(true);
      
      // Create a direct POST request to the API endpoint
      const response = await fetch('/api/download-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: letterId }),
      });
      
      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        // Convert base64 string back to bytes
        const byteCharacters = atob(result.pdfBytes);
        const byteNumbers = new Array(byteCharacters.length);
        
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/pdf' });
        
        // Create a download link
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = result.fileName || "letter.pdf";
        link.click();
        
        // Clean up
        URL.revokeObjectURL(link.href);
      } else {
        throw new Error(result.message || "Failed to get PDF content");
      }
    } catch (error: unknown) {
      console.error("Error downloading PDF:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      alert(`Failed to download PDF: ${errorMessage}`);
    } finally {
      setIsDownloading(false);
    }
  };

  if (isLoading || !letter) {
    return <div className="text-center">Loading...</div>;
  }

  return (
    <div>
      <div className="space-y-6">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-500">Sender Information</h3>
            <button
              onClick={() => handleEditSection("sender")}
              className="text-sm text-blue-600 hover:underline"
            >
              Edit
            </button>
          </div>
          <div className="rounded-md border border-gray-200 bg-white p-4">
            <p className="font-medium">{letter.senderName}</p>
            <p className="whitespace-pre-line">{letter.senderAddress}</p>
          </div>
        </div>
        
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-500">Recipient Information</h3>
            <button
              onClick={() => handleEditSection("recipient")}
              className="text-sm text-blue-600 hover:underline"
            >
              Edit
            </button>
          </div>
          <div className="rounded-md border border-gray-200 bg-white p-4">
            <p className="font-medium">{letter.receiverName}</p>
            <p className="whitespace-pre-line">{letter.receiverAddress}</p>
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
              <img 
                src={letter.signature} 
                alt="Your signature" 
                className="h-16 w-auto object-contain" 
              />
            </div>
          </div>
        )}
      </div>
      
      <div className="flex justify-center space-x-4 mt-8">
        <Button
          onClick={handleGeneratePdf}
          disabled={generatePdfMutation.isPending}
        >
          {generatePdfMutation.isPending ? "Generating..." : "Generate Letter PDF"}
        </Button>
        
        <Button
          variant="outline"
          onClick={downloadPdfDirectly}
          disabled={isDownloading}
        >
          {isDownloading ? "Downloading..." : "Download PDF Directly"}
        </Button>
      </div>
    </div>
  );
}
