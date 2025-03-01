import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import type { Letter } from '@prisma/client';

interface PDFResult {
  pdfBytes: string;
  fileName: string;
}

export async function generatePDF(letter: Letter): Promise<PDFResult> {
  // Create a new PDF document
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4 size
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  
  // Set up some initial values
  const fontSize = 12;
  const margin = 50;
  let y = page.getHeight() - margin;
  const lineHeight = fontSize * 1.5;
  
  // Helper function to add text
  const addText = (text: string, indent = 0) => {
    page.drawText(text ?? "", {
      x: margin + indent,
      y,
      size: fontSize,
      font,
      color: rgb(0, 0, 0),
    });
    y -= lineHeight;
  };
  
  // Draw date
  const dateString = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  addText(dateString);
  y -= lineHeight; // Extra space after date
  
  // Draw sender information
  if (letter.senderName) addText(letter.senderName);
  if (letter.senderAddress) {
    const addressLines = letter.senderAddress.split('\n');
    for (const line of addressLines) {
      addText(line);
    }
  }
  y -= lineHeight * 2; // Extra space
  
  // Draw receiver information
  if (letter.receiverName) addText(letter.receiverName);
  if (letter.receiverAddress) {
    const addressLines = letter.receiverAddress.split('\n');
    for (const line of addressLines) {
      addText(line);
    }
  }
  y -= lineHeight * 2; // Extra space
  
  // Draw salutation
  addText(`Dear ${letter.receiverName || 'Sir/Madam'},`);
  y -= lineHeight; // Extra space after salutation
  
  // Draw content
  if (letter.content) {
    const contentLines = letter.content.split('\n');
    for (const line of contentLines) {
      addText(line);
    }
  }
  
  // Draw signature if available
  if (letter.signature) {
    try {
      const parts = letter.signature.split(',');
      if (parts.length > 1) {
        const signatureImageData = parts[1]!;
        const signatureBytes = Buffer.from(signatureImageData, 'base64');
        const signatureImage = await pdfDoc.embedPng(signatureBytes);
        
        const width = 150; // Set appropriate size
        const height = 60;
        
        page.drawImage(signatureImage, {
          x: margin,
          y: y - height,
          width,
          height,
        });
      }
    } catch (error) {
      console.error('Error embedding signature:', error);
    }
  }
  
  // Serialize to bytes
  const pdfBytes = await pdfDoc.saveAsBase64();
  
  return {
    pdfBytes,
    fileName: `letter_${letter.id}.pdf`,
  };
}
