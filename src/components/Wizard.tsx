"use client";

import React, { useState } from "react";
import { useWizardStore } from "~/lib/store";
import UploadStep from "./steps/UploadStep";
import ContentStep from "./steps/ContentStep";
import AddressesStep from "./steps/AddressesStep";
import SignatureStep from "./steps/SignatureStep";
import ReviewStep from "./steps/ReviewStep";

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
    <div className="mx-auto max-w-3xl">
      {/* Steps indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {visibleSteps.map((step, index) => (
            <React.Fragment key={step}>
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full ${
                    index <= currentIndex ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {index + 1}
                </div>
                <span
                  className={`mt-2 text-sm ${
                    index <= currentIndex ? "text-blue-600" : "text-gray-400"
                  }`}
                >
                  {step.charAt(0).toUpperCase() + step.slice(1)}
                </span>
              </div>
              
              {index < visibleSteps.length - 1 && (
                <div
                  className={`h-1 w-16 ${
                    index < currentIndex ? "bg-blue-600" : "bg-gray-200"
                  }`}
                ></div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Step content */}
      <div className="mb-8 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        {renderStep()}
      </div>

      {/* Navigation buttons */}
      {currentStep !== "upload" && ( // Skip showing buttons on Upload step since it has its own
        <div className="flex justify-between">
          <button
            onClick={goToPreviousStep}
            disabled={isFirstStep || isNavigating}
            className={`rounded-md px-4 py-2 ${
              isFirstStep
                ? "invisible"
                : "bg-gray-200 text-gray-800 hover:bg-gray-300"
            } disabled:opacity-50`}
          >
            Back
          </button>
          
          <button
            onClick={goToNextStep}
            disabled={isLastStep || isNavigating}
            className={`rounded-md px-4 py-2 ${
              isLastStep
                ? "invisible"
                : "bg-blue-600 text-white hover:bg-blue-700"
            } disabled:opacity-50`}
          >
            {isNavigating ? (
              <>
                <span className="mr-2">Loading...</span>
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
              </>
            ) : (
              "Next"
            )}
          </button>
        </div>
      )}
    </div>
  );
}
