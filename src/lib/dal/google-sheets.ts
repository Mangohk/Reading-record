import { google, sheets_v4 } from "googleapis";
import { randomUUID } from "crypto";
import type { DataAccessLayer } from "@/lib/dal/types";
import type {
  CreateReadingRecordInput,
  Profile,
  ReadingRecord,
  Role,
  ScoringSettings,
  UpdateReadingRecordInput,
  User,
  BookLanguage,
} from "@/lib/domain/types";
import {
  DEFAULT_SCORING_SETTINGS,
  SETTINGS_KEYS,
} from "@/lib/domain/types";

const SHEET = {
  users: "Users",
  profiles: "Profiles",
  records: "ReadingRecords",
  settings: "Settings",
} as const;

type SheetsClient = sheets_v4.Sheets;

function requireSpreadsheetId(): string {
  const id = process.env.SPREADSHEET_ID?.trim();
  if (!id) {
    throw new Error(
      "SPREADSHEET_ID is not set. Copy .env.example to .env.local and set the spreadsheet ID.",
    );
  }
  return id;
}

type ServiceAccountCredentials = {
  client_email: string;
  private_key: string;
};

function normalizePrivateKey(raw: string): string {
  // Env files often store newlines as literal \n.
  return raw.replace(/\\n/g, "\n");
}

/**
 * Resolve service-account credentials from env (never invent secrets).
 * Supported (first match wins):
 * 1. GOOGLE_SERVICE_ACCOUNT_JSON — inline JSON string
 * 2. GOOGLE_SERVICE_ACCOUNT_JSON_BASE64 — base64-encoded JSON
 * 3. GOOGLE_SERVICE_ACCOUNT_EMAIL + GOOGLE_PRIVATE_KEY
 * 4. GOOGLE_SERVICE_ACCOUNT_PATH or GOOGLE_APPLICATION_CREDENTIALS — key file path
 */
function loadServiceAccountCredentials():
  | { kind: "json"; credentials: ServiceAccountCredentials }
  | { kind: "file"; keyFile: string } {
  const inlineJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim();
  if (inlineJson) {
    const parsed = JSON.parse(inlineJson) as ServiceAccountCredentials;
    return {
      kind: "json",
      credentials: {
        client_email: parsed.client_email,
        private_key: normalizePrivateKey(parsed.private_key),
      },
    };
  }

  const inlineB64 = process.env.GOOGLE_SERVICE_ACCOUNT_JSON_BASE64?.trim();
  if (inlineB64) {
    const decoded = Buffer.from(inlineB64, "base64").toString("utf8");
    const parsed = JSON.parse(decoded) as ServiceAccountCredentials;
    return {
      kind: "json",
      credentials: {
        client_email: parsed.client_email,
        private_key: normalizePrivateKey(parsed.private_key),
      },
    };
  }

  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.trim();
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.trim();
  if (email && privateKey) {
    return {
      kind: "json",
      credentials: {
        client_email: email,
        private_key: normalizePrivateKey(privateKey),
      },
    };
  }

  const keyFile =
    process.env.GOOGLE_SERVICE_ACCOUNT_PATH?.trim() ||
    process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim();

  if (keyFile) {
    return { kind: "file", keyFile };
  }

  throw new Error(
    "No Google service account configured. Set GOOGLE_SERVICE_ACCOUNT_EMAIL+GOOGLE_PRIVATE_KEY, GOOGLE_SERVICE_ACCOUNT_JSON(_BASE64), or GOOGLE_SERVICE_ACCOUNT_PATH / GOOGLE_APPLICATION_CREDENTIALS (see .env.example).",
  );
}

/** Build an authenticated Sheets API client from env credentials. */
async function createSheetsClient(): Promise<SheetsClient> {
  const scopes = ["https://www.googleapis.com/auth/spreadsheets"];
  const loaded = loadServiceAccountCredentials();

  if (loaded.kind === "json") {
    const auth = new google.auth.GoogleAuth({
      credentials: loaded.credentials,
      scopes,
    });
    return google.sheets({ version: "v4", auth });
  }

  const auth = new google.auth.GoogleAuth({ keyFile: loaded.keyFile, scopes });
  return google.sheets({ version: "v4", auth });
}

