"use client";

// src/components/steps/AddressesStep.tsx (continued)
import { useEffect, useState } from "react";
import { useWizardStore } from "~/lib/store";
import { api } from "~/utils/api";
import { useAutoSave } from "~/hooks/useAutoSave";
import { StepLayout } from "~/components/ui/StepLayout";
import { Input } from "~/components/ui/Input";

export default function AddressesStep() {
  const { letterId } = useWizardStore();
  const [senderName, setSenderName] = useState("");
  const [senderAddress, setSenderAddress] = useState("");
  const [receiverName, setReceiverName] = useState("");
  const [receiverAddress, setReceiverAddress] = useState("");
  const [isLoading, setIsLoading] = useState(true);

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

  const saveAddresses = async () => {
    if (!letterId) return;
    
    await updateLetterMutation.mutateAsync({
      id: letterId,
      senderName,
      senderAddress,
      receiverName,
      receiverAddress,
    });
  };

  useAutoSave(
    { senderName, senderAddress, receiverName, receiverAddress },
    saveAddresses,
    [senderName, senderAddress, receiverName, receiverAddress, letterId],
    1000,
    isLoading
  );

  return (
    <StepLayout
      title="Sender & Recipient Details"
      description="Please confirm or update the sender and recipient information for your letter."
      isLoading={isLoading}
      loadingMessage="Loading address information..."
    >
      <div className="mb-6">
        <h3 className="mb-3 text-lg font-medium">Sender (You)</h3>
        <Input
          label="Your Name"
          value={senderName}
          onChange={(e) => setSenderName(e.target.value)}
          placeholder="Enter your full name"
        />
        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Your Address
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
        <h3 className="mb-3 text-lg font-medium">Recipient</h3>
        <Input
          label="Recipient Name"
          value={receiverName}
          onChange={(e) => setReceiverName(e.target.value)}
          placeholder="Enter recipient's name or organization"
        />
        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Recipient Address
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

      <div className="mt-2 text-right text-sm text-gray-500">
        {updateLetterMutation.isPending ? "Saving..." : "Changes auto-saved"}
      </div>
    </StepLayout>
  );
}
