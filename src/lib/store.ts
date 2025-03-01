// src/lib/store.ts
import { create } from "zustand";

export type WizardStep = "upload" | "content" | "addresses" | "signature" | "review";

interface WizardState {
  currentStep: WizardStep;
  visibleSteps: WizardStep[];
  letterId: string | null;
}

interface WizardActions {
  setCurrentStep: (step: WizardStep) => void;
  setVisibleSteps: (steps: WizardStep[]) => void;
  setLetterId: (id: string) => void;
  resetWizard: () => void;
  goToNextStep: () => void;
  goToPreviousStep: () => void;
}

export const useWizardStore = create<WizardState & WizardActions>((set, get) => ({
  currentStep: "upload",
  visibleSteps: ["upload", "content", "signature", "review"],
  letterId: null,
  
  setCurrentStep: (step) => set({ currentStep: step }),
  setVisibleSteps: (steps) => set({ visibleSteps: steps }),
  setLetterId: (id) => set({ letterId: id }),
  
  resetWizard: () => set({
    currentStep: "upload",
    visibleSteps: ["upload", "content", "signature", "review"],
    letterId: null,
  }),
  
  goToNextStep: () => {
    const { currentStep, visibleSteps } = get();
    const currentIndex = visibleSteps.indexOf(currentStep);
    if (currentIndex < visibleSteps.length - 1) {
      set({ currentStep: visibleSteps[currentIndex + 1] });
    }
  },
  
  goToPreviousStep: () => {
    const { currentStep, visibleSteps } = get();
    const currentIndex = visibleSteps.indexOf(currentStep);
    if (currentIndex > 0) {
      set({ currentStep: visibleSteps[currentIndex - 1] });
    }
  }
}));
