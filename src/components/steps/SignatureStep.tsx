"use client";

// src/components/steps/SignatureStep.tsx
import { useRef, useState, useEffect } from "react";
import SignatureCanvas from "react-signature-canvas";
import { useWizardStore } from "~/lib/store";
import { api } from "~/utils/api";
import { StepLayout } from "~/components/ui/StepLayout";
import { Button } from "~/components/ui/Button";

export default function SignatureStep() {
  const { letterId } = useWizardStore();
  const [signature, setSignature] = useState<string | null>(null);
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
      }
      setIsLoading(false);
    }
  }, [letterQuery.data]);

  const clearSignature = () => {
    if (sigCanvas.current) {
      sigCanvas.current.clear();
      setSignature(null);
    }
  };

  const saveSignature = () => {
    if (sigCanvas.current && !sigCanvas.current.isEmpty() && letterId) {
      const signatureDataUrl = sigCanvas.current.toDataURL('image/png');
      setSignature(signatureDataUrl);
      
      updateLetterMutation.mutate({
        id: letterId,
        signature: signatureDataUrl,
      });
    }
  };

  const renderSignatureActions = () => (
    <div className="flex space-x-4">
      <Button
        variant="secondary"
        onClick={clearSignature}
      >
        Clear
      </Button>
      <Button
        onClick={saveSignature}
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
      {signature ? (
        <div className="mb-4">
          <div className="mb-4 rounded-lg border border-gray-200 bg-white p-4">
            <img 
              src={signature} 
              alt="Your signature" 
              className="mx-auto h-32 w-auto object-contain" 
            />
          </div>
          <Button
            variant="secondary"
            onClick={() => setSignature(null)}
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
