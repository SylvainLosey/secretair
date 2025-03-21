// src/components/steps/UploadStep.tsx
"use client";

import { useCallback, useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { useWizardStore } from "~/lib/store";
import { api } from "~/utils/api";
import { Button } from "~/components/ui/button";
import Image from "next/image";
import { uploadImage } from '~/utils/supabase-storage';
import { useErrorHandler } from "~/hooks/useErrorHandler";
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import { Textarea } from "~/components/ui/textarea";

// Define preset templates
interface PresetTemplate {
  id: string;
  title: string;
  description: string;
  prompt: string;
  requiresImage: boolean;
  icon: JSX.Element;
}

export default function UploadStep() {
  const t = useTranslations('uploadStep');
  const locale = useLocale();
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<string>("");
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [hasChangedSinceLastAnalysis, setHasChangedSinceLastAnalysis] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<PresetTemplate | null>(null);
  const { letterId, setLetterId, goToNextStep} = useWizardStore();
  const { handleError, captureMessage } = useErrorHandler();
  
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
          captureMessage("Error reading file")
          URL.revokeObjectURL(objectUrl);
        };
        
        reader.readAsDataURL(file);
      } else {
        throw new Error("No valid file selected");
      }
    } catch (error) {
      handleError(error, "Error uploading image");
    }
  }, [createLetterMutation, updateLetterMutation, letterId, setLetterId, prompt, handleError, captureMessage]);

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

  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(e.target.value);
    setHasChangedSinceLastAnalysis(true);
  };

  const handleNextStep = async () => {
    try {      
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
              userPrompt: prompt,
              language: locale
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
        captureMessage("Please upload an image first");
        return;
      }
      
      if (!imageUrl && !preview) {
        // No image available, prompt user to upload one
        captureMessage("Please upload an image first");
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
            language: locale
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
    disabled: selectedTemplate?.id === "scratch" && !selectedTemplate.requiresImage
  });

  // Use translations for the preset templates
  const presetTemplates: PresetTemplate[] = [
    {
      id: "cancel",
      title: t('templates.cancel.title'),
      description: t('templates.cancel.description'),
      prompt: t('templates.cancel.prompt'),
      requiresImage: true,
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      ),
    },
    {
      id: "scratch",
      title: t('templates.scratch.title'),
      description: t('templates.scratch.description'),
      prompt: t('templates.scratch.prompt'),
      requiresImage: false,
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="flex flex-col items-center">
      <h2 className="mb-4 text-center text-2xl font-bold text-gray-800">
        {t('promptLabel')}
      </h2>
      <p className="mb-8 text-center text-gray-600">
        {t('promptDescription')}
      </p>
      
      {/* Template selection grid */}
      <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-2">
        <div 
          className={`p-4 border rounded-lg cursor-pointer ${selectedTemplate?.id === 'cancel' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}
          onClick={() => handleSelectTemplate(presetTemplates[0]!)}
        >
          <div className="flex items-center mb-2">
            <div className={`mr-3 p-2 rounded-full ${
              selectedTemplate?.id === 'cancel' 
                ? 'bg-blue-500 text-white' 
                : 'bg-blue-100 text-blue-600'
            }`}>
              {presetTemplates[0]?.icon}
            </div>
            <h3 className="font-medium text-lg">{t('templates.cancel.title')}</h3>
          </div>
          <p className="text-gray-600 mt-1">{t('templates.cancel.description')}</p>
        </div>
        
        <div 
          className={`p-4 border rounded-lg cursor-pointer ${selectedTemplate?.id === 'scratch' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}
          onClick={() => handleSelectTemplate(presetTemplates[1]!)}
        >
          <div className="flex items-center mb-2">
            <div className={`mr-3 p-2 rounded-full ${
              selectedTemplate?.id === 'scratch' 
                ? 'bg-blue-500 text-white' 
                : 'bg-blue-100 text-blue-600'
            }`}>
              {presetTemplates[1]?.icon}
            </div>
            <h3 className="font-medium text-lg">{t('templates.scratch.title')}</h3>
          </div>
          <p className="text-gray-600 mt-1">{t('templates.scratch.description')}</p>
        </div>
      </div>
      
      {selectedTemplate && (
        <>
          <div className="my-6 w-full">
            <label className="mb-2 block text-sm font-medium text-gray-700">
              {t('promptLabel')}
            </label>
            <Textarea
              value={prompt}
              onChange={handlePromptChange}
              placeholder={selectedTemplate.prompt}
              rows={4}
              className="min-h-[100px]"
            />
          </div>
          
          {selectedTemplate.requiresImage && (
            <>
              <div className="mb-4 w-full">
                <h3 className="mb-2 text-sm font-medium text-gray-700">
                  {t('imageDescription')}
                </h3>
                <p className="mb-4 text-sm text-gray-600">
                  {t('imageDescriptionDetail')}
                </p>
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
                      alt="Uploaded document"
                      fill
                      className="h-full w-full object-contain"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 opacity-0 transition-opacity group-hover:opacity-100">
                      <p className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-gray-700">
                        {t('clickOrDrop')}
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
                      {t('dragOrClick')}
                    </p>
                    <p className="text-sm text-gray-500">
                      {t('dragOrClickDetail')}
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
                    
          {/* Next button that triggers analysis */}
          <Button 
            variant="default" 
            onClick={handleNextStep}
            disabled={isAnalyzing || isUploading}
            className="w-full"
          >
            {isAnalyzing || isUploading ? (
              <>
                <svg className="h-4 w-4 animate-spin mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {isAnalyzing ? t('analyzing') : t('uploading')}
              </>
            ) : (
              t('continue')
            )}
          </Button>
        </>
      )}
    </div>
  );
}