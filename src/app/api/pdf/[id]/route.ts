import { db } from "~/server/db";
import { NextRequest, NextResponse } from "next/server";
import { generatePdfFromLetter } from "~/utils/pdf-generator";

export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  const id = context.params.id;

  try {
    // Fetch the letter from the database
    const letter = await db.letter.findUnique({
      where: { id },
    });

    if (!letter) {
      return NextResponse.json(
        { error: "Letter not found" },
        { status: 404 }
      );
    }

    // Generate PDF using the consolidated function
    const pdfBuffer = await generatePdfFromLetter(letter);

    // Set response headers
    const headers = new Headers();
    headers.set("Content-Type", "application/pdf");
    headers.set("Content-Disposition", `attachment; filename="letter-${id}.pdf"`);

    // Return the PDF
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers,
    });

  } catch (error) {
    console.error("Error generating PDF:", error);
    
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 }
    );
  }
} 