/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-call */
'use client';

import type { Letter } from '@prisma/client';
// Import pdfMake browser version
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';

// Initialize pdfMake with fonts
// @ts-expect-error safe to ignore
pdfMake.addVirtualFileSystem(pdfFonts);

interface PDFResult {
  pdfBytes: string;
  fileName: string;
}

export async function generatePDF(letter: Letter): Promise<PDFResult> {
  return new Promise<PDFResult>((resolve, reject) => {
    try {
      // Format the date
      const dateString = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      // Define types for content items
      type ContentItem = {
        text?: string;
        margin?: number[];
        image?: string;
        width?: number;
        height?: number;
      };

      // Prepare content sections
      const content: ContentItem[] = [
        { text: dateString, margin: [0, 0, 0, 10] },
      ];

      // Add sender information
      if (letter.senderName) {
        content.push({ text: letter.senderName });
      }
      
      if (letter.senderAddress) {
        const addressLines = letter.senderAddress.split('\n');
        addressLines.forEach(line => {
          content.push({ text: line });
        });
      }
      
      // Add spacing
      content.push({ text: '', margin: [0, 15, 0, 0] });
      
      // Add receiver information
      if (letter.receiverName) {
        content.push({ text: letter.receiverName });
      }
      
      if (letter.receiverAddress) {
        const addressLines = letter.receiverAddress.split('\n');
        addressLines.forEach(line => {
          content.push({ text: line });
        });
      }
      
      // Add spacing
      content.push({ text: '', margin: [0, 15, 0, 0] });
      
      // Add salutation
      content.push({ 
        text: `Dear ${letter.receiverName || 'Sir/Madam'},`, 
        margin: [0, 0, 0, 10] 
      });
      
      // Add letter content
      if (letter.content) {
        const contentLines = letter.content.split('\n');
        contentLines.forEach(line => {
          content.push({ text: line, margin: [0, 0, 0, 5] });
        });
      }
      
      // Add closing
      content.push({ 
        text: 'Sincerely,', 
        margin: [0, 15, 0, 10] 
      });
      
      // Add signature if available
      if (letter.signature) {
        try {
          const parts = letter.signature.split(',');
          if (parts.length > 1) {
            const signatureData = parts[1];
            content.push({
              image: `data:image/png;base64,${signatureData}`,
              width: 150,
              height: 60
            });
          }
        } catch (error) {
          console.error('Error with signature:', error);
        }
      }
      
      // Add sender name below signature
      if (letter.senderName) {
        content.push({ 
          text: letter.senderName,
          margin: [0, 10, 0, 0]
        });
      }
      
      // Create document definition
      const docDefinition = {
        content: content,
        defaultStyle: {
          fontSize: 12,
          lineHeight: 1.5
        },
        pageSize: 'A4',
        pageMargins: [50, 50, 50, 50]
      };
      
      // Generate PDF with type assertion to handle complex type issues
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const pdfDocGenerator = pdfMake.createPdf(docDefinition as any);
      
      // Get as base64
      pdfDocGenerator.getBase64((data) => {
        resolve({
          pdfBytes: data,
          fileName: `letter_${letter.id}.pdf`,
        });
      });
    } catch (error) {
      console.error('PDF generation error:', error);
      reject(new Error(error instanceof Error ? error.message : "Unknown PDF generation error"));
    }
  });
}
