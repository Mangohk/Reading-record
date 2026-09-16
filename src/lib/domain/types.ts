/**
 * Domain types for the student reading record MVP.
 * Matches Google Sheets schema in Project PRD (Users / Profiles / ReadingRecords / Settings).
 */

export type Role = "student" | "teacher" | "admin";

export type BookLanguage = "zh" | "en";

export interface User {
  userId: string;
  googleSub: string;
  email: string;
  displayName: string;
  role: Role;
}

export interface Profile {
  userId: string;
  grade: string;
  classNumber: string;
  updatedAt: string;
}

export interface ReadingRecord {
  recordId: string;
  userId: string;
  title: string;
  author: string;
  language: BookLanguage;
  pageCount: number;
  summary: string;
  readDate: string;
  /** Frozen at save time — never recalculated when Settings change. */
  points: number;
  createdAt: string;
}

export interface CreateReadingRecordInput {
  userId: string;
  title: string;
  author: string;
  language: BookLanguage;
  pageCount: number;
  summary: string;
  readDate: string;
  points: number;
}

export interface UpdateReadingRecordInput {
  title?: string;
  author?: string;
  language?: BookLanguage;
  pageCount?: number;
  summary?: string;
  readDate?: string;
  /** Only set when creating/adjusting a record; do not bulk-recalculate. */
  points?: number;
}

export interface ScoringSettings {
  pageThreshold: number;
  pointsZhLow: number;
  pointsZhHigh: number;
  pointsEnLow: number;
  pointsEnHigh: number;
}

export const DEFAULT_SCORING_SETTINGS: ScoringSettings = {
  pageThreshold: 30,
  pointsZhLow: 10,
  pointsZhHigh: 30,
  pointsEnLow: 30,
  pointsEnHigh: 50,
};

/** Settings keys as stored in the Settings sheet (key / value). */
export const SETTINGS_KEYS = {
  pageThreshold: "page_threshold",
  pointsZhLow: "points_zh_low",
  pointsZhHigh: "points_zh_high",
  pointsEnLow: "points_en_low",
  pointsEnHigh: "points_en_high",
} as const;
