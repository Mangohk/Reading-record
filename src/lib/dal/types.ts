import type {
  CreateReadingRecordInput,
  Profile,
  ReadingRecord,
  ScoringSettings,
  UpdateReadingRecordInput,
  User,
} from "@/lib/domain/types";

/**
 * Data Access Layer — business / UI code must depend only on this interface.
 * First adapter: Google Sheets. Later: Firebase (same methods, different impl).
 */
export interface DataAccessLayer {
  // Users
  getUserByEmail(email: string): Promise<User | null>;
  getUserById(userId: string): Promise<User | null>;
  listUsers(): Promise<User[]>;
  upsertUser(user: User): Promise<User>;

  // Profiles
  getProfile(userId: string): Promise<Profile | null>;
  upsertProfile(profile: Profile): Promise<Profile>;

  // Reading records
  listReadingRecordsByUser(userId: string): Promise<ReadingRecord[]>;
  getReadingRecord(recordId: string): Promise<ReadingRecord | null>;
  createReadingRecord(input: CreateReadingRecordInput): Promise<ReadingRecord>;
  updateReadingRecord(
    recordId: string,
    patch: UpdateReadingRecordInput,
  ): Promise<ReadingRecord>;
  deleteReadingRecord(recordId: string): Promise<void>;

  // Settings (scoring params — old record points are never recalculated)
  getSettings(): Promise<ScoringSettings>;
  updateSettings(settings: Partial<ScoringSettings>): Promise<ScoringSettings>;
}
