import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { OpenAI } from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// First, define the interface for your analysis results
interface LetterAnalysis {
  senderName?: string;
  senderAddress?: string;
  receiverName?: string;
  receiverAddress?: string;
  content?: string;
  // Add any other fields the analysis might return
}

export const letterRouter = createTRPCRouter({
  create: publicProcedure
    .input(
      z.object({
        imageUrl: z.string().optional(),
        userPrompt: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const letter = await ctx.db.letter.create({
        data: {
          content: "",
          senderName: "",
          senderAddress: "",
          receiverName: "",
          receiverAddress: "",
          imageUrl: input.imageUrl,
        },
      });
      return letter;
    }),

  generateLetter: publicProcedure
    .input(
      z.object({
        letterId: z.string(),
        userPrompt: z.string(),
        language: z.string().default('en'), // Add language parameter with English default
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Log the input parameters at the start
      console.log("Letter generation started with params:", {
        letterId: input.letterId,
        userPrompt: input.userPrompt,
        language: input.language
      });
      
      try {
        // Get the letter with the image URL
        const letter = await ctx.db.letter.findUnique({
          where: { id: input.letterId },
        });
        
        if (!letter) {
          throw new Error(`Letter with ID ${input.letterId} not found`);
        }
        
        // Initialize analysis with empty values
        const analysis: LetterAnalysis = {
          senderName: "",
          senderAddress: "",
          receiverName: "",
          receiverAddress: "",
          content: "",
        };

        const hasImage = !!letter.imageUrl;
        
        if (hasImage) {
          // Log the image-based prompt
          const promptText = `Analyze this letter image and provide the following information in JSON format.
                    Please respond in ${input.language} language.
                    
                    {
                      "generatedResponse": "Body text for a formal response letter based on the following goal: ${input.userPrompt}",
                      "senderName": "Name of the person/entity who RECEIVED the original letter (the one in the image)",
                      "senderAddress": "Postal address of the person/entity who RECEIVED the original letter",
                      "receiverName": "Name of the person/entity who SENT the original letter",
                      "receiverAddress": "Postal address of the person/entity who SENT the original letter",
                    }
                    
                    For the "generatedResponse" field:
                    - Use the image to retrieve context (account numbers, reference numbers, etc)
                    - DO NOT include date and addresses
                    - Include line breaks as would a formal letter
                    - senderName is the author of the response
                    - The response should be in ${input.language} language`;
          
          console.log("Using image analysis prompt with language:", input.language);
          console.log("Prompt text sample:", promptText.substring(0, 200) + "...");
          
          // Image + prompt analysis
          const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
              {
                role: "user",
                content: [
                  { 
                    type: "text", 
                    text: promptText
                  },
                  {
                    type: "image_url",
                    image_url: {
                      url: letter.imageUrl ?? "",
                      detail: "high"
                    }
                  }
                ],
              },
            ],
            response_format: { type: "json_object" },
          });

          // Parse the analysis
          const analysisText = response.choices[0]?.message.content ?? "{}";
          console.log("OpenAI Response:", analysisText);
          
          try {
            // Parse the result data safely
            const parsedData = JSON.parse(analysisText) as Record<string, unknown>;
            
            // Validate it's an object
            if (typeof parsedData !== "object" || parsedData === null) {
              throw new Error("Invalid AI response format");
            }
            
            // Helper function to clean address fields
            const cleanField = (value: unknown): string => {
              if (typeof value !== 'string') return "";
              
              // Check for "not provided" or similar phrases
              const notProvidedPhrases = ["not provided", "not available", "unknown", "n/a"];
              if (notProvidedPhrases.some(phrase => value.toLowerCase().includes(phrase))) {
                return "";
              }
              
              return value;
            };
            
            // Safely extract properties with type checks and cleaning
            analysis.senderName = cleanField(parsedData.senderName);
            analysis.senderAddress = cleanField(parsedData.senderAddress);
            analysis.receiverName = cleanField(parsedData.receiverName);
            analysis.receiverAddress = cleanField(parsedData.receiverAddress);
            
            // Handle content separately
            if (typeof parsedData.generatedResponse === 'string') {
              analysis.content = parsedData.generatedResponse;
            }
          } catch (error) {
            console.error("JSON Parse Error:", error);
            throw new Error("Failed to parse AI response");
          }
        } else {
          // Log the scratch prompt
          const promptText = `Generate a formal letter based on the following instruction: "${input.userPrompt}"
                
                Please write the response in ${input.language} language.
                
                Only provide the BODY text of the letter. Do not include the date, addresses, salutation (Dear X), or closing (Sincerely, etc).
                
                The letter should be professional, concise, and directly address the purpose stated in the instruction.`;
          
          console.log("Using scratch prompt with language:", input.language);
          console.log("Prompt text sample:", promptText.substring(0, 200) + "...");
          
          // Prompt-only generation for "Write from Scratch"
          const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
              {
                role: "user",
                content: promptText
              },
            ],
          });

          // Extract the generated content
          analysis.content = response.choices[0]?.message.content?.trim() ?? "";
          
          // For "Write from Scratch", use empty values to force the address step
          analysis.senderName = "";
          analysis.senderAddress = "";
          analysis.receiverName = "";
          analysis.receiverAddress = "";
        }

        // Update the letter with analysis results
        const updatedLetter = await ctx.db.letter.update({
          where: { id: input.letterId },
          data: {
            senderName: analysis.senderName,
            senderAddress: analysis.senderAddress,
            receiverName: analysis.receiverName,
            receiverAddress: analysis.receiverAddress,
            content: analysis.content,
            userPrompt: input.userPrompt, // Store the prompt that was used
          },
        });

        console.log("Letter generation completed with language:", input.language);
        return updatedLetter;
      } catch (error) {
        console.error("Error analyzing or generating content:", error);
        throw new Error(`Failed to generate letter content: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }),

  updateLetter: publicProcedure
    .input(
      z.object({
        id: z.string(),
        content: z.string().optional(),
        senderName: z.string().optional(),
        senderAddress: z.string().optional(),
        receiverName: z.string().optional(),
        receiverAddress: z.string().optional(),
        signatureUrl: z.string().optional(),
        pdfUrl: z.string().optional(),
        imageUrl: z.string().optional(),
        userPrompt: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.db.letter.update({
        where: { id },
        data,
      });
    }),

  getLetter: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.letter.findUnique({
        where: { id: input.id },
      });
    }),
});