function cell(row: string[], index: number): string {
  return (row[index] ?? "").trim();
}

function parseRole(value: string): Role {
  if (value === "student" || value === "teacher" || value === "admin") {
    return value;
  }
  // Unknown / empty — treat as student for storage shape; role resolution may override.
  return "student";
}

function parseLanguage(value: string): BookLanguage {
  return value === "en" ? "en" : "zh";
}

function rowToUser(row: string[]): User {
  return {
    userId: cell(row, 0),
    googleSub: cell(row, 1),
    email: cell(row, 2),
    displayName: cell(row, 3),
    role: parseRole(cell(row, 4)),
  };
}

function userToRow(user: User): string[] {
  return [user.userId, user.googleSub, user.email, user.displayName, user.role];
}

function rowToProfile(row: string[]): Profile {
  return {
    userId: cell(row, 0),
    grade: cell(row, 1),
    classNumber: cell(row, 2),
    updatedAt: cell(row, 3),
  };
}

function profileToRow(profile: Profile): string[] {
  return [profile.userId, profile.grade, profile.classNumber, profile.updatedAt];
}

function rowToRecord(row: string[]): ReadingRecord {
  return {
    recordId: cell(row, 0),
    userId: cell(row, 1),
    title: cell(row, 2),
    author: cell(row, 3),
    language: parseLanguage(cell(row, 4)),
    pageCount: Number(cell(row, 5) || 0),
    summary: cell(row, 6),
    readDate: cell(row, 7),
    points: Number(cell(row, 8) || 0),
    createdAt: cell(row, 9),
  };
}

function recordToRow(record: ReadingRecord): string[] {
  return [
    record.recordId,
    record.userId,
    record.title,
    record.author,
    record.language,
    String(record.pageCount),
    record.summary,
    record.readDate,
    String(record.points),
    record.createdAt,
  ];
}

async function readDataRows(
  sheets: SheetsClient,
  spreadsheetId: string,
  sheetName: string,
  columnRange: string,
): Promise<string[][]> {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${sheetName}!${columnRange}`,
  });
  const values = res.data.values ?? [];
  // Skip header row
  return values.slice(1).map((row) => row.map((c) => String(c ?? "")));
}

async function appendRow(
  sheets: SheetsClient,
  spreadsheetId: string,
  sheetName: string,
  row: string[],
): Promise<void> {
  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${sheetName}!A:Z`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [row] },
  });
}

