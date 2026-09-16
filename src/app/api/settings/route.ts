import { NextResponse } from "next/server";
import { getDataAccessLayer } from "@/lib/dal";

/** Read scoring Settings via DAL (Sheets adapter). */
export async function GET() {
  try {
    const dal = getDataAccessLayer();
    const settings = await dal.getSettings();
    return NextResponse.json({ settings });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load settings";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
