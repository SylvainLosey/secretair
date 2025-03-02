"use client";

import React, { useState, useEffect, useRef } from "react";
import { useWizardStore } from "~/lib/store";
import UploadStep from "./steps/UploadStep";
import ContentStep, { type ContentStepRef } from "./steps/ContentStep";
import AddressesStep, { type AddressesStepRef } from "./steps/AddressesStep";
import SignatureStep, { type SignatureStepRef } from "./steps/SignatureStep";
import ReviewStep from "./steps/ReviewStep";
import { Button } from "./ui/Button";
import { LoadingSpinner } from "./ui/LoadingSpinner";
import { ALL_STEPS } from "~/lib/store";

export function Wizard() {
  const { currentStep, goToNextStep, goToPreviousStep } = useWizardStore();
  const [isNavigating, setIsNavigating] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Create refs to access step component methods
  const contentStepRef = useRef<ContentStepRef>(null);
  const addressesStepRef = useRef<AddressesStepRef>(null);
  const signatureStepRef = useRef<SignatureStepRef>(null);

  const handleNextStep = async () => {
    setIsNavigating(true);
    
    // Get the current step's save function
    let canProceed = true;
    
    try {
      // Call the appropriate step's save function based on the current step
      if (currentStep === "content" && contentStepRef.current) {
        canProceed = await contentStepRef.current.saveData();
      } else if (currentStep === "addresses" && addressesStepRef.current) {
        canProceed = await addressesStepRef.current.saveData();
      } else if (currentStep === "signature" && signatureStepRef.current) {
        canProceed = await signatureStepRef.current.saveData();
      }
      
      if (canProceed) {
        goToNextStep();
      }
    } catch (error) {
      console.error("Error saving data:", error);
    } finally {
      setIsNavigating(false);
    }
  };

  const renderStepIndicator = () => {
    const steps = [
      { id: "upload", label: "Upload" },
      { id: "content", label: "Content" },
      { id: "addresses", label: "Addresses" },
      { id: "signature", label: "Signature" },
      { id: "review", label: "Review" },
    ];

    return (
      <div className="mb-8">
        <div className="flex justify-between">
          {steps.map((step, index) => {
            const isActive = currentStep === step.id;
            const isPast = ALL_STEPS.indexOf(step.id) < ALL_STEPS.indexOf(currentStep);
            
            return (
              <div key={step.id} className="flex flex-col items-center">
                <div 
                  className={`
                    flex h-8 w-8 items-center justify-center rounded-full 
                    ${isActive ? "bg-blue-600 text-white" : 
                      isPast ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-400"}
                  `}
                >
                  {index + 1}
                </div>
                <span className={`mt-2 text-xs ${isActive ? "font-medium text-blue-600" : 
                  isPast ? "text-blue-600" : "text-gray-400"}`}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
        <div className="relative mt-2">
          <div className="absolute top-0 h-1 w-full bg-gray-200"></div>
          <div 
            className="absolute top-0 h-1 bg-blue-600 transition-all duration-300"
            style={{ 
              width: `${(ALL_STEPS.indexOf(currentStep) / (ALL_STEPS.length - 1)) * 100}%`
            }}
          ></div>
        </div>
      </div>
    );
  };

  const renderStep = () => {
    if (isTransitioning) {
      return (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" message="Loading next step..." />
        </div>
      );
    }

    switch (currentStep) {
      case "upload":
        return <UploadStep />;
      case "content":
        return <ContentStep ref={contentStepRef} />;
      case "addresses":
        return <AddressesStep ref={addressesStepRef} />;
      case "signature":
        return <SignatureStep ref={signatureStepRef} />;
      case "review":
        return <ReviewStep />;
      default:
        return <UploadStep />;
    }
  };

  useEffect(() => {
    // Subscribe to the entire store state
    const unsubscribe = useWizardStore.subscribe((state, prevState) => {
      // Check if the currentStep changed
      if (state.currentStep !== prevState.currentStep) {
        setIsTransitioning(true);
        setTimeout(() => setIsTransitioning(false), 300);
      }
    });
    
    return unsubscribe;
  }, []);

  return (
    <div className="mx-auto max-w-3xl rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      {renderStepIndicator()}
      
      <div className="mb-6">
        {renderStep()}
      </div>
      
      {currentStep !== "upload" && (
        <div className="mt-6 flex justify-between">
          <Button
            variant="outline"
            onClick={goToPreviousStep}
            disabled={isNavigating}
          >
            Back
          </Button>
          
          {currentStep !== "review" && (
            <Button
              variant="primary"
              onClick={handleNextStep}
              disabled={isNavigating}
              isLoading={isNavigating}
            >
              {isNavigating ? "Saving..." : "Next"}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
