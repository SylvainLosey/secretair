"use client";

// src/components/steps/ReviewStep.tsx
import { useEffect, useState } from "react";
import { useWizardStore, type WizardStep } from "~/lib/store";
import { api, type RouterOutputs } from "~/utils/api";
import { useRouter } from "next/navigation";

// Define Letter type based on router output
type Letter = RouterOutputs["letter"]["getLetter"];

export default function ReviewStep() {
  const router = useRouter();
  const { letterId, resetWizard, setCurrentStep } = useWizardStore();
  const [isLoading, setIsLoading] = useState(true);
  const [letter, setLetter] = useState<Letter | null>(null);
  
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

  const downloadPdfDirectly = async () => {
    if (!letterId) return;
    
    try {
      // This calls our new tRPC procedure that returns PDF content
      const pdfResult = await api.letter.getPdfContent({ id: letterId });
      
      if (pdfResult.success) {
        // Convert base64 string back to bytes
        const byteCharacters = atob(pdfResult.pdfBytes);
        const byteNumbers = new Array(byteCharacters.length);
        
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/pdf' });
        
        // Create a download link
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = pdfResult.fileName;
        link.click();
        
        // Clean up
        URL.revokeObjectURL(link.href);
        
        // Continue with the workflow
        resetWizard();
        router.push("/");
      }
    } catch (error: unknown) {
      console.error("Error downloading PDF:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      alert(`Failed to download PDF: ${errorMessage}`);
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

  const handleEditSection = (section: WizardStep) => {
    // We're now using the WizardStep type directly
    if (section === "addresses" || section === "content" || section === "signature") {
      setCurrentStep(section);
    }
  };

  if (isLoading) {
    return <div className="text-center">Loading letter details...</div>;
  }

  // Make sure letter is not null before rendering
  if (!letter) {
    return <div className="text-center">Letter not found</div>;
  }

  return (
    <div>
      <h2 className="mb-4 text-xl font-semibold">Review Your Letter</h2>
      <p className="mb-6 text-gray-600">
        Please review your letter before we prepare it for sending
      </p>
      
      <div className="mb-6 rounded-lg border border-gray-200 bg-gray-50 p-6">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-md font-medium">Addressing Information</h3>
            <div className="flex space-x-2">
              <button
                onClick={() => handleEditSection("addresses")}
                className="text-sm text-blue-600 hover:underline"
              >
                Edit
              </button>
              <button
                onClick={handleSwapAddresses}
                className="flex items-center text-sm text-gray-600 hover:text-gray-900"
                type="button"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                </svg>
                Swap
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="mb-1 text-sm font-medium text-gray-500">From</h3>
              <p className="font-medium">{letter.senderName}</p>
              <p className="whitespace-pre-line text-sm">{letter.senderAddress}</p>
            </div>
            
            <div>
              <h3 className="mb-1 text-sm font-medium text-gray-500">To</h3>
              <p className="font-medium">{letter.receiverName}</p>
              <p className="whitespace-pre-line text-sm">{letter.receiverAddress}</p>
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
        <button
          onClick={handleGeneratePdf}
          disabled={generatePdfMutation.isLoading}
          className="rounded-md bg-blue-600 px-6 py-2 text-white hover:bg-blue-700 disabled:bg-blue-300"
        >
          {generatePdfMutation.isLoading ? "Preparing..." : "Generate Letter PDF"}
        </button>
        
        <button
          onClick={downloadPdfDirectly}
          className="rounded-md bg-green-600 px-6 py-2 text-white hover:bg-green-700"
        >
          Download PDF Directly
        </button>
      </div>
    </div>
  );
}
