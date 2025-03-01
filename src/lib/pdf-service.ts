import { renderToString } from '@react-pdf/renderer';
import { Letter } from '@prisma/client';
import { createElement } from 'react';
import LetterPDF from '~/components/LetterPDF';

// Using a different approach with renderToString first
export async function generateLetterPdf(letter: Letter): Promise<Buffer> {
  try {
    // Use require for dynamic import (since we're in a server environment)
    const { pdf } = await import('@react-pdf/renderer');
    
    // Create the React element
    const element = createElement(LetterPDF, { letter });
    
    // First render to a string, then to a buffer
    // This is a workaround for the React children issue
    const stream = await pdf(element).toBuffer();
    return stream;
  } catch (error) {
    console.error('Error in PDF generation service:', error);
    throw error;
  }
} 