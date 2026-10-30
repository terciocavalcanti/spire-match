import { randomInt } from "node:crypto";

import { ConflictException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import type { AdminUser, AdminUserListQuery, CreateAdminUserRequest, CreateAdminUserResponse, Role } from "@spire/contracts";
import { STAFF_ROLES } from "@spire/contracts";
import { and, eq, ilike, inArray, or } from "drizzle-orm";

import { PasswordService } from "../auth/password.service";
import { SessionService } from "../auth/session.service";
import type { Database } from "../database/client";
import { DATABASE } from "../database/database.module";
import { roleAssignments, roles, users } from "../database/schema";

import { toAdminUser } from "./admin-user-mapper";

const ADMIN_ACCESS_ROLES: Role[] = ["ADMIN", "SUPER_ADMIN"];
const ALPHANUMERIC = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789"; // sem 0/O/1/I/l — evita confusão ao digitar

function generateTemporaryPassword(): string {
  const chars = Array.from({ length: 14 }, () => ALPHANUMERIC[randomInt(ALPHANUMERIC.length)]);
  // `passwordSchema` exige letra + número — garantido por construção, não só por acaso.
  chars.push("23456789"[randomInt(8)]!, "abcdefghjkmnpqrstuvwxyz"[randomInt(23)]!);
  for (let i = chars.length - 1; i > 0; i -= 1) {
    const j = randomInt(i + 1);
    [chars[i], chars[j]] = [chars[j]!, chars[i]!];
  }
  return chars.join("");
}

function decodeCursor(cursor: string | undefined): number {
  if (!cursor) return 0;
  const decoded = Number(Buffer.from(cursor, "base64url").toString("utf8"));
  return Number.isFinite(decoded) && decoded >= 0 ? decoded : 0;
}

function encodeCursor(offset: number): string {
  return Buffer.from(String(offset), "utf8").toString("base64url");
}

@Injectable()
export class AdminUsersService {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    private readonly passwords: PasswordService,
    private readonly sessions: SessionService,
  ) {}

  private async rolesForUser(userId: string): Promise<Role[]> {
    const rows = await this.db
      .select({ name: roles.name })
      .from(roleAssignments)
      .innerJoin(roles, eq(roles.id, roleAssignments.roleId))
      .where(eq(roleAssignments.userId, userId));
    return rows.map((r) => r.name);
  }

  async list(query: AdminUserListQuery): Promise<{ items: AdminUser[]; nextCursor: string | null }> {
    const offset = decodeCursor(query.cursor);

    const staffUserIds = await this.db
      .selectDistinct({ userId: roleAssignments.userId })
      .from(roleAssignments)
      .innerJoin(roles, eq(roles.id, roleAssignments.roleId))
      .where(inArray(roles.name, STAFF_ROLES));
    const ids = staffUserIds.map((r) => r.userId);
    if (ids.length === 0) return { items: [], nextCursor: null };

    const conditions = [inArray(users.id, ids)];
    if (query.q) {
      conditions.push(or(ilike(users.name, `%${query.q}%`), ilike(users.email, `%${query.q}%`))!);
    }

    const rows = await this.db
      .select()
      .from(users)
      .where(and(...conditions))
      .orderBy(users.createdAt)
      .limit(query.limit + 1)
      .offset(offset);

    const hasMore = rows.length > query.limit;
    const pageRows = hasMore ? rows.slice(0, query.limit) : rows;

    const items = await Promise.all(
      pageRows.map(async (row) => toAdminUser(row, await this.rolesForUser(row.id))),
    );

    return { items, nextCursor: hasMore ? encodeCursor(offset + query.limit) : null };
  }

  async create(request: CreateAdminUserRequest): Promise<CreateAdminUserResponse> {
    const [existing] = await this.db.select({ id: users.id }).from(users).where(eq(users.email, request.email)).limit(1);
    if (existing) throw new ConflictException({ code: "EMAIL_ALREADY_REGISTERED", message: "Já existe uma conta com este e-mail" });

    const temporaryPassword = generateTemporaryPassword();
    const passwordHash = await this.passwords.hash(temporaryPassword);

    const [created] = await this.db
      .insert(users)
      .values({ name: request.name, email: request.email, passwordHash, mustChangePassword: true })
      .returning();
    if (!created) throw new Error("Falha ao criar usuário");

    const roleRows = await this.db.select().from(roles).where(inArray(roles.name, request.roles));
    if (roleRows.length > 0) {
      await this.db.insert(roleAssignments).values(roleRows.map((r) => ({ userId: created.id, roleId: r.id })));
    }

    return { ...toAdminUser(created, request.roles), temporaryPassword };
  }

  async updateRoles(id: string, requestedRoles: Role[]): Promise<AdminUser> {
    const [user] = await this.db.select().from(users).where(eq(users.id, id)).limit(1);
    if (!user) throw new NotFoundException({ code: "USER_NOT_FOUND", message: "Usuário não encontrado" });

    const current = await this.rolesForUser(id);
    const removingAdminAccess =
      current.some((r) => ADMIN_ACCESS_ROLES.includes(r)) && !requestedRoles.some((r) => ADMIN_ACCESS_ROLES.includes(r));
    if (removingAdminAccess) {
      await this.assertNotLastAdmin(id);
    }

    const roleRows = await this.db.select().from(roles).where(inArray(roles.name, requestedRoles));
    await this.db.delete(roleAssignments).where(eq(roleAssignments.userId, id));
    if (roleRows.length > 0) {
      await this.db.insert(roleAssignments).values(roleRows.map((r) => ({ userId: id, roleId: r.id })));
    }

    return toAdminUser(user, requestedRoles);
  }

  /** Impede remover o acesso admin da última conta ADMIN/SUPER_ADMIN restante — travaria o painel sem ninguém para reabrir. */
  private async assertNotLastAdmin(excludingUserId: string): Promise<void> {
    const admins = await this.db
      .selectDistinct({ userId: roleAssignments.userId })
      .from(roleAssignments)
      .innerJoin(roles, eq(roles.id, roleAssignments.roleId))
      .where(inArray(roles.name, ADMIN_ACCESS_ROLES));

    const remaining = admins.filter((a) => a.userId !== excludingUserId);
    if (remaining.length === 0) {
      throw new ConflictException({
        code: "LAST_ADMIN_PROTECTED",
        message: "Não é possível remover o acesso admin da última conta ADMIN/SUPER_ADMIN",
      });
    }
  }

  async revokeSessions(id: string): Promise<void> {
    const [user] = await this.db.select({ id: users.id }).from(users).where(eq(users.id, id)).limit(1);
    if (!user) throw new NotFoundException({ code: "USER_NOT_FOUND", message: "Usuário não encontrado" });
    await this.sessions.revokeAllForUser(id);
  }

  async setStatus(id: string, status: "ACTIVE" | "SUSPENDED"): Promise<AdminUser> {
    const [row] = await this.db.update(users).set({ status, updatedAt: new Date() }).where(eq(users.id, id)).returning();
    if (!row) throw new NotFoundException({ code: "USER_NOT_FOUND", message: "Usuário não encontrado" });
    if (status === "SUSPENDED") await this.sessions.revokeAllForUser(id);
    return toAdminUser(row, await this.rolesForUser(id));
  }
}
