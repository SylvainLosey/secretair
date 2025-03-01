"use client";

// src/components/steps/SignatureStep.tsx
import { useRef, useState, useEffect } from "react";
import SignatureCanvas from "react-signature-canvas";
import { useWizardStore } from "~/lib/store";
import { api } from "~/utils/api";

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

  if (isLoading) {
    return <div className="text-center">Loading...</div>;
  }

  return (
    <div>
      <h2 className="mb-4 text-xl font-semibold">Add Your Signature</h2>
      <p className="mb-6 text-gray-600">
        Sign in the box below. This will appear at the bottom of your letter.
      </p>
      
      {signature ? (
        <div className="mb-4">
          <div className="mb-2 rounded-lg border border-gray-200 bg-white p-4">
            <img 
              src={signature} 
              alt="Your signature" 
              className="mx-auto h-32 w-auto object-contain" 
            />
          </div>
          <button
            onClick={() => setSignature(null)}
            className="rounded-md bg-gray-100 px-4 py-2 text-gray-700 hover:bg-gray-200"
          >
            Draw New Signature
          </button>
        </div>
      ) : (
        <div>
          <div className="mb-4 rounded-lg border border-gray-300 bg-white">
            <SignatureCanvas
              ref={sigCanvas}
              canvasProps={{
                className: "signature-canvas w-full h-64",
              }}
              backgroundColor="white"
            />
          </div>
          
          <div className="flex space-x-4">
            <button
              onClick={clearSignature}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50"
            >
              Clear
            </button>
            <button
              onClick={saveSignature}
              className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              Save Signature
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
