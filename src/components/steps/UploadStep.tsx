"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useWizardStore } from "~/lib/store";
import { api } from "~/utils/api";
import { determineVisibleSteps } from "~/utils/wizard-helpers";

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
    <div className="text-center">
      <h2 className="mb-4 text-xl font-semibold">Upload Your Letter</h2>
      <p className="mb-6 text-gray-600">
        Take a photo of the letter you received or want to respond to
      </p>
      
      {/* Add prompt input field */}
      <div className="mb-6">
        <label htmlFor="letterPrompt" className="mb-1 block text-sm font-medium text-gray-700">
          What would you like to do with this letter?
        </label>
        <input
          id="letterPrompt"
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="E.g., Cancel this credit card"
          className="w-full rounded-md border border-gray-300 p-2 focus:border-blue-500 focus:ring-blue-500"
        />
      </div>
      
      <div
        {...getRootProps()}
        className={`mx-auto mb-4 flex h-64 w-full max-w-lg cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 ${
          isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-300"
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
          </div>
        ) : (
          <div className="text-center">
            <svg
              className="mx-auto mb-2 h-12 w-12 text-gray-400"
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
            <p className="text-gray-500">
              {isDragActive
                ? "Drop the image here"
                : "Drag and drop an image, or click to select"}
            </p>
          </div>
        )}
      </div>
      
      {isUploading && (
        <div className="mt-4 text-blue-600">
          Uploading your letter...
          <div className="mx-auto mt-2 h-1 w-24 animate-pulse rounded bg-blue-600"></div>
        </div>
      )}
      
      {error && (
        <div className="mt-4 text-red-600">
          {error}
        </div>
      )}
      
      {/* Next button that triggers analysis */}
      <div className="mt-6">
        <button
          onClick={handleNextStep}
          disabled={!preview || isAnalyzing}
          className={`rounded-md ${
            preview ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-300 cursor-not-allowed"
          } px-6 py-2 text-white disabled:opacity-50`}
        >
          {isAnalyzing ? (
            <>
              <span className="mr-2">Analyzing your letter...</span>
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
            </>
          ) : (
            "Next"
          )}
        </button>
      </div>
    </div>
  );
}
