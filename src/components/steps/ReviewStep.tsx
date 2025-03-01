"use client";

// src/components/steps/ReviewStep.tsx
import { useEffect, useState } from "react";
import { useWizardStore, type WizardStep } from "~/lib/store";
import { api, type RouterOutputs } from "~/utils/api";
import { useRouter } from "next/navigation";
import { Button } from "~/components/ui/Button";

// Define Letter type based on router output
type Letter = RouterOutputs["letter"]["getLetter"];

export default function ReviewStep() {
  const router = useRouter();
  const { letterId, resetWizard, setCurrentStep } = useWizardStore();
  const [isLoading, setIsLoading] = useState(true);
  const [letter, setLetter] = useState<Letter | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  
  const letterQuery = api.letter.getLetter.useQuery(
    { id: letterId ?? "" },
    { enabled: !!letterId }
  );
  
  const updateLetterMutation = api.letter.updateLetter.useMutation();
  const generatePdfMutation = api.letter.generatePdf.useMutation();

  useEffect(() => {
    if (letterQuery.data) {
      setLetter(letterQuery.data);
      setIsLoading(false);
    }
  }, [letterQuery.data]);

  const handleGeneratePdf = async () => {
    if (!letterId) return;
    
    try {
      const result = await generatePdfMutation.mutateAsync({ id: letterId });
      
      if (result.success) {
        // For direct download, we'll open the PDF URL in a new tab
        window.open(`/api/pdf/${letterId}`, '_blank');
        
        alert("PDF generated successfully! In a real app, you'd go to payment here.");
        resetWizard();
        router.push("/");
      }
    } catch (error: unknown) {
      console.error("Error generating PDF:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      alert(`Failed to generate PDF: ${errorMessage}`);
    }
  };

  const downloadPdf = async () => {
    if (!letterId) return;
    
    try {
      setIsDownloading(true);
      
      const response = await fetch('/api/download-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: letterId }),
      });
      
      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        // Convert base64 to blob and download
        const byteCharacters = atob(result.pdfBytes);
        const byteNumbers = new Array(byteCharacters.length);
        
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/pdf' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = result.fileName || "letter.pdf";
        link.click();
        
        URL.revokeObjectURL(link.href);
        
        // Navigate home after successful download
        resetWizard();
        router.push("/");
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
    return <div className="text-center">Loading letter details...</div>;
  }

  return (
    <div>
      <h2 className="mb-4 text-xl font-semibold">Review Your Letter</h2>
      <p className="mb-6 text-gray-600">
        Review all components of your letter before generating the final document
      </p>
      
      <div className="mb-6 space-y-6">
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-500">Address Information</h3>
            <div className="flex items-center">
              <button
                onClick={handleSwapAddresses}
                className="mr-3 text-sm text-blue-600 hover:underline"
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
          
          <div className="grid grid-cols-2 gap-4">
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
              <img 
                src={letter.signature} 
                alt="Your signature" 
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
          isLoading={isDownloading}
        >
          Download PDF
        </Button>
      </div>
    </div>
  );
}
