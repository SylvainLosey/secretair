"use client";

import { useEffect, useState } from "react";
import { useWizardStore } from "~/lib/store";
import { api } from "~/utils/api";
import { useAutoSave } from "~/hooks/useAutoSave";
import { StepLayout } from "~/components/ui/StepLayout";

export default function ContentStep() {
  const { letterId } = useWizardStore();
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(true);

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

  const saveContent = async () => {
    if (!letterId) return;
    
    await updateLetterMutation.mutateAsync({
      id: letterId,
      content,
    });
  };

  useAutoSave(
    content,
    saveContent,
    [content, letterId],
    1000,
    isLoading
  );

  return (
    <StepLayout
      title="Edit Letter Content"
      description="Review and edit the content of your letter"
      isLoading={isLoading}
      loadingMessage="Loading letter content..."
    >
      <textarea
        value={content}
        onChange={handleContentChange}
        className="min-h-[300px] w-full rounded-lg border border-gray-300 p-4 focus:border-blue-500 focus:ring-blue-500"
        placeholder="Enter your letter content here..."
      />
      
      <div className="mt-2 text-right text-sm text-gray-500">
        {updateLetterMutation.isPending ? "Saving..." : "Changes auto-saved"}
      </div>
    </StepLayout>
  );
}
