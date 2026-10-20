import { Inject, Injectable } from "@nestjs/common";
import type { CreateInteractionRequest } from "@spire/contracts";

import type { Database } from "../database/client";
import { DATABASE } from "../database/database.module";
import { userInteractions } from "../database/schema";

@Injectable()
export class InteractionsService {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async record(userId: string, payload: CreateInteractionRequest): Promise<void> {
    await this.db.insert(userInteractions).values({
      userId,
      propertyId: payload.propertyId,
      type: payload.type,
    });
  }
}
