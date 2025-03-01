import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { PrismaClient } from '@prisma/client';

type Letter = {
  id: string;
  content: string;
  senderName: string;
  senderAddress: string;
  receiverName: string;
  receiverAddress: string;
  signature: string | null;
  createdAt: Date;
}

export async function generatePdfFromLetter(letter: Letter): Promise<Uint8Array> {
  // Create a new PDF document
  const pdfDoc = await PDFDocument.create();
  
  // Add a page to the document
  const page = pdfDoc.addPage([595.28, 841.89]); // A4 size
  
  // Get fonts
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  // Set some constants
  const margin = 50;
  const lineHeight = 14;
  let y = page.getHeight() - margin; // Starting y position from the top
  
  // Add date
  const date = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  page.drawText(date, {
    x: margin,
    y,
    font,
    size: 11,
    color: rgb(0, 0, 0),
  });
  y -= lineHeight * 2;
  
  // Add sender info
  page.drawText(letter.senderName, {
    x: margin,
    y,
    font: boldFont,
    size: 11,
    color: rgb(0, 0, 0),
  });
  y -= lineHeight;
  
  // Split sender address into lines
  const senderAddressLines = letter.senderAddress.split('\n');
  for (const line of senderAddressLines) {
    page.drawText(line, {
      x: margin,
      y,
      font,
      size: 11,
      color: rgb(0, 0, 0),
    });
    y -= lineHeight;
  }
  
  y -= lineHeight * 2;
  
  // Add recipient info
  page.drawText(letter.receiverName, {
    x: margin,
    y,
    font: boldFont,
    size: 11,
    color: rgb(0, 0, 0),
  });
  y -= lineHeight;
  
  // Split recipient address into lines
  const receiverAddressLines = letter.receiverAddress.split('\n');
  for (const line of receiverAddressLines) {
    page.drawText(line, {
      x: margin,
      y,
      font,
      size: 11,
      color: rgb(0, 0, 0),
    });
    y -= lineHeight;
  }
  
  y -= lineHeight * 2;
  
  // Add letter content
  // Split the content by lines and handle word wrapping
  const contentLines = [];
  const words = letter.content.split(/\s+/);
  let currentLine = '';
  const maxWidth = page.getWidth() - margin * 2;
  
  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const textWidth = font.widthOfTextAtSize(testLine, 11);
    
    if (textWidth > maxWidth) {
      contentLines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  
  if (currentLine) {
    contentLines.push(currentLine);
  }
  
  // Draw content lines
  for (const line of contentLines) {
    page.drawText(line, {
      x: margin,
      y,
      font,
      size: 11,
      color: rgb(0, 0, 0),
    });
    y -= lineHeight;
  }
  
  y -= lineHeight * 3;
  
  // Add signature placeholder or embedded signature
  if (letter.signature) {
    // If we have a signature image, we'd need to decode and embed it
    // This is simplified - you may need to handle base64 properly
    page.drawText("Signed electronically", {
      x: margin,
      y,
      font: font,
      size: 11,
      color: rgb(0, 0, 0),
    });
    y -= lineHeight;
  }
  
  // Add the sender name again below where the signature would be
  page.drawText(letter.senderName, {
    x: margin,
    y,
    font: boldFont,
    size: 11,
    color: rgb(0, 0, 0),
  });
  
  // Save the PDF and return it
  return pdfDoc.save();
} 