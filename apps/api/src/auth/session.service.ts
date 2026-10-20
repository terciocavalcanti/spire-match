import { createHash, randomBytes } from "node:crypto";

import { Inject, Injectable } from "@nestjs/common";
import { and, eq, gt, isNull } from "drizzle-orm";

import type { Database } from "../database/client";
import { DATABASE } from "../database/database.module";
import { userSessions } from "../database/schema";

export interface CreatedSession {
  rawToken: string;
  expiresAt: Date;
}

function hashToken(rawToken: string): string {
  return createHash("sha256").update(rawToken).digest("hex");
}

@Injectable()
export class SessionService {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async create(
    userId: string,
    ttlDays: number,
    meta: { userAgent?: string; ipAddress?: string } = {},
  ): Promise<CreatedSession> {
    const rawToken = randomBytes(32).toString("base64url");
    const expiresAt = new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000);

    await this.db.insert(userSessions).values({
      userId,
      sessionTokenHash: hashToken(rawToken),
      userAgent: meta.userAgent,
      ipAddress: meta.ipAddress,
      expiresAt,
    });

    return { rawToken, expiresAt };
  }

  async findUserIdByToken(rawToken: string): Promise<string | null> {
    const tokenHash = hashToken(rawToken);
    const [session] = await this.db
      .select({ userId: userSessions.userId, expiresAt: userSessions.expiresAt })
      .from(userSessions)
      .where(
        and(
          eq(userSessions.sessionTokenHash, tokenHash),
          isNull(userSessions.revokedAt),
          gt(userSessions.expiresAt, new Date()),
        ),
      )
      .limit(1);

    return session?.userId ?? null;
  }

  async revoke(rawToken: string): Promise<void> {
    const tokenHash = hashToken(rawToken);
    await this.db
      .update(userSessions)
      .set({ revokedAt: new Date() })
      .where(eq(userSessions.sessionTokenHash, tokenHash));
  }
}
