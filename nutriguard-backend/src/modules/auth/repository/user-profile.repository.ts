import { eq } from 'drizzle-orm';
import { db, type Database } from '@database/client.js';
import { userProfiles, userSettings, type NewUserProfile } from '@database/schema/index.js';
import { DatabaseError } from '@shared/errors/app-error.js';

/**
 * Repository pattern: this is the ONLY place in the codebase that issues
 * Drizzle queries against `user_profiles`/`user_settings`. Services never
 * import `db`/`schema` directly — they call this repository, which keeps
 * the query surface centralized, mockable in unit tests, and easy to
 * later swap (e.g. add a read-replica) without touching business logic.
 */
export class UserProfileRepository {
  constructor(private readonly database: Database = db) {}

  async create(profile: NewUserProfile): Promise<void> {
    try {
      await this.database.insert(userProfiles).values(profile);
      await this.database.insert(userSettings).values({ userId: profile.id });
    } catch (err) {
      throw new DatabaseError('Failed to create user profile', undefined, err);
    }
  }

  async findById(userId: string) {
    try {
      const [profile] = await this.database.select().from(userProfiles).where(eq(userProfiles.id, userId)).limit(1);
      return profile ?? null;
    } catch (err) {
      throw new DatabaseError('Failed to fetch user profile', undefined, err);
    }
  }

  async findByIdWithSettings(userId: string) {
    try {
      const [row] = await this.database
        .select({ profile: userProfiles, settings: userSettings })
        .from(userProfiles)
        .leftJoin(userSettings, eq(userSettings.userId, userProfiles.id))
        .where(eq(userProfiles.id, userId))
        .limit(1);
      return row ?? null;
    } catch (err) {
      throw new DatabaseError('Failed to fetch user profile with settings', undefined, err);
    }
  }

  async updateProfile(userId: string, changes: Partial<Pick<NewUserProfile, 'fullName' | 'avatarUrl' | 'countryCode'>>): Promise<void> {
    try {
      await this.database
        .update(userProfiles)
        .set({ ...changes, updatedAt: new Date() })
        .where(eq(userProfiles.id, userId));
    } catch (err) {
      throw new DatabaseError('Failed to update user profile', undefined, err);
    }
  }
}

export const userProfileRepository = new UserProfileRepository();
