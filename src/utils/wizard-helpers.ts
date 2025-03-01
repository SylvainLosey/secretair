// src/utils/wizard-helpers.ts
import { type WizardStep } from "~/lib/store";
import { type RouterOutputs } from "~/utils/api";

type Letter = RouterOutputs["letter"]["getLetter"];

export function determineVisibleSteps(letter: Letter): WizardStep[] {
  // Base steps that are always shown
  const steps: WizardStep[] = ["upload", "content", "signature", "review"];
  
  // Only add addresses step if any address field is missing or empty
  if (!letter.senderName?.trim() || 
      !letter.senderAddress?.trim() || 
      !letter.receiverName?.trim() || 
      !letter.receiverAddress?.trim()) {
    steps.splice(2, 0, "addresses");
  }
  
  return steps;
}
