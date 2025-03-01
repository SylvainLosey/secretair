"use client";

import { useEffect, useState } from "react";
import { useWizardStore } from "~/lib/store";
import { api } from "~/utils/api";

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

  // Auto-save when content changes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (content && letterId && !isLoading) {
        saveContent();
      }
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [content, letterId, isLoading]);

  if (isLoading) {
    return <div className="text-center">Loading letter content...</div>;
  }

  return (
    <div>
      <h2 className="mb-4 text-xl font-semibold">Edit Letter Content</h2>
      <p className="mb-4 text-gray-600">
        Review and edit the content of your letter
      </p>
      
      <textarea
        value={content}
        onChange={handleContentChange}
        className="w-full min-h-[300px] p-4 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
        placeholder="Enter your letter content here..."
      />
      
      <div className="mt-2 text-right text-sm text-gray-500">
        {updateLetterMutation.isLoading ? "Saving..." : "Changes auto-saved"}
      </div>
    </div>
  );
}
