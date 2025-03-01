import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { db } from "~/server/db";

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

    // Return the letter data
    return NextResponse.json({
      success: true,
      letter,
    });
  } catch (error) {
    console.error("Error fetching letter:", error);
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : "Failed to fetch letter" 
      },
      { status: 500 }
    );
  }
}