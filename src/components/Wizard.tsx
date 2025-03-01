"use client";

import React, { useState } from "react";
import { useWizardStore } from "~/lib/store";
import UploadStep from "./steps/UploadStep";
import ContentStep from "./steps/ContentStep";
import AddressesStep from "./steps/AddressesStep";
import SignatureStep from "./steps/SignatureStep";
import ReviewStep from "./steps/ReviewStep";
import { Button } from "./ui/Button";

export function Wizard() {
  const { currentStep, visibleSteps, setCurrentStep } = useWizardStore();
  const [isNavigating, setIsNavigating] = useState(false);

  const renderStep = () => {
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

  const navigateStep = (direction: 'next' | 'previous') => {
    if (!currentStep || visibleSteps.length === 0) return;
    
    const currentIndex = visibleSteps.indexOf(currentStep);
    if (currentIndex === -1) return;
    
    const targetIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    
    if (targetIndex >= 0 && targetIndex < visibleSteps.length) {
      setIsNavigating(true);
      setCurrentStep(visibleSteps[targetIndex]!);
      setIsNavigating(false);
    }
  };

  const goToNextStep = () => navigateStep('next');
  const goToPreviousStep = () => navigateStep('previous');

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {/* Steps indicator - improved with better alignment and visual connection */}
      <div className="mb-10">
        <div className="relative flex items-center justify-between">
          {/* Progress bar under the steps */}
          <div className="absolute top-1/2 left-0 h-1 w-full -translate-y-1/2 bg-gray-200">
            <div 
              className="h-full bg-blue-600 transition-all duration-300" 
              style={{ 
                width: `${(visibleSteps.indexOf(currentStep) / (visibleSteps.length - 1)) * 100}%` 
              }}
            ></div>
          </div>
          
          {/* Steps */}
          {visibleSteps.map((step, index) => (
            <div key={step} className="relative z-10 flex flex-col items-center">
              <div 
                className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium transition-colors duration-300 ${
                  index <= visibleSteps.indexOf(currentStep)
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-white text-gray-500 border border-gray-300"
                }`}
              >
                {index + 1}
              </div>
              <span 
                className={`mt-2 text-center text-xs font-medium transition-colors duration-300 ${
                  index <= visibleSteps.indexOf(currentStep) ? "text-blue-600" : "text-gray-500"
                }`}
              >
                {step.charAt(0).toUpperCase() + step.slice(1)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Step content - improved card with better shadow and spacing */}
      <div className="mb-8 overflow-hidden rounded-xl border border-gray-100 bg-white p-8 shadow-lg">
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
