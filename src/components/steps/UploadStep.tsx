// src/components/steps/UploadStep.tsx
"use client";

import { useCallback, useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { useWizardStore } from "~/lib/store";
import { api } from "~/utils/api";
import { Input } from "~/components/ui/Input";
import { Button } from "~/components/ui/Button";
import { ErrorMessage } from "~/components/ui/ErrorMessage";
import { LoadingSpinner } from "~/components/ui/LoadingSpinner";
import Image from "next/image";
import { uploadImage } from '~/utils/supabase-storage';
import { useErrorHandler } from "~/hooks/useErrorHandler";

// Define preset templates
interface PresetTemplate {
  id: string;
  title: string;
  description: string;
  prompt: string;
  requiresImage: boolean;
  icon: JSX.Element;
}

const presetTemplates: PresetTemplate[] = [
  {
    id: "cancel",
    title: "Cancel a Service",
    description: "Write a letter to cancel a subscription, membership, or service",
    prompt: "I need to cancel my subscription/service. Please write a formal cancellation letter that includes all necessary details to process this request.",
    requiresImage: true,
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
  },
  {
    id: "scratch",
    title: "Write from Scratch",
    description: "Create a new letter without responding to an existing document",
    prompt: "Please write a formal letter about the following topic: ",
    requiresImage: false,
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
  },
];

export default function UploadStep() {
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<string>("");
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [hasChangedSinceLastAnalysis, setHasChangedSinceLastAnalysis] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<PresetTemplate | null>(null);
  const { letterId, setLetterId, goToNextStep} = useWizardStore();
  const { error, handleError, clearError } = useErrorHandler();
  
  const createLetterMutation = api.letter.create.useMutation();
  const generateLetterMutation = api.letter.generateLetter.useMutation();
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
      if (letterQuery.data.imageUrl) {
        setUploadedImageUrl(letterQuery.data.imageUrl);
        setPreview(letterQuery.data.imageUrl);
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
                imageUrl: imageUrl,
                userPrompt: prompt
              });
            } else {
              // Create a new letter with the Supabase URL
              const letter = await createLetterMutation.mutateAsync({
                imageUrl: imageUrl,
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

  const handleSelectTemplate = (template: PresetTemplate) => {
    setSelectedTemplate(template);
    setPrompt(template.prompt);
    setHasChangedSinceLastAnalysis(true);
    
    // Clear image preview if template doesn't require an image
    if (!template.requiresImage) {
      setPreview(null);
      setUploadedImageUrl(null);
    }
  };

  const handlePromptChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPrompt(e.target.value);
    setHasChangedSinceLastAnalysis(true);
  };

  const handleNextStep = async () => {
    try {
      clearError();
      
      // For templates without an image requirement
      if (selectedTemplate && !selectedTemplate.requiresImage) {
        let currentLetterId = letterId;
        
        // Create letter if it doesn't exist yet
        if (!currentLetterId) {
          try {
            const letter = await createLetterMutation.mutateAsync({
              userPrompt: prompt
            });
            
            currentLetterId = letter.id;
            setLetterId(letter.id);
          } catch (err) {
            handleError(err, "Failed to create letter");
            return;
          }
        }
        
        // Now use the definite letter ID (either existing or newly created)
        // If there are changes or no content yet, analyze using just the prompt
        const needsInitialAnalysis = !letterQuery.data?.content || letterQuery.data.content === "";
        if (hasChangedSinceLastAnalysis || needsInitialAnalysis) {
          setIsAnalyzing(true);
          
          try {
            // Make sure to use the correct ID and wait for the mutation to complete
            await generateLetterMutation.mutateAsync({
              letterId: currentLetterId,
              userPrompt: prompt
            });
            
            // Reset change tracking
            setHasChangedSinceLastAnalysis(false);
            
            goToNextStep();
          } catch (err) {
            handleError(err, "Failed to generate letter content");
          } finally {
            setIsAnalyzing(false);
          }
        } else {
          goToNextStep()
        }
        return;
      }
      
      // For templates that require an image
      const currentLetterId = letterId;
      const imageUrl = uploadedImageUrl;
      
      if (!currentLetterId && !preview) {
        handleError(new Error("Please upload an image first"), "Validation Error");
        return;
      }
      
      if (!imageUrl && !preview) {
        // No image available, prompt user to upload one
        handleError(new Error("Please upload an image first"), "Validation Error");
        return;
      }
      
      // If image exists, proceed with the remaining flow
      // Check if it's a new letter or if we're returning to a letter that has no content yet
      const needsInitialAnalysis = !letterQuery.data?.content || letterQuery.data.content === "";
      
      // Run analysis if the image or prompt changed, or if there's no content yet
      if ((hasChangedSinceLastAnalysis || needsInitialAnalysis) && imageUrl) {
        setIsAnalyzing(true);
        
        try {
          // Always make sure to analyze with the correct image URL
          await generateLetterMutation.mutateAsync({
            letterId: currentLetterId ?? "",
            userPrompt: prompt,
          });
          // Reset change tracking after analysis
          setHasChangedSinceLastAnalysis(false);

          goToNextStep();
        } catch (err) {
          handleError(err, "Failed to analyze the letter");
        } finally {
          setIsAnalyzing(false);
        }
      } else {
        // Skip analysis and go to the next step without changing steps
        goToNextStep();
      }
    } catch (err) {
      handleError(err, "Failed to analyze the letter");
      setIsAnalyzing(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (files) => { void onDrop(files); },
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'],
    },
    maxFiles: 1,
    // Disable dropzone if "Write from Scratch" is selected
    disabled: selectedTemplate?.id === "scratch" && !selectedTemplate.requiresImage
  });

  return (
    <div className="flex flex-col items-center">
      <h2 className="mb-4 text-center text-2xl font-bold text-gray-800">Get Started</h2>
      <p className="mb-8 text-center text-gray-600">
        Choose what you would like to do
      </p>
      
      {/* Template selection grid */}
      <div className="mb-8 grid w-full grid-cols-1 gap-4 md:grid-cols-2">
        {presetTemplates.map((template) => (
          <div
            key={template.id}
            onClick={() => handleSelectTemplate(template)}
            className={`flex cursor-pointer flex-col rounded-lg border-2 p-4 transition-all hover:shadow-md ${
              selectedTemplate?.id === template.id
                ? "border-blue-500 bg-blue-50"
                : "border-gray-200 bg-white"
            }`}
          >
            <div className="flex items-start">
              <div className={`mr-3 rounded-full p-2 ${
                selectedTemplate?.id === template.id
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 text-gray-700"
              }`}>
                {template.icon}
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-800">{template.title}</h3>
                <p className="text-sm text-gray-600">{template.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {selectedTemplate && (
        <>
          <div className="mb-6 w-full">
            <Input
              label="What would you like to accomplish?"
              value={prompt}
              onChange={handlePromptChange}
              placeholder={selectedTemplate.prompt}
            />
          </div>
          
          {selectedTemplate.requiresImage ? (
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
          ) : (
            <div className="mb-6 rounded-lg border border-gray-200 bg-gray-50 p-4 text-center">
              <p className="text-gray-600">No image needed for this template. Just click continue to start writing.</p>
            </div>
          )}
          
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
            disabled={
              (selectedTemplate.requiresImage && !preview) || 
              isAnalyzing ||
              !prompt.trim()
            }
            isLoading={isAnalyzing}
            fullWidth
          >
            Continue
          </Button>
        </>
      )}
    </div>
  );
}