"use client";

// src/components/steps/AddressesStep.tsx (continued)
import { useEffect, useState } from "react";
import { useWizardStore } from "~/lib/store";
import { api } from "~/utils/api";

export default function AddressesStep() {
  const { letterId } = useWizardStore();
  const [senderName, setSenderName] = useState("");
  const [senderAddress, setSenderAddress] = useState("");
  const [receiverName, setReceiverName] = useState("");
  const [receiverAddress, setReceiverAddress] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

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
    
    setIsSaving(true);
    await updateLetterMutation.mutateAsync({
      id: letterId,
      senderName,
      senderAddress,
      receiverName,
      receiverAddress,
    });
    setIsSaving(false);
  };

  // Auto-save when fields change
  useEffect(() => {
    const timer = setTimeout(() => {
      if (letterId && !isLoading) {
        saveAddresses();
      }
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [senderName, senderAddress, receiverName, receiverAddress, letterId, isLoading]);

  const handleSwapAddresses = () => {
    // Swap the sender and receiver information
    const tempName = senderName;
    const tempAddress = senderAddress;
    
    setSenderName(receiverName);
    setSenderAddress(receiverAddress);
    setReceiverName(tempName);
    setReceiverAddress(tempAddress);
  };

  if (isLoading) {
    return <div className="text-center">Loading address information...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Sender & Receiver Information</h2>
        <button
          onClick={handleSwapAddresses}
          className="flex items-center px-3 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200"
          type="button"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
          </svg>
          Swap Addresses
        </button>
      </div>
      
      <p className="mb-6 text-gray-600">
        Verify or edit the sender and receiver information for your letter
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
        <div>
          <h3 className="text-md font-medium mb-2">From (Sender)</h3>
          <div className="space-y-4">
            <div>
              <label htmlFor="senderName" className="block text-sm font-medium text-gray-700 mb-1">
                Sender Name
              </label>
              <input
                id="senderName"
                type="text"
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                className="w-full rounded-md border border-gray-300 p-2 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label htmlFor="senderAddress" className="block text-sm font-medium text-gray-700 mb-1">
                Sender Address
              </label>
              <textarea
                id="senderAddress"
                value={senderAddress}
                onChange={(e) => setSenderAddress(e.target.value)}
                rows={4}
                className="w-full rounded-md border border-gray-300 p-2 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
        
        <div>
          <h3 className="text-md font-medium mb-2">To (Receiver)</h3>
          <div className="space-y-4">
            <div>
              <label htmlFor="receiverName" className="block text-sm font-medium text-gray-700 mb-1">
                Receiver Name
              </label>
              <input
                id="receiverName"
                type="text"
                value={receiverName}
                onChange={(e) => setReceiverName(e.target.value)}
                className="w-full rounded-md border border-gray-300 p-2 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label htmlFor="receiverAddress" className="block text-sm font-medium text-gray-700 mb-1">
                Receiver Address
              </label>
              <textarea
                id="receiverAddress"
                value={receiverAddress}
                onChange={(e) => setReceiverAddress(e.target.value)}
                rows={4}
                className="w-full rounded-md border border-gray-300 p-2 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-2 text-right text-sm text-gray-500">
        {isSaving ? "Saving..." : "Changes auto-saved"}
      </div>
    </div>
  );
}
