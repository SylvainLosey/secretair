import { create } from "zustand";

export type WizardStep = "upload" | "content" | "addresses" | "signature" | "review";

// Define a constant array with the fixed step order
export const ALL_STEPS: WizardStep[] = ["upload", "content", "addresses", "signature", "review"];

interface WizardState {
  currentStep: WizardStep;
  letterId: string | null;
}

interface WizardActions {
  setCurrentStep: (step: WizardStep) => void;
  setLetterId: (id: string) => void;
  resetWizard: () => void;
  goToNextStep: () => boolean;
  goToPreviousStep: () => boolean;
}

export const useWizardStore = create<WizardState & WizardActions>((set, get) => ({
  currentStep: "upload",
  letterId: null,
  
  setCurrentStep: (step) => set({ currentStep: step }),
  setLetterId: (id) => set({ letterId: id }),
  
  resetWizard: () => set({
    currentStep: "upload",
    letterId: null,
  }),
  
  goToNextStep: () => {
    const { currentStep } = get();
    const currentIndex = ALL_STEPS.indexOf(currentStep);
    if (currentIndex < ALL_STEPS.length - 1) {
      set({ currentStep: ALL_STEPS[currentIndex + 1] });
      return true;
    }
    return false;
  },
  
  goToPreviousStep: () => {
    const { currentStep } = get();
    const currentIndex = ALL_STEPS.indexOf(currentStep);
    if (currentIndex > 0) {
      set({ currentStep: ALL_STEPS[currentIndex - 1] });
      return true;
    }
    return false;
  }
}));
