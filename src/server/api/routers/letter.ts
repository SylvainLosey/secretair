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
      })
    )
    .mutation(async ({ ctx, input }) => {
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
          // Image + prompt analysis
          const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
              {
                role: "user",
                content: [
                  { 
                    type: "text", 
                    text: `Analyze this letter image and provide the following information in JSON format:
                    {
                      "senderName": "Name of the person/entity who RECEIVED the original letter (the one in the image)",
                      "senderAddress": "Full address of the person/entity who RECEIVED the original letter",
                      "receiverName": "Name of the person/entity who SENT the original letter",
                      "receiverAddress": "Full address of the person/entity who SENT the original letter",
                      "letterContext": "Brief summary of what this letter is about, including any reference numbers, account numbers, or specific identifiers",
                      "generatedResponse": "Body text for a response letter based on the following goal: ${input.userPrompt}"
                    }
                    
                    IMPORTANT NOTES:
                    1. The RECEIVER is the organization/person who authored the original letter in the image.
                    2. The SENDER is the person who received the letter and is now creating a response.
                    3. In the response letter, we will automatically switch these roles (receiver becomes sender).
                    
                    For the "generatedResponse" field:
                    - ONLY include the BODY text of the letter
                    - DO NOT include date, addresses, salutation, or closing
                    - INCLUDE all relevant specific details such as:
                      * Account numbers
                      * Reference numbers
                      * Policy numbers
                      * Membership IDs
                      * Dates mentioned in the original letter
                      * Any other specific identifiers from the original letter
                    
                    ${input.userPrompt} and include these specific details to ensure the letter can be acted upon correctly.` 
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
          }
        } else {
          // Prompt-only generation for "Write from Scratch"
          const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
              {
                role: "user",
                content: `Generate a formal letter based on the following instruction: "${input.userPrompt}"
                
                Only provide the BODY text of the letter. Do not include the date, addresses, salutation (Dear X), or closing (Sincerely, etc).
                
                The letter should be professional, concise, and directly address the purpose stated in the instruction.`
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

        // Check if the letter exists before updating
        const letterExists = await ctx.db.letter.findUnique({
          where: { id: input.letterId },
        });

        if (!letterExists) {
          throw new Error(`Letter with ID ${input.letterId} not found`);
        }

        // Then update the letter
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

        return updatedLetter;
      } catch (error) {
        console.error("Error analyzing or generating content:", error);
        throw new Error("Failed to generate letter content");
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
