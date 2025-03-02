"use client";

// src/components/steps/AddressesStep.tsx (continued)
import { useEffect, useState, forwardRef, useImperativeHandle } from "react";
import { useWizardStore } from "~/lib/store";
import { api } from "~/utils/api";
import { StepLayout } from "~/components/common/StepLayout";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { useTranslations } from 'next-intl';
import { Textarea } from "~/components/ui/textarea";
import { useErrorHandler } from "~/hooks/useErrorHandler";

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
  const { handleError } = useErrorHandler();

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
      
      await updateLetterMutation.mutateAsync({
        id: letterId,
        senderName,
        senderAddress,
        receiverName,
        receiverAddress,
      });
      
      return true; // Save successful
    } catch (error) {
      handleError(error, "Failed to save addresses");
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
        <Label 
          htmlFor="senderName" 
          className="mb-2 block text-sm font-medium text-gray-700"
        >
          {t('senderName')}
        </Label>
        <Input
          value={senderName}
          onChange={(e) => setSenderName(e.target.value)}
          placeholder="Enter your full name"
        />
        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium text-gray-700">
            {t('senderAddress')}
          </label>
          <Textarea
            value={senderAddress}
            onChange={(e) => setSenderAddress(e.target.value)}
            rows={3}
            placeholder="Enter your address"
          />
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-lg font-medium">{t('recipientSection')}</h3>
        <Label 
          htmlFor="senderName" 
          className="mb-2 block text-sm font-medium text-gray-700"
        >
          {t('recipientName')}
        </Label>
        <Input
          value={receiverName}
          onChange={(e) => setReceiverName(e.target.value)}
          placeholder="Enter recipient's name or organization"
        />
        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium text-gray-700">
            {t('recipientAddress')}
          </label>
          <Textarea
            value={receiverAddress}
            onChange={(e) => setReceiverAddress(e.target.value)}
            rows={3}
            placeholder="Enter recipient's address"
          />
        </div>
      </div>      
      <div className="mt-2 text-right text-sm">
        {isSaving && <span className="text-blue-500">{t('saving')}</span>}
      </div>
    </StepLayout>
  );
});

AddressesStep.displayName = "AddressesStep";

export default AddressesStep;
