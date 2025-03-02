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
        originalImage: z.string().optional(),
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
          originalImage: input.originalImage,
        },
      });
      return letter;
    }),

  analyzeImage: publicProcedure
    .input(
      z.object({
        letterId: z.string(),
        imageData: z.string(),
        userPrompt: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Initialize analysis with the proper type and empty values
        const analysis: LetterAnalysis = {
          senderName: "",
          senderAddress: "",
          receiverName: "",
          receiverAddress: "",
          content: "",
        };

        // Get the analysis from OpenAI
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
                    "generatedResponse": "Body text for a response letter based on the following goal: ${input.userPrompt ?? "Create an appropriate response"}"
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
                  
                  The content should express the user's intent: ${input.userPrompt ?? "Create an appropriate response"} and include these specific details to ensure the letter can be acted upon correctly.` 
                },
                { 
                  type: "image_url", 
                  image_url: { url: input.imageData } 
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
          
          // Safely extract properties with type checks
          if (typeof parsedData.senderName === 'string') analysis.senderName = parsedData.senderName;
          if (typeof parsedData.senderAddress === 'string') analysis.senderAddress = parsedData.senderAddress;
          if (typeof parsedData.receiverName === 'string') analysis.receiverName = parsedData.receiverName;
          if (typeof parsedData.receiverAddress === 'string') analysis.receiverAddress = parsedData.receiverAddress;
          
          // Fix this line - you're looking for generatedResponse in AI output but mapping to content in your analysis
          if (typeof parsedData.generatedResponse === 'string') analysis.content = parsedData.generatedResponse;
        } catch (error) {
          console.error("JSON Parse Error:", error);
        }

        // Now update with nullish coalescing for safety
        const updatedLetter = await ctx.db.letter.update({
          where: { id: input.letterId },
          data: {
            senderName: analysis.senderName ?? "",
            senderAddress: analysis.senderAddress ?? "",
            receiverName: analysis.receiverName ?? "",
            receiverAddress: analysis.receiverAddress ?? "",
            content: analysis.content ?? "",
          },
        });

        return updatedLetter;
      } catch (error) {
        console.error("Error analyzing image:", error);
        throw new Error("Failed to analyze the image");
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
        signature: z.string().optional(),
        pdfUrl: z.string().optional(),
        originalImage: z.string().optional(),
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

  generatePdf: publicProcedure
    .input(
      z.object({
        id: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const letter = await ctx.db.letter.findUnique({
          where: { id: input.id },
        });

        if (!letter) {
          throw new Error("Letter not found");
        }
        
        return {
          success: true,
          letter
        };
      } catch (error) {
        console.error("Error fetching letter:", error);
        throw new Error("Failed to fetch letter");
      }
    }),

  getPdfContent: publicProcedure
    .input(
      z.object({
        id: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const letter = await ctx.db.letter.findUnique({
          where: { id: input.id },
        });

        if (!letter) {
          throw new Error("Letter not found");
        }

        // No longer using pdf generator on server
        return {
          success: true,
          letter
        };
      } catch (error) {
        console.error('Error fetching letter:', error);
        throw new Error('Failed to fetch letter');
      }
    }),
});
