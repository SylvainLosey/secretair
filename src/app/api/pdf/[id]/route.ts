import { db } from "~/server/db";
import { NextRequest, NextResponse } from "next/server";
import { generatePdfFromLetter } from "~/utils/pdf-generator";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id;

  try {
    console.log('PDF API route called for letter ID:', id);

    // Fetch the letter from the database
    const letter = await db.letter.findUnique({
      where: { id },
    });

    if (!letter) {
      console.error('Letter not found:', id);
      return NextResponse.json(
        { error: "Letter not found" },
        { status: 404 }
      );
    }

    console.log('Letter found, generating PDF...');
    
    // Generate PDF using the letter data
    const pdfBuffer = await generatePdfFromLetter(letter);

    console.log('PDF generated successfully, size:', pdfBuffer.length);

    // Set response headers
    const headers = new Headers();
    headers.set("Content-Type", "application/pdf");
    headers.set("Content-Disposition", `inline; filename="letter-${id}.pdf"`);

    // Return the PDF
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers,
    });

  } catch (error) {
    console.error("Error generating PDF:", error);
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate PDF" },
      { status: 500 }
    );
  }
} 