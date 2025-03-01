import { db } from "~/server/db";
import { NextRequest, NextResponse } from "next/server";
import { generatePdfFromLetter } from "~/utils/pdf-generator";

export async function POST(request: NextRequest) {
  try {
    const { id } = await request.json();
    console.log('Download PDF API route called for letter ID:', id);

    // Fetch the letter from the database
    const letter = await db.letter.findUnique({
      where: { id },
    });

    if (!letter) {
      console.error('Letter not found:', id);
      return NextResponse.json(
        { success: false, message: "Letter not found" },
        { status: 404 }
      );
    }

    console.log('Letter found, generating PDF for download...');
    
    // Generate PDF using the letter data
    const pdfBuffer = await generatePdfFromLetter(letter);
    
    console.log('PDF generated successfully, converting to base64...');
    
    // Convert PDF buffer to base64
    const pdfBase64 = Buffer.from(pdfBuffer).toString('base64');

    // Return successful response with base64 PDF data
    return NextResponse.json({
      success: true,
      pdfBytes: pdfBase64,
      fileName: `letter-${id}.pdf`,
    });

  } catch (error) {
    console.error("Error generating PDF:", error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : "Failed to generate PDF" 
      },
      { status: 500 }
    );
  }
}