import { NextResponse } from "next/server";
import { getDataAccessLayer } from "@/lib/dal";
import { BOOTSTRAP_ADMIN_EMAIL } from "@/lib/auth/roles";

/**
 * Health / connectivity probe.
 * With a shared service account, GET /api/health returns Settings from the sheet.
 * Without credentials, returns configuration status (no invented secrets).
 */
export async function GET() {
  const spreadsheetIdSet = Boolean(process.env.SPREADSHEET_ID?.trim());
  const hasInlineJson = Boolean(process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim());
  const hasKeyPath = Boolean(
    process.env.GOOGLE_SERVICE_ACCOUNT_PATH?.trim() ||
      process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim(),
  );

  const base = {
    ok: true,
    app: "reading-record",
    bootstrapAdminEmail: BOOTSTRAP_ADMIN_EMAIL,
    spreadsheetIdConfigured: spreadsheetIdSet,
    serviceAccountConfigured: hasInlineJson || hasKeyPath,
    dataStore: process.env.DATA_STORE ?? "sheets",
  };

  if (!spreadsheetIdSet || (!hasInlineJson && !hasKeyPath)) {
    return NextResponse.json({
      ...base,
      sheets: {
        reachable: false,
        reason:
          "Missing SPREADSHEET_ID and/or service account credentials. See .env.example.",
      },
    });
  }

  try {
    const dal = getDataAccessLayer();
    const settings = await dal.getSettings();
    return NextResponse.json({
      ...base,
      sheets: { reachable: true, settings },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown Sheets error";
    return NextResponse.json(
      {
        ...base,
        ok: false,
        sheets: { reachable: false, reason: message },
      },
      { status: 503 },
    );
  }
}
