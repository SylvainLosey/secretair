"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useWizardStore } from "~/lib/store";
import { api } from "~/utils/api";
import { determineVisibleSteps } from "~/utils/wizard-helpers";
import { Input } from "~/components/ui/Input";
import { Button } from "~/components/ui/Button";

export default function UploadStep() {
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<string>("Cancel this credit card"); // Default prompt
  const { setLetterId, setCurrentStep, setVisibleSteps } = useWizardStore();
  
  const createLetterMutation = api.letter.create.useMutation();
  const analyzeImageMutation = api.letter.analyzeImage.useMutation();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    
    setIsUploading(true);
    setError(null);
    const file = acceptedFiles[0];
    
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
        console.error("Error processing image:", err);
        setError("Failed to process image. Please try again.");
        setIsUploading(false);
      }
    };
    reader.onerror = () => {
      setError("Failed to read the image file.");
      setIsUploading(false);
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
      const nextStep = steps[1] || "content";
      setCurrentStep(nextStep);
    } catch (err) {
      console.error("Error analyzing image:", err);
      setError("Failed to analyze the letter. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
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
            <img
              src={preview}
              alt="Uploaded letter"
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
        <div className="mb-4 flex items-center text-blue-600">
          <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Uploading your letter...
        </div>
      )}
      
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-red-600">
          <div className="flex">
            <svg className="mr-2 h-5 w-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path>
            </svg>
            {error}
          </div>
        </div>
      )}
      
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
