import { NextResponse } from "next/server";
import { ensureSeedData } from "@/lib/seed";

export async function POST() {
  try {
    await ensureSeedData();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Seed API error:", error);
    return NextResponse.json(
      { error: "Failed to seed data" },
      { status: 500 }
    );
  }
}
