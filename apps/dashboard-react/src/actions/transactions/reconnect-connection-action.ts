"use server";

import { LogEvents } from "eventbus/events";
import type { ReconnectConnectionPayload } from "jobs/schema";
import { tasks } from "@trigger.dev/sdk";
import { z } from "zod";
import { authActionClient } from "@/actions/safe-action";

export const reconnectConnectionAction = authActionClient
  .schema(
    z.object({
      connectionId: z.string(),
      provider: z.string(),
    }),
  )
  .metadata({
    name: "reconnect-connection",
    track: {
      event: LogEvents.ReconnectConnection.name,
      channel: LogEvents.ReconnectConnection.channel,
    },
  })
  .action(
    async ({ parsedInput: { connectionId, provider }, ctx: { businessId } }) => {
      const event = await tasks.trigger("reconnect-connection", {
        teamId: businessId!,
        connectionId,
        provider,
      } satisfies ReconnectConnectionPayload);

      return event;
    },
  );
