import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '~/server/db';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { id } = req.query;

  try {
    // Get letter data from database
    const letter = await db.letter.findUnique({
      where: { id: id as string },
    });

    if (!letter) {
      return res.status(404).json({ message: 'Letter not found' });
    }

    // Create a new PDF document
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([612, 792]); // Letter size
    const { width, height } = page.getSize();
    
    // Add fonts
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    // Set margins
    const margin = 72; // 1 inch margins
    
    // Add date
    const date = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    page.drawText(date, {
      x: margin,
      y: height - margin,
      size: 12,
      font,
      color: rgb(0, 0, 0),
    });
    
    // Add sender address (top left)
    page.drawText(letter.senderName, {
      x: margin,
      y: height - margin - 24,
      size: 12,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
    
    const senderAddressLines = letter.senderAddress.split('\n');
    senderAddressLines.forEach((line, index) => {
      page.drawText(line, {
        x: margin,
        y: height - margin - 40 - (index * 16),
        size: 12,
        font,
        color: rgb(0, 0, 0),
      });
    });
    
    // Add recipient address
    const recipientStartY = height - margin - 120;
    page.drawText(letter.receiverName, {
      x: margin,
      y: recipientStartY,
      size: 12,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
    
    const receiverAddressLines = letter.receiverAddress.split('\n');
    receiverAddressLines.forEach((line, index) => {
      page.drawText(line, {
        x: margin,
        y: recipientStartY - 16 - (index * 16),
        size: 12,
        font,
        color: rgb(0, 0, 0),
      });
    });
    
    // Add letter content
    const contentStartY = recipientStartY - 100;
    const contentLines = letter.content.split('\n');
    let currentY = contentStartY;
    
    contentLines.forEach((line) => {
      const words = line.split(' ');
      let currentLine = '';
      
      for (const word of words) {
        const testLine = currentLine + (currentLine ? ' ' : '') + word;
        const lineWidth = font.widthOfTextAtSize(testLine, 12);
        
        if (lineWidth > width - (margin * 2) && currentLine) {
          page.drawText(currentLine, {
            x: margin,
            y: currentY,
            size: 12,
            font,
            color: rgb(0, 0, 0),
          });
          currentY -= 16;
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      }
      
      if (currentLine) {
        page.drawText(currentLine, {
          x: margin,
          y: currentY,
          size: 12,
          font,
          color: rgb(0, 0, 0),
        });
        currentY -= 16;
      }
      
      currentY -= 8; // Add extra spacing between paragraphs
    });
    
    // Add signature if it exists
    if (letter.signature) {
      // In a real implementation, you would handle the image data properly
      // This is a placeholder - in production you'd embed the signature image
      page.drawText('<<Signature>>', {
        x: margin,
        y: 120,
        size: 12,
        font: font,
        color: rgb(0, 0, 0),
      });
    }
    
    // Serialize the PDFDocument to bytes
    const pdfBytes = await pdfDoc.save();
    
    // Set the appropriate headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="letter-${id}.pdf"`);
    res.setHeader('Content-Length', pdfBytes.length);
    
    // Send the PDF as the response
    res.send(Buffer.from(pdfBytes));
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({ message: 'Error generating PDF' });
  }
}