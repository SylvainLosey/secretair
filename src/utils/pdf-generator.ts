import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

export type LetterData = {
  id: string;
  content: string;
  senderName: string;
  senderAddress: string;
  receiverName: string;
  receiverAddress: string;
  signature: string | null;
};

export async function generatePdfFromLetter(letter: LetterData): Promise<Uint8Array> {
  // Create a new PDF document - with A4 dimensions
  const pdfDoc = await PDFDocument.create();
  
  // A4 dimensions in points (1 pt = 1/72 inch)
  // A4 is 8.27 × 11.69 inches or 595 × 842 points
  let page = pdfDoc.addPage([595, 842]);
  
  // Get standard fonts
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  // Set up text parameters
  const fontSize = 11;
  const lineHeight = fontSize * 1.2;
  const margin = 50;
  
  // Start with the date at the top
  const today = new Date();
  const formattedDate = today.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  // Position for starting to write content
  let currentY = page.getHeight() - margin;
  
  // Draw the date
  page.drawText(formattedDate, {
    x: margin,
    y: currentY,
    font: font,
    size: fontSize,
    color: rgb(0, 0, 0),
  });
  
  // Move down after the date
  currentY -= lineHeight * 2;
  
  // Sender address (top left)
  if (letter.senderName) {
    page.drawText(letter.senderName, {
      x: margin,
      y: currentY,
      font: boldFont,
      size: fontSize,
      color: rgb(0, 0, 0),
    });
    currentY -= lineHeight;
  }
  
  if (letter.senderAddress) {
    const addressLines = letter.senderAddress.split('\n');
    for (const line of addressLines) {
      page.drawText(line, {
        x: margin,
        y: currentY,
        font: font,
        size: fontSize,
        color: rgb(0, 0, 0),
      });
      currentY -= lineHeight;
    }
  }
  
  // Move down after sender address
  currentY -= lineHeight * 2;
  
  // Recipient address
  if (letter.receiverName) {
    page.drawText(letter.receiverName, {
      x: margin,
      y: currentY,
      font: boldFont,
      size: fontSize,
      color: rgb(0, 0, 0),
    });
    currentY -= lineHeight;
  }
  
  if (letter.receiverAddress) {
    const addressLines = letter.receiverAddress.split('\n');
    for (const line of addressLines) {
      page.drawText(line, {
        x: margin,
        y: currentY,
        font: font,
        size: fontSize,
        color: rgb(0, 0, 0),
      });
      currentY -= lineHeight;
    }
  }
  
  // Move down after recipient address
  currentY -= lineHeight * 2;
  
  // Letter content
  if (letter.content) {
    const contentWidth = page.getWidth() - margin * 2;
    const words = letter.content.split(/\s+/);
    let line = '';
    
    for (const word of words) {
      const testLine = line + (line ? ' ' : '') + word;
      const lineWidth = font.widthOfTextAtSize(testLine, fontSize);
      
      if (lineWidth > contentWidth && line) {
        page.drawText(line, {
          x: margin,
          y: currentY,
          font: font,
          size: fontSize,
          color: rgb(0, 0, 0),
        });
        currentY -= lineHeight;
        line = word;
      } else {
        line = testLine;
      }
      
      // Check if we need a new page
      if (currentY < margin) {
        const newPage = pdfDoc.addPage([595, 842]); // A4 size
        page = newPage;
        currentY = page.getHeight() - margin;
      }
    }
    
    // Draw any remaining text
    if (line) {
      page.drawText(line, {
        x: margin,
        y: currentY,
        font: font,
        size: fontSize,
        color: rgb(0, 0, 0),
      });
      currentY -= lineHeight;
    }
  }
  
  // Move down before signature
  currentY -= lineHeight * 2;
  
  // Add signature if available
  if (letter.signature) {
    try {
      // Extract the base64 data from data URL
      const signatureData = letter.signature.split(',')[1];
      if (signatureData) {
        const signatureImageBytes = Buffer.from(signatureData, 'base64');
        const signatureImage = await pdfDoc.embedPng(signatureImageBytes);
        const signatureScale = 0.5; // Adjust scale as needed
        
        const signatureDims = signatureImage.scale(signatureScale);
        page.drawImage(signatureImage, {
          x: margin,
          y: currentY - signatureDims.height,
          width: signatureDims.width,
          height: signatureDims.height,
        });
        
        currentY -= signatureDims.height + lineHeight;
      }
    } catch (error) {
      console.error('Error adding signature to PDF:', error);
      
      // Fallback if signature image fails
      page.drawText("*Signature*", {
        x: margin,
        y: currentY,
        font: font,
        size: fontSize,
        color: rgb(0, 0, 0),
      });
    }
  }
  
  currentY -= lineHeight * 1.5;
  
  // Add typed name
  page.drawText(letter.senderName, {
    x: margin,
    y: currentY,
    font: boldFont,
    size: fontSize,
    color: rgb(0, 0, 0),
  });
  
  // Save the PDF and return it
  return pdfDoc.save();
} 