async function updateRow(
  sheets: SheetsClient,
  spreadsheetId: string,
  sheetName: string,
  /** 1-based sheet row number including header (header = 1). */
  sheetRowNumber: number,
  row: string[],
  endColumn: string,
): Promise<void> {
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${sheetName}!A${sheetRowNumber}:${endColumn}${sheetRowNumber}`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [row] },
  });
}

async function clearRow(
  sheets: SheetsClient,
  spreadsheetId: string,
  sheetName: string,
  sheetRowNumber: number,
  endColumn: string,
): Promise<void> {
  await sheets.spreadsheets.values.clear({
    spreadsheetId,
    range: `${sheetName}!A${sheetRowNumber}:${endColumn}${sheetRowNumber}`,
  });
}

function mapSettings(rows: string[][]): ScoringSettings {
  const map = new Map<string, string>();
  for (const row of rows) {
    const key = cell(row, 0);
    const value = cell(row, 1);
    if (key) map.set(key, value);
  }
  const num = (key: string, fallback: number) => {
    const raw = map.get(key);
    if (raw === undefined || raw === "") return fallback;
    const n = Number(raw);
    return Number.isFinite(n) ? n : fallback;
  };
  return {
    pageThreshold: num(SETTINGS_KEYS.pageThreshold, DEFAULT_SCORING_SETTINGS.pageThreshold),
    pointsZhLow: num(SETTINGS_KEYS.pointsZhLow, DEFAULT_SCORING_SETTINGS.pointsZhLow),
    pointsZhHigh: num(SETTINGS_KEYS.pointsZhHigh, DEFAULT_SCORING_SETTINGS.pointsZhHigh),
    pointsEnLow: num(SETTINGS_KEYS.pointsEnLow, DEFAULT_SCORING_SETTINGS.pointsEnLow),
    pointsEnHigh: num(SETTINGS_KEYS.pointsEnHigh, DEFAULT_SCORING_SETTINGS.pointsEnHigh),
  };
}

/**
 * Google Sheets adapter implementing DataAccessLayer.
 * Spreadsheet ID comes from env (`SPREADSHEET_ID`) — never hardcode secrets.
 */
export class GoogleSheetsDataAccess implements DataAccessLayer {
  private sheetsPromise: Promise<SheetsClient> | null = null;

  private getSheets(): Promise<SheetsClient> {
    if (!this.sheetsPromise) {
      this.sheetsPromise = createSheetsClient();
    }
    return this.sheetsPromise;
  }

  private spreadsheetId(): string {
    return requireSpreadsheetId();
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const sheets = await this.getSheets();
    const rows = await readDataRows(sheets, this.spreadsheetId(), SHEET.users, "A:E");
    const target = email.trim().toLowerCase();
    for (const row of rows) {
      const user = rowToUser(row);
      if (user.email.toLowerCase() === target && user.userId) return user;
    }
    return null;
  }

  async getUserById(userId: string): Promise<User | null> {
    const sheets = await this.getSheets();
    const rows = await readDataRows(sheets, this.spreadsheetId(), SHEET.users, "A:E");
    for (const row of rows) {
      const user = rowToUser(row);
      if (user.userId === userId) return user;
    }
    return null;
  }

  async listUsers(): Promise<User[]> {
    const sheets = await this.getSheets();
    const rows = await readDataRows(sheets, this.spreadsheetId(), SHEET.users, "A:E");
    return rows.map(rowToUser).filter((u) => u.userId);
  }

  async upsertUser(user: User): Promise<User> {
    const sheets = await this.getSheets();
    const id = this.spreadsheetId();
    const rows = await readDataRows(sheets, id, SHEET.users, "A:E");
    const idx = rows.findIndex(
      (r) =>
        rowToUser(r).userId === user.userId ||
        rowToUser(r).email.toLowerCase() === user.email.toLowerCase(),
    );
    const row = userToRow(user);
    if (idx >= 0) {
      await updateRow(sheets, id, SHEET.users, idx + 2, row, "E");
    } else {
      await appendRow(sheets, id, SHEET.users, row);
    }
    return user;
  }

  async getProfile(userId: string): Promise<Profile | null> {
    const sheets = await this.getSheets();
    const rows = await readDataRows(sheets, this.spreadsheetId(), SHEET.profiles, "A:D");
    for (const row of rows) {
      const profile = rowToProfile(row);
      if (profile.userId === userId) return profile;
    }
    return null;
  }

  async upsertProfile(profile: Profile): Promise<Profile> {
    const sheets = await this.getSheets();
    const id = this.spreadsheetId();
    const rows = await readDataRows(sheets, id, SHEET.profiles, "A:D");
    const idx = rows.findIndex((r) => rowToProfile(r).userId === profile.userId);
    const row = profileToRow(profile);
    if (idx >= 0) {
      await updateRow(sheets, id, SHEET.profiles, idx + 2, row, "D");
    } else {
      await appendRow(sheets, id, SHEET.profiles, row);
    }
    return profile;
  }

  async listReadingRecordsByUser(userId: string): Promise<ReadingRecord[]> {
    const sheets = await this.getSheets();
    const rows = await readDataRows(sheets, this.spreadsheetId(), SHEET.records, "A:J");
    return rows
      .map(rowToRecord)
      .filter((r) => r.recordId && r.userId === userId);
  }

  async getReadingRecord(recordId: string): Promise<ReadingRecord | null> {
    const sheets = await this.getSheets();
    const rows = await readDataRows(sheets, this.spreadsheetId(), SHEET.records, "A:J");
    for (const row of rows) {
      const record = rowToRecord(row);
      if (record.recordId === recordId) return record;
    }
    return null;
  }

  async createReadingRecord(input: CreateReadingRecordInput): Promise<ReadingRecord> {
    const sheets = await this.getSheets();
    const record: ReadingRecord = {
      recordId: randomUUID(),
      userId: input.userId,
      title: input.title,
      author: input.author,
      language: input.language,
      pageCount: input.pageCount,
      summary: input.summary,
      readDate: input.readDate,
      points: input.points,
      createdAt: new Date().toISOString(),
    };
    await appendRow(sheets, this.spreadsheetId(), SHEET.records, recordToRow(record));
    return record;
  }

  async updateReadingRecord(
    recordId: string,
    patch: UpdateReadingRecordInput,
  ): Promise<ReadingRecord> {
    const sheets = await this.getSheets();
    const id = this.spreadsheetId();
    const rows = await readDataRows(sheets, id, SHEET.records, "A:J");
    const idx = rows.findIndex((r) => rowToRecord(r).recordId === recordId);
    if (idx < 0) {
      throw new Error(`Reading record not found: ${recordId}`);
    }
    const current = rowToRecord(rows[idx]!);
    const next: ReadingRecord = {
      ...current,
      title: patch.title ?? current.title,
      author: patch.author ?? current.author,
      language: patch.language ?? current.language,
      pageCount: patch.pageCount ?? current.pageCount,
      summary: patch.summary ?? current.summary,
      readDate: patch.readDate ?? current.readDate,
      // Only update points when explicitly provided (e.g. teacher adjust).
      // Never bulk-recalculate from Settings.
      points: patch.points ?? current.points,
    };
    await updateRow(sheets, id, SHEET.records, idx + 2, recordToRow(next), "J");
    return next;
  }

  async deleteReadingRecord(recordId: string): Promise<void> {
    const sheets = await this.getSheets();
    const id = this.spreadsheetId();
    const rows = await readDataRows(sheets, id, SHEET.records, "A:J");
    const idx = rows.findIndex((r) => rowToRecord(r).recordId === recordId);
    if (idx < 0) {
      throw new Error(`Reading record not found: ${recordId}`);
    }
    // Clear cells (MVP). A later pass can use batchUpdate to delete the row.
    await clearRow(sheets, id, SHEET.records, idx + 2, "J");
  }

  async getSettings(): Promise<ScoringSettings> {
    const sheets = await this.getSheets();
    const rows = await readDataRows(sheets, this.spreadsheetId(), SHEET.settings, "A:B");
    if (rows.length === 0) {
      return { ...DEFAULT_SCORING_SETTINGS };
    }
    return mapSettings(rows);
  }

  async updateSettings(partial: Partial<ScoringSettings>): Promise<ScoringSettings> {
    const current = await this.getSettings();
    const next: ScoringSettings = { ...current, ...partial };
    const sheets = await this.getSheets();
    const id = this.spreadsheetId();

    const pairs: [string, string][] = [
      [SETTINGS_KEYS.pageThreshold, String(next.pageThreshold)],
      [SETTINGS_KEYS.pointsZhLow, String(next.pointsZhLow)],
      [SETTINGS_KEYS.pointsZhHigh, String(next.pointsZhHigh)],
      [SETTINGS_KEYS.pointsEnLow, String(next.pointsEnLow)],
      [SETTINGS_KEYS.pointsEnHigh, String(next.pointsEnHigh)],
    ];

    // Read existing keys to update in place when possible
    const existing = await readDataRows(sheets, id, SHEET.settings, "A:B");
    const keyToRow = new Map<string, number>();
    existing.forEach((row, i) => {
      const key = cell(row, 0);
      if (key) keyToRow.set(key, i);
    });

    for (const [key, value] of pairs) {
      const existingIdx = keyToRow.get(key);
      if (existingIdx !== undefined) {
        await updateRow(sheets, id, SHEET.settings, existingIdx + 2, [key, value], "B");
      } else {
        await appendRow(sheets, id, SHEET.settings, [key, value]);
      }
    }

    return next;
  }
}
