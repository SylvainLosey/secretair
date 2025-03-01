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

  const currentIndex = visibleSteps.indexOf(currentStep);
  const isFirstStep = currentIndex === 0;
  const isLastStep = currentIndex === visibleSteps.length - 1;

  const goToNextStep = () => {
    const nextStep = visibleSteps[currentIndex + 1];
    if (nextStep) {
      setIsNavigating(true);
      setCurrentStep(nextStep);
      setIsNavigating(false);
    }
  };

  const goToPreviousStep = () => {
    const prevStep = visibleSteps[currentIndex - 1];
    if (prevStep) {
      setIsNavigating(true);
      setCurrentStep(prevStep);
      setIsNavigating(false);
    }
  };

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
                width: `${(currentIndex / (visibleSteps.length - 1)) * 100}%` 
              }}
            ></div>
          </div>
          
          {/* Steps */}
          {visibleSteps.map((step, index) => (
            <div key={step} className="relative z-10 flex flex-col items-center">
              <div 
                className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium transition-colors duration-300 ${
                  index <= currentIndex
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-white text-gray-500 border border-gray-300"
                }`}
              >
                {index + 1}
              </div>
              <span 
                className={`mt-2 text-center text-xs font-medium transition-colors duration-300 ${
                  index <= currentIndex ? "text-blue-600" : "text-gray-500"
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
            disabled={isFirstStep || isNavigating}
            className={isFirstStep ? "invisible" : ""}
          >
            Back
          </Button>
          
          <Button
            variant="primary"
            onClick={goToNextStep}
            disabled={isLastStep || isNavigating}
            className={isLastStep ? "invisible" : ""}
            isLoading={isNavigating}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
