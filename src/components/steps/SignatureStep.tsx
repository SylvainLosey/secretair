"use client";

// src/components/steps/SignatureStep.tsx
import { useRef, useState, useEffect } from "react";
import SignatureCanvas from "react-signature-canvas";
import { useWizardStore } from "~/lib/store";
import { api } from "~/utils/api";
import { StepLayout } from "~/components/ui/StepLayout";
import { Button } from "~/components/ui/Button";
import Image from "next/image";
import { uploadImage } from '~/utils/supabase-storage';
import { ErrorMessage } from "~/components/ui/ErrorMessage";

export default function SignatureStep() {
  const { letterId } = useWizardStore();
  const [signature, setSignature] = useState<string | null>(null);
  const [, setUploadedSignatureUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sigCanvas = useRef<SignatureCanvas>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const letterQuery = api.letter.getLetter.useQuery(
    { id: letterId ?? "" },
    { enabled: !!letterId }
  );
  
  const updateLetterMutation = api.letter.updateLetter.useMutation();

  useEffect(() => {
    if (letterQuery.data) {
      if (letterQuery.data.signature) {
        setSignature(letterQuery.data.signature);
        setUploadedSignatureUrl(letterQuery.data.signature);
      }
      setIsLoading(false);
    }
  }, [letterQuery.data]);

  // Add a standardized error handler (matching UploadStep)
  const handleError = (error: unknown, customMessage: string) => {
    console.error(`${customMessage}:`, error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    setError(`${customMessage}: ${errorMessage}`);
    setIsUploading(false);
  };

  const clearSignature = () => {
    if (sigCanvas.current) {
      sigCanvas.current.clear();
      setSignature(null);
      setError(null);
    }
  };

  const saveSignature = async () => {
    if (!sigCanvas.current || sigCanvas.current.isEmpty()) {
      setError("Please add your signature before saving");
      return;
    }
    
    if (!letterId) {
      setError("Letter ID is missing");
      return;
    }
    
    try {
      setIsUploading(true);
      setError(null);
      
      const signatureDataUrl = sigCanvas.current.toDataURL('image/png');
      
      // Upload to Supabase
      const signatureUrl = await uploadImage(signatureDataUrl, 'signatures');
      
      if (!signatureUrl) {
        throw new Error('Failed to upload signature');
      }
      
      // Save the URL in state for later use
      setUploadedSignatureUrl(signatureUrl);
      
      // Save the URL in your database
      await updateLetterMutation.mutateAsync({
        id: letterId,
        signature: signatureUrl,
      });
      
      // Update local state with the URL
      setSignature(signatureUrl);
      setIsUploading(false);
    } catch (error) {
      handleError(error, "Error saving signature");
    }
  };

  const renderSignatureActions = () => (
    <div className="flex space-x-4">
      <Button
        variant="secondary"
        onClick={clearSignature}
        disabled={isUploading}
      >
        Clear
      </Button>
      <Button
        onClick={saveSignature}
        disabled={isUploading}
        isLoading={isUploading}
      >
        Save Signature
      </Button>
    </div>
  );

  return (
    <StepLayout
      title="Add Your Signature"
      description="Sign in the box below. This will appear at the bottom of your letter."
      isLoading={isLoading}
      loadingMessage="Loading signature..."
    >
      <ErrorMessage message={error} />
      
      {signature ? (
        <div className="mb-4">
          <div className="mb-4 rounded-lg border border-gray-200 bg-white p-4">
            <Image 
              src={signature} 
              alt="Your signature" 
              width={240}
              height={80}
              className="mx-auto h-32 w-auto object-contain" 
            />
          </div>
          <Button
            variant="secondary"
            onClick={() => {
              setSignature(null);
              setError(null);
            }}
          >
            Draw New Signature
          </Button>
        </div>
      ) : (
        <div>
          <div className="mb-4 rounded-lg border border-gray-300 bg-white">
            <SignatureCanvas
              ref={sigCanvas}
              canvasProps={{
                className: "signature-canvas h-64 w-full",
              }}
              backgroundColor="white"
            />
          </div>
          
          {renderSignatureActions()}
        </div>
      )}
    </StepLayout>
  );
}
