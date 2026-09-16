import { NextResponse } from "next/server";
import {
  assertStudentOwnsResource,
  authErrorResponse,
  requireRoles,
} from "@/lib/auth/guards";
import { getDataAccessLayer } from "@/lib/dal";

/**
 * Student reading-records path scaffolding.
 * Students may only list their own records; teachers/admins may pass ?userId=.
 */
export async function GET(request: Request) {
  try {
    const actor = await requireRoles(["student", "teacher", "admin"]);
    const url = new URL(request.url);
    const requestedUserId = url.searchParams.get("userId")?.trim();

    const targetUserId =
      actor.role === "student"
        ? actor.userId
        : requestedUserId || actor.userId;

    assertStudentOwnsResource(actor, targetUserId);

    const dal = getDataAccessLayer();
    const records = await dal.listReadingRecordsByUser(targetUserId);
    const totalPoints = records.reduce((sum, r) => sum + (r.points || 0), 0);

    return NextResponse.json({
      userId: targetUserId,
      records,
      totalPoints,
      count: records.length,
    });
  } catch (err) {
    return authErrorResponse(err);
  }
}
