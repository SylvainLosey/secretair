// src/utils/wizard-helpers.ts
import { type WizardStep } from "~/lib/store";
import { type RouterOutputs } from "~/utils/api";

type Letter = RouterOutputs["letter"]["getLetter"];

export function determineVisibleSteps(letter: Letter | null): WizardStep[] {
  // Base steps that are always shown
  const steps: WizardStep[] = ["upload", "content", "signature", "review"];
  
  // Check if we need to collect addresses
  if (!letter || 
      !hasCompleteAddresses(letter)) {
    steps.splice(2, 0, "addresses");
  }
  
  return steps;
}

// Extract the address validation to a separate function for clarity and reuse
function hasCompleteAddresses(letter: Letter | null): boolean {
  if (!letter) return false;
  
  return !!(
    letter.senderName?.trim() && 
    letter.senderAddress?.trim() && 
    letter.receiverName?.trim() && 
    letter.receiverAddress?.trim()
  );
}
