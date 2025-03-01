import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { OpenAI } from "openai";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
        userPrompt: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
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
                  "generatedResponse": "Body text for a response letter based on the following goal: ${input.userPrompt || "Create an appropriate response"}"
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
                
                The content should express the user's intent: ${input.userPrompt || "Create an appropriate response"} and include these specific details to ensure the letter can be acted upon correctly.` 
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
      const analysisText = response.choices[0]?.message.content || "{}";
      console.log("OpenAI Response:", analysisText);
      
      let analysis;
      try {
        analysis = JSON.parse(analysisText);
        console.log("Parsed Analysis:", analysis);
      } catch (error) {
        console.error("JSON Parse Error:", error);
        analysis = {};
      }

      // Update the letter with extracted data and ensure there's content
      const updatedLetter = await ctx.db.letter.update({
        where: { id: input.letterId },
        data: {
          senderName: analysis.senderName || "",
          senderAddress: analysis.senderAddress || "",
          receiverName: analysis.receiverName || "",
          receiverAddress: analysis.receiverAddress || "",
          content: analysis.generatedResponse || 
                  analysis.suggestedContent || 
                  `[Your response to: ${input.userPrompt || "the letter"}]`, // Fallback content
        },
      });

      console.log("Updated letter:", updatedLetter);
      return updatedLetter;
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
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        // Update the letter status
        const letter = await ctx.db.letter.update({
          where: { id: input.id },
          data: { 
            status: 'generated',
            pdfUrl: `/api/pdf/${input.id}` // We'll create this API route for direct access
          },
        });

        return { 
          success: true, 
          message: 'PDF generation initiated successfully',
          letter 
        };
      } catch (error) {
        console.error('Error generating PDF:', error);
        throw new Error('Failed to generate PDF');
      }
    }),

  getPdfContent: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      try {
        // Fetch the letter from the database
        const letter = await ctx.db.letter.findUnique({
          where: { id: input.id },
        });

        if (!letter) {
          throw new Error('Letter not found');
        }

        // Create a new PDF document
        const pdfDoc = await PDFDocument.create();
        let page = pdfDoc.addPage([612, 792]); // US Letter size
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const fontSize = 12;
        
        // Define margins
        const margin = 50;
        const { width, height } = page.getSize();
        let currentY = height - margin;
        
        // Add date (top right)
        const today = new Date();
        const dateStr = today.toLocaleDateString('en-US', { 
          year: 'numeric', month: 'long', day: 'numeric' 
        });
        const dateWidth = font.widthOfTextAtSize(dateStr, fontSize);
        page.drawText(dateStr, {
          x: width - margin - dateWidth,
          y: currentY,
          size: fontSize,
          font,
          color: rgb(0, 0, 0),
        });
        
        currentY -= 50; // Move down for sender address
        
        // Add sender info
        page.drawText(letter.senderName, {
          x: margin,
          y: currentY,
          size: fontSize,
          font,
          color: rgb(0, 0, 0),
        });
        
        currentY -= 15;
        
        // Split address into lines and add them
        const senderAddressLines = letter.senderAddress.split('\n');
        for (const line of senderAddressLines) {
          page.drawText(line, {
            x: margin,
            y: currentY,
            size: fontSize,
            font,
            color: rgb(0, 0, 0),
          });
          currentY -= 15;
        }
        
        currentY -= 30; // Extra space before recipient
        
        // Add recipient info
        page.drawText(letter.receiverName, {
          x: margin,
          y: currentY,
          size: fontSize,
          font,
          color: rgb(0, 0, 0),
        });
        
        currentY -= 15;
        
        // Split recipient address into lines
        const receiverAddressLines = letter.receiverAddress.split('\n');
        for (const line of receiverAddressLines) {
          page.drawText(line, {
            x: margin,
            y: currentY,
            size: fontSize,
            font,
            color: rgb(0, 0, 0),
          });
          currentY -= 15;
        }
        
        currentY -= 30; // Space before salutation
        
        // Add salutation
        page.drawText(`Dear ${letter.receiverName},`, {
          x: margin,
          y: currentY,
          size: fontSize,
          font,
          color: rgb(0, 0, 0),
        });
        
        currentY -= 30; // Space before content
        
        // Split content into lines and render (simple word wrap)
        const contentLines = [];
        const words = letter.content.split(' ');
        let currentLine = '';
        
        for (const word of words) {
          const testLine = currentLine ? `${currentLine} ${word}` : word;
          const testWidth = font.widthOfTextAtSize(testLine, fontSize);
          
          if (testWidth > width - 2 * margin) {
            contentLines.push(currentLine);
            currentLine = word;
          } else {
            currentLine = testLine;
          }
        }
        
        if (currentLine) {
          contentLines.push(currentLine);
        }
        
        // Draw each line of content
        for (const line of contentLines) {
          page.drawText(line, {
            x: margin,
            y: currentY,
            size: fontSize,
            font,
            color: rgb(0, 0, 0),
          });
          currentY -= 15;
          
          // Check if we need a new page
          if (currentY < margin) {
            const newPage = pdfDoc.addPage([612, 792]);
            page = newPage;
            currentY = height - margin;
          }
        }
        
        currentY -= 45; // Space before closing
        
        // Add closing
        page.drawText('Sincerely,', {
          x: margin,
          y: currentY,
          size: fontSize,
          font,
          color: rgb(0, 0, 0),
        });
        
        currentY -= 50; // Space for signature
        
        // Add signature if available
        if (letter.signature) {
          // Implementation for adding signature image would go here
          // This would require converting the data URL to a format usable by pdf-lib
        }
        
        // Add sender name below signature space
        page.drawText(letter.senderName, {
          x: margin,
          y: currentY,
          size: fontSize,
          font,
          color: rgb(0, 0, 0),
        });
        
        // Get the PDF as bytes
        const pdfBytes = await pdfDoc.save();
        
        return {
          success: true,
          pdfBytes: Buffer.from(pdfBytes).toString('base64'),
          fileName: `letter-${input.id}.pdf`
        };
      } catch (error) {
        console.error('Error generating PDF content:', error);
        throw new Error('Failed to generate PDF content');
      }
    }),
});
