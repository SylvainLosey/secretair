// src/utils/wizard-helpers.ts
import { type WizardStep } from "~/lib/store";
import { type RouterOutputs } from "~/utils/api";

type Letter = RouterOutputs["letter"]["getLetter"];

export function determineVisibleSteps(letter: Letter): WizardStep[] {
  // Always include upload and review steps
  const steps: WizardStep[] = ["upload", "review"];
  
  // Content step is always needed
  steps.splice(1, 0, "content");
  
  // If sender or receiver info is missing or incomplete, add addresses step
  const needsAddressStep = !letter.senderName || 
                          !letter.senderAddress || 
                          !letter.receiverName || 
                          !letter.receiverAddress ||
                          letter.senderAddress.trim() === "" ||
                          letter.receiverAddress.trim() === "";
  
  if (needsAddressStep) {
    steps.splice(2, 0, "addresses");
  }
  
  // Always include signature step before review
  steps.splice(steps.length - 1, 0, "signature");
  
  return steps;
}
