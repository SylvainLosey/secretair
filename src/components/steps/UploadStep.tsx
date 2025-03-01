"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useWizardStore } from "~/lib/store";
import { api } from "~/utils/api";
import { determineVisibleSteps } from "~/utils/wizard-helpers";
import { Input } from "~/components/ui/Input";
import { Button } from "~/components/ui/Button";
import { ErrorMessage } from "~/components/ui/ErrorMessage";
import { LoadingSpinner } from "~/components/ui/LoadingSpinner";
import Image from "next/image";

export default function UploadStep() {
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<string>("Cancel this credit card"); // Default prompt
  const { setLetterId, setCurrentStep, setVisibleSteps } = useWizardStore();
  
  const createLetterMutation = api.letter.create.useMutation();
  const analyzeImageMutation = api.letter.analyzeImage.useMutation();

  // Add a standardized error handler
  const handleError = (error: unknown, customMessage: string) => {
    console.error(`${customMessage}:`, error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    setError(`${customMessage}: ${errorMessage}`);
    setIsUploading(false);
    setIsAnalyzing(false);
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    
    setIsUploading(true);
    setError(null);
    const file = acceptedFiles[0];
    
    // Add this check to satisfy TypeScript
    if (!file) return;
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        setPreview(reader.result as string);
        
        // Create letter entry first with the user's prompt, but don't analyze yet
        const letter = await createLetterMutation.mutateAsync({
          originalImage: reader.result as string,
          userPrompt: prompt,
        });
        setLetterId(letter.id);
        setIsUploading(false);
      } catch (err) {
        handleError(err, "Failed to process image");
      }
    };
    reader.onerror = () => {
      handleError(new Error("Failed to read the image file"), "Failed to read the image file");
    };
    reader.readAsDataURL(file);
  }, [createLetterMutation, setLetterId, prompt]);

  const handleNextStep = async () => {
    const letterId = useWizardStore.getState().letterId;
    if (!letterId || !preview) {
      setError("Please upload an image first");
      return;
    }
    
    try {
      setIsAnalyzing(true);
      
      // Now perform the analysis with the prompt
      const updatedLetter = await analyzeImageMutation.mutateAsync({
        letterId: letterId,
        imageData: preview,
        userPrompt: prompt,
      });
      
      // Update the visible steps based on the analyzed letter
      const steps = determineVisibleSteps(updatedLetter);
      setVisibleSteps(steps);
      
      // Move to the next step
      const nextStep = steps[1] ?? "content";
      setCurrentStep(nextStep);
    } catch (err) {
      handleError(err, "Failed to analyze the letter");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (files) => { void onDrop(files); },
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'],
    },
    maxFiles: 1,
  });

  return (
    <div className="flex flex-col items-center">
      <h2 className="mb-4 text-center text-2xl font-bold text-gray-800">Upload Your Letter</h2>
      <p className="mb-8 text-center text-gray-600">
        Take a photo of the letter you received or want to respond to
      </p>
      
      <div className="mb-6 w-full">
        <Input
          label="What would you like to do with this letter?"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g., Cancel this credit card, Request a refund..."
        />
      </div>
      
      <div
        {...getRootProps()}
        className={`group relative mb-6 flex h-72 w-full cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed transition-all ${
          isDragActive 
            ? "border-blue-500 bg-blue-50" 
            : "border-gray-300 hover:border-blue-400 hover:bg-gray-50"
        }`}
      >
        <input {...getInputProps()} />
        
        {preview ? (
          <div className="relative h-full w-full">
            <Image
              src={preview}
              alt="Uploaded letter"
              fill
              className="h-full w-full object-contain"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 opacity-0 transition-opacity group-hover:opacity-100">
              <p className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-gray-700">
                Click or drop to replace
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center p-6">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-blue-500">
              <svg
                className="h-8 w-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </div>
            <p className="text-lg font-medium text-gray-700 mb-1">
              {isDragActive
                ? "Drop the image here"
                : "Drag and drop your letter image"}
            </p>
            <p className="text-sm text-gray-500">
              or click to browse files (JPG, PNG, GIF)
            </p>
          </div>
        )}
      </div>
      
      {isUploading && (
        <div className="mb-4">
          <LoadingSpinner size="md" message="Uploading your letter..." />
        </div>
      )}
      
      <ErrorMessage message={error} />
      
      {/* Next button that triggers analysis */}
      <Button 
        variant="primary"
        onClick={handleNextStep}
        disabled={!preview || isAnalyzing}
        isLoading={isAnalyzing}
        fullWidth
      >
        Continue
      </Button>
    </div>
  );
}
