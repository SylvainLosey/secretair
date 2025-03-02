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

interface PDFContentItem {
  text?: string;
  margin?: number[];
  image?: string;
  width?: number;
  height?: number;
}

export async function generatePDF(letter: Letter): Promise<PDFResult> {
  try {
    // Format the date and prepare all the content that doesn't require async operations
    const dateString = new Date().toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
    });

    const content: PDFContentItem[] = [{ text: dateString, margin: [0, 0, 0, 10] }];
    
    // Add all the text content (sender, receiver, letter content, etc.)
    if (letter.senderName) content.push({
      text: letter.senderName,
      margin: []
    });
    if (letter.senderAddress) {
      const addressLines = letter.senderAddress.split('\n');
      addressLines.forEach((line: string) => {
        content.push({
          text: line,
          margin: []
        });
      });
    }
    content.push({ text: '', margin: [0, 15, 0, 0] });
    if (letter.receiverName) content.push({
      text: letter.receiverName,
      margin: []
    });
    if (letter.receiverAddress) {
      const addressLines = letter.receiverAddress.split('\n');
      addressLines.forEach((line: string) => {
        content.push({
          text: line,
          margin: []
        });
      });
    }
    content.push({ text: '', margin: [0, 15, 0, 0] });
    content.push({ 
      text: `Dear ${letter.receiverName || 'Sir/Madam'},`, 
      margin: [0, 0, 0, 10] 
    });
    if (letter.content) {
      const contentLines = letter.content.split('\n');
      contentLines.forEach((line: string) => {
        content.push({ text: line, margin: [0, 0, 0, 5] });
      });
    }
    content.push({ 
      text: 'Sincerely,', 
      margin: [0, 15, 0, 10] 
    });
    
    // Handle signature asynchronously before PDF generation
    if (letter.signatureUrl) {
      const response = await fetch(letter.signatureUrl);
      const blob = await response.blob();
      const reader = new FileReader();
      
      // Convert blob to base64
      const base64Image = await new Promise<string>((resolve) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
      
      // Add to content
      content.push({
        image: base64Image,
        width: 150,
        height: 60
      });
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
    
    // Generate PDF
    const pdfDocGenerator = pdfMake.createPdf(docDefinition as any);
    
    // Return as base64
    return new Promise((resolve) => {
      pdfDocGenerator.getBase64((data) => {
        resolve({
          pdfBytes: data,
          fileName: `letter_${letter.id}.pdf`,
        });
      });
    });
    
  } catch (error) {
    console.error('PDF generation error:', error);
    throw new Error(error instanceof Error ? error.message : "Unknown PDF generation error");
  }
}
