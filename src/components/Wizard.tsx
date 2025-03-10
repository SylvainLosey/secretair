"use client";

import React, { useState, useEffect, useRef } from "react";
import { useWizardStore } from "~/lib/store";
import UploadStep from "./common/steps/UploadStep";
import ContentStep, { type ContentStepRef } from "./common/steps/ContentStep";
import AddressesStep, { type AddressesStepRef } from "./common/steps/AddressesStep";
import SignatureStep, { type SignatureStepRef } from "./common/steps/SignatureStep";
import ReviewStep from "./common/steps/ReviewStep";
import { Button } from "~/components/ui/button";
import { LoadingSpinner } from "./common/LoadingSpinner";
import { ALL_STEPS } from "~/lib/store";
import { useTranslations } from 'next-intl';

export function Wizard() {
  const { currentStep, goToNextStep, goToPreviousStep } = useWizardStore();
  const [isNavigating, setIsNavigating] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const t = useTranslations('wizard');

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
      { id: ALL_STEPS[0], label: t('steps.upload') },
      { id: ALL_STEPS[1], label: t('steps.content') },
      { id: ALL_STEPS[2], label: t('steps.addresses') },
      { id: ALL_STEPS[3], label: t('steps.signature') },
      { id: ALL_STEPS[4], label: t('steps.review') },
    ];

    return (
      <div className="mb-12 px-4">
        <div className="flex justify-between">
          {steps.map((step, index) => {
            const isActive = currentStep === step.id;
            const isPast = ALL_STEPS.indexOf(step.id!) < ALL_STEPS.indexOf(currentStep);
            
            return (
              <div key={step.id} className="flex flex-col items-center">
                <div 
                  className={`
                    flex h-10 w-10 items-center justify-center rounded-full 
                    ${isActive ? "bg-blue-600 text-white" : 
                      isPast ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-400"}
                  `}
                >
                  {index + 1}
                </div>
                <span className={`mt-3 text-sm ${isActive ? "font-medium text-blue-600" : 
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
          <LoadingSpinner size="lg" message={t('loading')} />
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
    <div className="mx-auto max-w-3xl rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
      {renderStepIndicator()}
      
      <div className="px-2">
          {renderStep()}
        
        {currentStep !== "upload" && (
          <div className="mt-6 flex justify-between">
            <Button
              variant="outline"
              onClick={goToPreviousStep}
              disabled={isNavigating}
            >
              {t('buttons.back')}
            </Button>
            
            {currentStep !== "review" && (
              <Button
                onClick={handleNextStep}
                disabled={isNavigating}
                className={isNavigating ? "opacity-70" : ""}
              >
                {isNavigating ? (
                  <>
                    <span className="mr-2 size-4 animate-spin">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                      </svg>
                    </span>
                    {t('buttons.saving')}
                  </>
                ) : (
                  t('buttons.next')
                )}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
