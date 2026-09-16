import { NextResponse } from "next/server";
import {
  authErrorResponse,
  requireRoles,
} from "@/lib/auth/guards";
import { getDataAccessLayer } from "@/lib/dal";

/** Read scoring Settings via DAL — any signed-in role (needed for scoring UI). */
export async function GET() {
  try {
    await requireRoles(["student", "teacher", "admin"]);
    const dal = getDataAccessLayer();
    const settings = await dal.getSettings();
    return NextResponse.json({ settings });
  } catch (err) {
    return authErrorResponse(err);
  }
}
