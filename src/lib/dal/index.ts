import type { DataAccessLayer } from "@/lib/dal/types";
import { GoogleSheetsDataAccess } from "@/lib/dal/google-sheets";

/**
 * Factory for the active Data Access Layer.
 * MVP: Google Sheets. Later: switch to Firebase via DATA_STORE env (or similar).
 */
export function getDataAccessLayer(): DataAccessLayer {
  const store = (process.env.DATA_STORE ?? "sheets").toLowerCase();

  switch (store) {
    case "sheets":
      return new GoogleSheetsDataAccess();
    case "firebase":
      // Placeholder — Firebase adapter lands after MVP Sheets path is stable.
      throw new Error(
        "Firebase DAL adapter is not implemented yet. Set DATA_STORE=sheets.",
      );
    default:
      throw new Error(`Unknown DATA_STORE="${store}". Use "sheets".`);
  }
}
