import { NextResponse } from "next/server";
import { getDataAccessLayer } from "@/lib/dal";
import { BOOTSTRAP_ADMIN_EMAIL } from "@/lib/auth/roles";
import {
  hasGoogleOAuthConfigured,
  hasServiceAccountConfigured,
} from "@/lib/auth/credentials";

/**
 * Health / connectivity probe (public).
 * With a shared service account, returns Settings from the sheet.
 * Without credentials, returns configuration status (no invented secrets).
 */
export async function GET() {
  const spreadsheetIdSet = Boolean(process.env.SPREADSHEET_ID?.trim());
  const serviceAccountConfigured = hasServiceAccountConfigured();
  const oauthConfigured = hasGoogleOAuthConfigured();

  const base = {
    ok: true,
    app: "reading-record",
    bootstrapAdminEmail: BOOTSTRAP_ADMIN_EMAIL,
    spreadsheetIdConfigured: spreadsheetIdSet,
    serviceAccountConfigured,
    oauthConfigured,
    dataStore: process.env.DATA_STORE ?? "sheets",
  };

  if (!spreadsheetIdSet || !serviceAccountConfigured) {
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
