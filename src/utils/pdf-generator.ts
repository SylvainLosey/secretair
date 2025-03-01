import PDFDocument from 'pdfkit';
import type { Letter } from '@prisma/client';

export async function generatePdfFromLetter(letter: Letter): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      // Create a buffer to store PDF data
      const buffers: Buffer[] = [];
      
      // Create a PDF doc with absolutely minimal font configuration
      // Don't specify any font in the constructor
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        info: {
          Title: `Letter - ${letter.id}`,
          Author: letter.senderName,
        },
        // Explicitly avoid font directory auto-detection
        fontDirectories: []
      });
      
      // Handle PDF data collection
      doc.on('data', buffer => buffers.push(buffer));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });
      
      // Format date
      const formattedDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      // Extract first line as subject
      const contentLines = letter.content.split('\n');
      const subject = contentLines[0] || 'Letter';
      const contentWithoutSubject = contentLines.slice(1).join('\n');
      
      // Split addresses
      const senderAddressLines = letter.senderAddress.split('\n');
      const receiverAddressLines = letter.receiverAddress.split('\n');
      
      // Set default font only once - use the standard built-in 'Helvetica'
      // which is the default and shouldn't require external loading
      doc.fontSize(11);
      
      // Add sender address
      doc.text(letter.senderName, 50, 150, { continued: false });
      
      let yPos = 165;
      senderAddressLines.forEach(line => {
        doc.text(line, 50, yPos);
        yPos += 15;
      });
      
      // Add recipient address
      doc.text(letter.receiverName, 50, 250);
      
      yPos = 265;
      receiverAddressLines.forEach(line => {
        doc.text(line, 50, yPos);
        yPos += 15;
      });
      
      // Add date
      doc.text(formattedDate, 400, 250, { align: 'right' });
      
      // Add subject
      doc.text(`Subject: ${subject}`, 50, 350);
      
      // Add content
      doc.text(contentWithoutSubject, 50, 380, {
        align: 'left',
        paragraphGap: 15,
        lineGap: 5,
        width: 500
      });
      
      // Add closing
      const finalYPosition = doc.y + 40;
      doc.text('Sincerely,', 50, finalYPosition);
      
      // Add signature if available
      if (letter.signature) {
        try {
          if (letter.signature.startsWith('data:image')) {
            const signatureBase64 = letter.signature.split(',')[1];
            const signatureBuffer = Buffer.from(signatureBase64, 'base64');
            doc.image(signatureBuffer, 50, finalYPosition + 30, { width: 150 });
          }
        } catch (err) {
          console.error('Error adding signature:', err);
        }
      }
      
      // Add sender name below signature
      doc.text(letter.senderName, 50, letter.signature ? finalYPosition + 100 : finalYPosition + 60);
      
      // Finalize the PDF
      doc.end();
    } catch (error) {
      console.error('Error generating PDF:', error);
      reject(new Error(`Failed to generate PDF: ${error instanceof Error ? error.message : String(error)}`));
    }
  });
} 