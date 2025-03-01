// src/pages/api/generate-pdf.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '~/server/db';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { letterId } = req.body;

  if (!letterId) {
    return res.status(400).json({ message: 'Letter ID is required' });
  }

  try {
    // Update the letter status
    const letter = await db.letter.update({
      where: { id: letterId },
      data: { 
        status: 'generated',
        pdfUrl: `/api/letters/${letterId}/pdf`
      },
    });

    res.status(200).json({ 
      success: true, 
      message: 'PDF generated successfully',
      letter 
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error generating PDF' 
    });
  }
}
