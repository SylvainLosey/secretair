"use client";

import React, { useState, useEffect } from "react";
import { useWizardStore } from "~/lib/store";
import UploadStep from "./steps/UploadStep";
import ContentStep from "./steps/ContentStep";
import AddressesStep from "./steps/AddressesStep";
import SignatureStep from "./steps/SignatureStep";
import ReviewStep from "./steps/ReviewStep";
import { Button } from "./ui/Button";
import { LoadingSpinner } from "./ui/LoadingSpinner";

export function Wizard() {
  const { currentStep, visibleSteps, goToNextStep, goToPreviousStep } = useWizardStore();
  const [isNavigating, ] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

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
        return <ContentStep />;
      case "addresses":
        return <AddressesStep />;
      case "signature":
        return <SignatureStep />;
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
    <div className="mx-auto max-w-3xl px-4 py-8">
      {/* Steps indicator with proper alignment */}
      <div className="mb-10">
        <div className="relative">
          {/* Progress bar under the steps */}
          <div className="absolute top-5 left-0 h-1 w-full bg-gray-200">
            <div 
              className="h-full bg-navy-600 transition-all duration-300" 
              style={{ 
                width: `${(visibleSteps.indexOf(currentStep) / (visibleSteps.length - 1)) * 100}%` 
              }}
            ></div>
          </div>
          
          {/* Steps */}
          <div className="relative flex justify-between">
            {visibleSteps.map((step, index) => (
              <div key={step} className="flex flex-col items-center">
                <div 
                  className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium transition-colors duration-300 ${
                    index <= visibleSteps.indexOf(currentStep)
                      ? "bg-navy-700 text-mint-100 shadow-sm"
                      : "bg-white text-gray-500 border border-gray-300"
                  }`}
                >
                  {index + 1}
                </div>
                <span 
                  className={`mt-2 text-center text-xs font-medium transition-colors duration-300 ${
                    index <= visibleSteps.indexOf(currentStep) ? "text-navy-800" : "text-gray-500"
                  }`}
                >
                  {step.charAt(0).toUpperCase() + step.slice(1)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Step content - improved card with better shadow and spacing */}
      <div className="mb-8 overflow-hidden rounded-xl border border-gray-200 bg-white p-6 md:p-8 shadow-md">
        {renderStep()}
      </div>

      {/* Navigation buttons - using our new Button component */}
      {currentStep !== "upload" && (
        <div className="flex justify-between">
          <Button
            variant="secondary"
            onClick={goToPreviousStep}
            disabled={visibleSteps.indexOf(currentStep) === 0 || isNavigating}
            className={visibleSteps.indexOf(currentStep) === 0 ? "invisible" : ""}
          >
            Back
          </Button>
          
          <Button
            variant="primary"
            onClick={goToNextStep}
            disabled={visibleSteps.indexOf(currentStep) === visibleSteps.length - 1 || isNavigating}
            className={visibleSteps.indexOf(currentStep) === visibleSteps.length - 1 ? "invisible" : ""}
            isLoading={isNavigating}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
