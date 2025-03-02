"use client";

// src/components/steps/AddressesStep.tsx (continued)
import { useEffect, useState, forwardRef, useImperativeHandle } from "react";
import { useWizardStore } from "~/lib/store";
import { api } from "~/utils/api";
import { StepLayout } from "~/components/ui/StepLayout";
import { Input } from "~/components/ui/Input";
import { ErrorMessage } from "~/components/ui/ErrorMessage";
import { useTranslations } from 'next-intl';

// Define the interface for the exposed methods
export interface AddressesStepRef {
  saveData: () => Promise<boolean>;
}

const AddressesStep = forwardRef<AddressesStepRef>((_, ref) => {
  const { letterId } = useWizardStore();
  const [senderName, setSenderName] = useState("");
  const [senderAddress, setSenderAddress] = useState("");
  const [receiverName, setReceiverName] = useState("");
  const [receiverAddress, setReceiverAddress] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const t = useTranslations('addressesStep');

  const letterQuery = api.letter.getLetter.useQuery(
    { id: letterId! },
    { enabled: !!letterId }
  );
  
  const updateLetterMutation = api.letter.updateLetter.useMutation();

  useEffect(() => {
    if (letterQuery.data) {
      setSenderName(letterQuery.data.senderName);
      setSenderAddress(letterQuery.data.senderAddress);
      setReceiverName(letterQuery.data.receiverName);
      setReceiverAddress(letterQuery.data.receiverAddress);
      setIsLoading(false);
    }
  }, [letterQuery.data]);

  const saveAddresses = async (): Promise<boolean> => {
    if (!letterId) return false;
    
    try {
      setIsSaving(true);
      setErrorMessage(null);
      
      await updateLetterMutation.mutateAsync({
        id: letterId,
        senderName,
        senderAddress,
        receiverName,
        receiverAddress,
      });
      
      return true; // Save successful
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to save addresses");
      return false; // Save failed
    } finally {
      setIsSaving(false);
    }
  };

  // Expose the saveData method to the parent component
  useImperativeHandle(ref, () => ({
    saveData: saveAddresses
  }));

  return (
    <StepLayout
      title={t('title')}
      description={t('description')}
      isLoading={isLoading}
      loadingMessage="Loading address information..."
    >
      <div className="mb-6">
        <h3 className="mb-3 text-lg font-medium">{t('senderSection')}</h3>
        <Input
          label={t('senderName')}
          value={senderName}
          onChange={(e) => setSenderName(e.target.value)}
          placeholder="Enter your full name"
        />
        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium text-gray-700">
            {t('senderAddress')}
          </label>
          <textarea
            value={senderAddress}
            onChange={(e) => setSenderAddress(e.target.value)}
            className="w-full rounded-lg border border-gray-300 p-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            rows={3}
            placeholder="Enter your address"
          />
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-lg font-medium">{t('recipientSection')}</h3>
        <Input
          label={t('recipientName')}
          value={receiverName}
          onChange={(e) => setReceiverName(e.target.value)}
          placeholder="Enter recipient's name or organization"
        />
        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium text-gray-700">
            {t('recipientAddress')}
          </label>
          <textarea
            value={receiverAddress}
            onChange={(e) => setReceiverAddress(e.target.value)}
            className="w-full rounded-lg border border-gray-300 p-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            rows={3}
            placeholder="Enter recipient's address"
          />
        </div>
      </div>
      
      {errorMessage && <ErrorMessage message={errorMessage} />}
      
      <div className="mt-2 text-right text-sm">
        {isSaving && <span className="text-blue-500">{t('saving')}</span>}
      </div>
    </StepLayout>
  );
});

AddressesStep.displayName = "AddressesStep";

export default AddressesStep;
