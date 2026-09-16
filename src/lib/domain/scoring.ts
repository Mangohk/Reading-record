import type { BookLanguage, ScoringSettings } from "@/lib/domain/types";
import { DEFAULT_SCORING_SETTINGS } from "@/lib/domain/types";

/**
 * Compute points from current Settings at save time.
 * Callers must persist the result on the record; changing Settings later
 * must NOT recalculate existing records.
 */
export function calculatePoints(
  language: BookLanguage,
  pageCount: number,
  settings: ScoringSettings = DEFAULT_SCORING_SETTINGS,
): number {
  const isLow = pageCount <= settings.pageThreshold;
  if (language === "zh") {
    return isLow ? settings.pointsZhLow : settings.pointsZhHigh;
  }
  return isLow ? settings.pointsEnLow : settings.pointsEnHigh;
}
