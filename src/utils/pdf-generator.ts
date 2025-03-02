/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import type { Letter } from '@prisma/client';
// Import pdfMake browser version
import pdfMake from 'pdfmake/build/pdfmake';

interface PDFResult {
  pdfBytes: string;
  fileName: string;
}

// Helper function to format addresses
function formatAddress(address: string): string[] {
  if (!address) return [];
  
  // First split by newline
  const parts: string[] = [];
  
  address.split('\n').forEach(part => {
    // Then split each line by commas followed by space
    if (part.includes(', ')) {
      parts.push(...part.split(', '));
    } else {
      parts.push(part);
    }
  });
  
  // Filter out empty lines and trim each line
  return parts.map(part => part.trim()).filter(part => part.length > 0);
}

export async function generatePDF(letter: Letter): Promise<PDFResult> {
  try {
    // Format the date in European style (day month year)
    const dateString = new Date().toLocaleDateString('en-GB', {
      year: 'numeric', month: 'long', day: 'numeric',
    });

    // Prepare content sections with improved address formatting
    const senderBlock = [
      { text: letter.senderName || '', bold: true },
      ...formatAddress(letter.senderAddress || '').map(line => ({ text: line }))
    ];
    
    const receiverBlock = [
      { text: letter.receiverName || '', bold: true },
      ...formatAddress(letter.receiverAddress || '').map(line => ({ text: line }))
    ];
    
    const contentParagraphs = letter.content 
      ? letter.content.split('\n\n').map(para => ({ text: para, margin: [0, 0, 0, 10] }))
      : [];
    
    // Prepare document structure
    const content = [
      // Date (right aligned)
      { text: dateString, margin: [280, 0, 0, 20] },

      // Sender info (top left)
      { stack: senderBlock, margin: [0, 0, 0, 40] },
    
      // Recipient info
      { stack: receiverBlock, margin: [280, 0, 0, 40] },
      
      // Subject line if available
      // letter.subject ? { text: `Subject: ${letter.subject}`, bold: true, margin: [0, 0, 0, 20] } : {},
      
      // Salutation
      { text: `Dear ${letter.receiverName || 'Sir/Madam'},`, margin: [0, 0, 0, 15] },
      
      // Main content
      ...contentParagraphs,
      
      // Closing
      { text: 'Yours sincerely,', margin: [0, 20, 0, 40] },
    ];
    
    // Handle signature asynchronously
    if (letter.signatureUrl) {
      const base64Image = await fetchSignatureAsBase64(letter.signatureUrl);
      
      // Add signature and name
      content.push({
        image: base64Image,
        width: 150,
        height: 60,
        margin: [0, 0, 0, 5]
      } as any);
    }
    
    // Add sender name below signature
    content.push({ 
      text: letter.senderName || '',
      margin: [0, 5, 0, 0]
    });
    
    // Create document definition
    const docDefinition = {
      content: content,
      defaultStyle: {
        fontSize: 11,
        // Using the default Roboto font that comes with pdfMake
        // No need to specify 'font' property
        lineHeight: 1.3
      },
      pageSize: 'A4',
      pageMargins: [70, 50, 70, 50] // European standard margins
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

// Helper function to fetch and convert signature
async function fetchSignatureAsBase64(url: string): Promise<string> {
  const response = await fetch(url);
  const blob = await response.blob();
  
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
