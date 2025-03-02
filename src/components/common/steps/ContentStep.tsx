"use client";

import { useEffect, useState, forwardRef, useImperativeHandle } from "react";
import { useWizardStore } from "~/lib/store";
import { api } from "~/utils/api";
import { StepLayout } from "~/components/common/StepLayout";
import { useTranslations } from 'next-intl';
import { Textarea } from "~/components/ui/textarea";
import { useErrorHandler } from "~/hooks/useErrorHandler";

// Define the interface for the exposed methods
export interface ContentStepRef {
  saveData: () => Promise<boolean>;
}

const ContentStep = forwardRef<ContentStepRef>((_, ref) => {
  const { letterId } = useWizardStore();
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { handleError } = useErrorHandler();

  const t = useTranslations('contentStep');

  const letterQuery = api.letter.getLetter.useQuery(
    { id: letterId! },
    { enabled: !!letterId }
  );
  
  const updateLetterMutation = api.letter.updateLetter.useMutation();

  useEffect(() => {
    if (letterQuery.data) {
      setContent(letterQuery.data.content);
      setIsLoading(false);
    }
  }, [letterQuery.data]);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
  };

  const saveContent = async (): Promise<boolean> => {
    if (!letterId) return false;
    
    try {
      setIsSaving(true);
      
      await updateLetterMutation.mutateAsync({
        id: letterId,
        content,
      });
      
      return true; // Save successful
    } catch (error) {
      handleError(error, "Failed to save content");
      return false; // Save failed
    } finally {
      setIsSaving(false);
    }
  };

  // Expose the saveData method to the parent component
  useImperativeHandle(ref, () => ({
    saveData: saveContent
  }));

  return (
    <StepLayout
      title={t('title')}
      description={t('description')}
      isLoading={isLoading}
      loadingMessage="Loading letter content..."
    >
      <Textarea
        value={content}
        onChange={handleContentChange}
        className="min-h-[300px]"
        rows={12}
        placeholder={t('placeholder')}
      />      
      <div className="mt-2 text-right text-sm">
        {isSaving && <span className="text-blue-500">{t('saving')}</span>}
      </div>
    </StepLayout>
  );
});

ContentStep.displayName = "ContentStep";

export default ContentStep;
