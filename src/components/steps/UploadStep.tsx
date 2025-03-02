// src/components/steps/UploadStep.tsx
"use client";

import { useCallback, useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { useWizardStore } from "~/lib/store";
import { api } from "~/utils/api";
import { determineVisibleSteps } from "~/utils/wizard-helpers";
import { Input } from "~/components/ui/Input";
import { Button } from "~/components/ui/Button";
import { ErrorMessage } from "~/components/ui/ErrorMessage";
import { LoadingSpinner } from "~/components/ui/LoadingSpinner";
import Image from "next/image";
import { uploadImage } from '~/utils/supabase-storage';
import { useErrorHandler } from "~/hooks/useErrorHandler";

export default function UploadStep() {
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<string>("Cancel this credit card"); // Default prompt
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [hasChangedSinceLastAnalysis, setHasChangedSinceLastAnalysis] = useState(false);
  const { letterId, setLetterId, setCurrentStep, setVisibleSteps } = useWizardStore();
  const { error, handleError, clearError } = useErrorHandler();
  
  const createLetterMutation = api.letter.create.useMutation();
  const analyzeImageMutation = api.letter.analyzeImage.useMutation();
  const updateLetterMutation = api.letter.updateLetter.useMutation();
  
  // Fetch existing letter data when component mounts
  const letterQuery = api.letter.getLetter.useQuery(
    { id: letterId ?? "" },
    { enabled: !!letterId }
  );

  // Initialize state from existing letter when available
  useEffect(() => {
    if (letterQuery.data) {
      // Set the prompt from saved data if available
      if (letterQuery.data.userPrompt) {
        setPrompt(letterQuery.data.userPrompt);
      }
      
      // Set the image if available
      if (letterQuery.data.originalImage) {
        setUploadedImageUrl(letterQuery.data.originalImage);
        setPreview(letterQuery.data.originalImage);
      }
      
      // Reset change tracking
      setHasChangedSinceLastAnalysis(false);
    }
  }, [letterQuery.data]);

  // Track changes to prompt
  useEffect(() => {
    if (letterQuery.data?.userPrompt && prompt !== letterQuery.data.userPrompt) {
      setHasChangedSinceLastAnalysis(true);
    }
  }, [prompt, letterQuery.data?.userPrompt]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    
    try {
      setIsUploading(true);
      clearError();
      
      const file = acceptedFiles[0];
      
      if (file) {
        // Create preview for display
        const objectUrl = URL.createObjectURL(file);
        setPreview(objectUrl);
        
        // Mark as changed since a new image was uploaded
        setHasChangedSinceLastAnalysis(true);
        
        // Store uploaded URL for later use
        const reader = new FileReader();
        reader.onload = async () => {
          try {
            const dataUrl = reader.result as string;
            
            // Upload to Supabase and get public URL
            const imageUrl = await uploadImage(dataUrl);
            
            if (!imageUrl) {
              throw new Error('Failed to upload image to storage');
            }
            
            // Save the URL in state for later use
            setUploadedImageUrl(imageUrl);
            
            if (letterId) {
              // Update existing letter with new image and prompt
              await updateLetterMutation.mutateAsync({
                id: letterId,
                originalImage: imageUrl,
                userPrompt: prompt
              });
            } else {
              // Create a new letter with the Supabase URL
              const letter = await createLetterMutation.mutateAsync({
                originalImage: imageUrl,
                userPrompt: prompt
              });
              
              setLetterId(letter.id);
            }
            
            // Clean up the object URL
            URL.revokeObjectURL(objectUrl);
            setIsUploading(false);
          } catch (error) {
            handleError(error, "Error processing image");
            URL.revokeObjectURL(objectUrl);
          }
        };
        
        reader.onerror = () => {
          handleError(new Error("Error reading file"), "File reading error");
          URL.revokeObjectURL(objectUrl);
        };
        
        reader.readAsDataURL(file);
      } else {
        throw new Error("No valid file selected");
      }
    } catch (error) {
      handleError(error, "Error uploading image");
    }
  }, [createLetterMutation, updateLetterMutation, letterId, setLetterId, prompt, clearError, handleError]);

  const handlePromptChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPrompt(e.target.value);
    setHasChangedSinceLastAnalysis(true);
  };

  const handleNextStep = async () => {
    const currentLetterId = useWizardStore.getState().letterId;
    if (!currentLetterId) {
      handleError(new Error("Please upload an image first"), "Validation Error");
      return;
    }
    
    // Use the image URL from state or from the query result
    const imageUrl = uploadedImageUrl ?? letterQuery.data?.originalImage;
    
    if (!imageUrl) {
      handleError(new Error("Image URL not found"), "Validation Error");
      return;
    }
    
    try {
      // Save the prompt even if we don't re-analyze
      if (currentLetterId && prompt !== letterQuery.data?.userPrompt) {
        await updateLetterMutation.mutateAsync({
          id: currentLetterId,
          userPrompt: prompt,
        });
      }
      
      // Check if it's a new letter or if we're returning to a letter that has no content yet
      const needsInitialAnalysis = !letterQuery.data?.content || letterQuery.data.content === "";
      
      // Run analysis if the image or prompt changed, or if there's no content yet
      if (hasChangedSinceLastAnalysis || needsInitialAnalysis) {
        setIsAnalyzing(true);
        clearError();
        
        // Always make sure to analyze with the correct image URL
        const updatedLetter = await analyzeImageMutation.mutateAsync({
          letterId: currentLetterId,
          imageData: imageUrl,
          userPrompt: prompt,
        });
        
        // Update the visible steps based on the analyzed letter
        const steps = determineVisibleSteps(updatedLetter);
        setVisibleSteps(steps);
        
        // Reset change tracking after analysis
        setHasChangedSinceLastAnalysis(false);
        
        // Move to the next step
        const nextStep = steps[1] ?? "content";
        setCurrentStep(nextStep);
      } else {
        // Skip analysis and go to the next step without changing steps
        const steps = useWizardStore.getState().visibleSteps;
        const nextStep = steps[1] ?? "content";
        setCurrentStep(nextStep);
      }
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
          onChange={handlePromptChange}
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
      
      {hasChangedSinceLastAnalysis && (
        <p className="mb-4 text-sm text-amber-600">
          Changes detected. Analysis will run when you continue.
        </p>
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