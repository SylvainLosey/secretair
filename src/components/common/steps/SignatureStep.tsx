"use client";

// src/components/steps/SignatureStep.tsx
import { useRef, useState, useEffect, forwardRef, useImperativeHandle } from "react";
import SignatureCanvas from "react-signature-canvas";
import { useWizardStore } from "~/lib/store";
import { api } from "~/utils/api";
import { StepLayout } from "~/components/common/StepLayout";
import { Button } from "~/components/common/Button";
import Image from "next/image";
import { uploadImage } from '~/utils/supabase-storage';
import { ErrorMessage } from "~/components/common/ErrorMessage";
import { useErrorHandler } from "~/hooks/useErrorHandler";
import { useTranslations } from 'next-intl';

// Define the interface for the exposed methods
export interface SignatureStepRef {
  saveData: () => Promise<boolean>;
}

const SignatureStep = forwardRef<SignatureStepRef>((_, ref) => {
  const { letterId } = useWizardStore();
  const [signature, setSignature] = useState<string | null>(null);
  const [uploadedSignatureUrl, setUploadedSignatureUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { error, handleError, clearError } = useErrorHandler();
  const sigCanvas = useRef<SignatureCanvas>(null);
  const [isLoading, setIsLoading] = useState(true);
  const t = useTranslations('signatureStep');
  
  const letterQuery = api.letter.getLetter.useQuery(
    { id: letterId ?? "" },
    { enabled: !!letterId }
  );
  
  const updateLetterMutation = api.letter.updateLetter.useMutation();

  useEffect(() => {
    if (letterQuery.data) {
      if (letterQuery.data.signatureUrl) {
        setSignature(letterQuery.data.signatureUrl);
        setUploadedSignatureUrl(letterQuery.data.signatureUrl);
      }
      setIsLoading(false);
    }
  }, [letterQuery.data]);

  const clearSignature = () => {
    if (sigCanvas.current) {
      sigCanvas.current.clear();
      setSignature(null);
      clearError();
    }
  };
  
  const saveSignature = async (): Promise<boolean> => {
    if (!letterId) return false;
    
    try {
      setIsUploading(true);
      clearError();
      
      // If we already have a signature and it's already uploaded, no need to re-upload
      if (signature && signature === uploadedSignatureUrl) {
        return true;
      }
      
      // If there's no signature drawn but we're using an existing one
      if (!sigCanvas.current && signature) {
        return true;
      }
      const trimmedCanvas = sigCanvas.current?.getTrimmedCanvas();

      // Get the signature data as a PNG
      const signatureDataUrl = trimmedCanvas?.toDataURL('image/png');

      if (!signatureDataUrl) {
        throw new Error("Failed to trim signature");
      }

      const signatureUrl = await uploadImage(signatureDataUrl, "signatures");
      
      if (!signatureUrl) {
        throw new Error("Failed to upload signature");
      }
      // Update signature in state
      setSignature(signatureUrl);
      setUploadedSignatureUrl(signatureUrl);
      
      // Update letter in database
      await updateLetterMutation.mutateAsync({
        id: letterId,
        signatureUrl: signatureUrl,
      });
      
      return true;
    } catch (error) {
      handleError(error, "Signature Error");
      return false;
    } finally {
      setIsUploading(false);
    }
  };
  
  // Expose the saveData method to the parent component
  useImperativeHandle(ref, () => ({
    saveData: saveSignature
  }));

  const renderSignatureActions = () => (
    <div className="flex space-x-4">
      <Button
        variant="secondary"
        onClick={clearSignature}
        disabled={isUploading}
      >
        {t('clearButton')}
      </Button>
      <Button
        onClick={saveSignature}
        disabled={isUploading}
        isLoading={isUploading}
      >
        {t('saveButton')}
      </Button>
    </div>
  );

  return (
    <StepLayout
      title={t('title')}
      description={t('description')}
      isLoading={isLoading}
      loadingMessage={t('loading')}
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
              clearError();
            }}
          >
            {t('drawNewButton')}
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
              backgroundColor="rgba(255,255,255,0)"
            />
          </div>
          
          {renderSignatureActions()}
        </div>
      )}
    </StepLayout>
  );
});

SignatureStep.displayName = "SignatureStep";

export default SignatureStep;
