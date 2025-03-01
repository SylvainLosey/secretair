import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { db } from "~/server/db";
import { generatePDF } from "~/utils/pdf-generator";

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const requestData = await request.json() as { id?: string };
    const letterId = requestData.id;
    
    if (!letterId) {
      return NextResponse.json(
        { success: false, message: "Letter ID is required" },
        { status: 400 }
      );
    }

    // Fetch the letter from the database
    const letter = await db.letter.findUnique({
      where: { id: letterId },
    });

    if (!letter) {
      return NextResponse.json(
        { success: false, message: "Letter not found" },
        { status: 404 }
      );
    }

    // Generate the PDF
    const { pdfBytes, fileName } = await generatePDF(letter);

    // Return the PDF as base64
    return NextResponse.json({
      success: true,
      pdfBytes,
      fileName,
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