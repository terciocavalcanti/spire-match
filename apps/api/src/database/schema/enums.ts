import { CONSENT_PURPOSES, ROLES } from "@spire/contracts";
import { pgEnum } from "drizzle-orm/pg-core";


// Mantido em sincronia com @spire/contracts (fonte única de verdade dos enums de domínio).
export const roleNameEnum = pgEnum("role_name", ROLES);
export const consentPurposeEnum = pgEnum("consent_purpose", CONSENT_PURPOSES);
export const userStatusEnum = pgEnum("user_status", ["ACTIVE", "SUSPENDED", "DELETED"]);
