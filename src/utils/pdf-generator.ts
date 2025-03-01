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
  // Create a new PDF document
  const pdfDoc = await PDFDocument.create();
  
  // Add a page to the document - standard US Letter size
  let page = pdfDoc.addPage([612, 792]);
  
  // Get fonts
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  // Set some constants
  const margin = 72; // 1 inch margins
  const fontSize = 12;
  const lineHeight = fontSize * 1.5;
  const { width, height } = page.getSize();
  let currentY = height - margin;
  
  // Add date
  const date = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  page.drawText(date, {
    x: width - margin - font.widthOfTextAtSize(date, fontSize),
    y: currentY,
    font,
    size: fontSize,
    color: rgb(0, 0, 0),
  });
  currentY -= lineHeight * 2;
  
  // Add sender info
  page.drawText(letter.senderName, {
    x: margin,
    y: currentY,
    font: boldFont,
    size: fontSize,
    color: rgb(0, 0, 0),
  });
  currentY -= lineHeight;
  
  // Split sender address into lines
  const senderAddressLines = letter.senderAddress.split('\n');
  for (const line of senderAddressLines) {
    page.drawText(line, {
      x: margin,
      y: currentY,
      font,
      size: fontSize,
      color: rgb(0, 0, 0),
    });
    currentY -= lineHeight;
  }
  
  currentY -= lineHeight;
  
  // Add recipient info
  page.drawText(letter.receiverName, {
    x: margin,
    y: currentY,
    font: boldFont,
    size: fontSize,
    color: rgb(0, 0, 0),
  });
  currentY -= lineHeight;
  
  // Split recipient address into lines
  const receiverAddressLines = letter.receiverAddress.split('\n');
  for (const line of receiverAddressLines) {
    page.drawText(line, {
      x: margin,
      y: currentY,
      font,
      size: fontSize,
      color: rgb(0, 0, 0),
    });
    currentY -= lineHeight;
  }
  
  currentY -= lineHeight * 2;
  
  // Add salutation
  page.drawText(`Dear ${letter.receiverName},`, {
    x: margin,
    y: currentY,
    font,
    size: fontSize,
    color: rgb(0, 0, 0),
  });
  currentY -= lineHeight * 1.5;
  
  // Add letter content with word wrapping
  const contentLines = [];
  const words = letter.content.split(/\s+/);
  let currentLine = '';
  const maxWidth = width - margin * 2;
  
  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const textWidth = font.widthOfTextAtSize(testLine, fontSize);
    
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
    // Check if we need a new page
    if (currentY < margin + 100) { // 100px buffer for signature
      const newPage = pdfDoc.addPage([612, 792]);
      page = newPage;
      currentY = height - margin;
    }
    
    page.drawText(line, {
      x: margin,
      y: currentY,
      font,
      size: fontSize,
      color: rgb(0, 0, 0),
    });
    currentY -= lineHeight;
  }
  
  currentY -= lineHeight * 2;
  
  // Add closing
  page.drawText('Sincerely,', {
    x: margin,
    y: currentY,
    font,
    size: fontSize,
    color: rgb(0, 0, 0),
  });
  currentY -= lineHeight * 5; // Space for signature
  
  // Add signature if available
  if (letter.signature) {
    try {
      // Extract the base64 data from data URL
      const signatureBase64 = letter.signature.split(',')[1];
      if (signatureBase64) {
        // Convert base64 to bytes
        const signatureBytes = Buffer.from(signatureBase64, 'base64');
        
        // Embed the image in the document
        const signatureImage = await pdfDoc.embedPng(signatureBytes);
        
        // Calculate appropriate size while maintaining aspect ratio
        const dimensions = signatureImage.scale(0.5); // Scale down to 50%
        const maxWidth = width - margin * 2;
        let imgWidth = dimensions.width;
        let imgHeight = dimensions.height;
        
        if (imgWidth > maxWidth) {
          const scaleFactor = maxWidth / imgWidth;
          imgWidth = maxWidth;
          imgHeight = imgHeight * scaleFactor;
        }
        
        // Draw the signature
        page.drawImage(signatureImage, {
          x: margin,
          y: currentY - imgHeight,
          width: imgWidth,
          height: imgHeight,
        });
        
        currentY -= imgHeight;
      }
    } catch (error) {
      console.error('Error embedding signature:', error);
      // Fallback - add text placeholder instead
      page.drawText('(Signature on file)', {
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