/**
 * snapcommit_open_billing  — return the user's Dodo customer-portal URL
 * snapcommit_delete_account — start the email-confirmation deletion flow
 *
 * Both round-trip through our cloud worker, which holds the Dodo customer_id
 * and can sign a confirmation token tied to the user.
 */
import { z } from "zod";
import { readConfig, writeConfig } from "../config.js";

const API_BASE = process.env.SNAPCOMMIT_API ?? "https://api.snapcommit.com";

// ────────────────────────────────────────────────────────────────────────────
// snapcommit_open_billing
// ────────────────────────────────────────────────────────────────────────────

export function openBilling() {
  return async () => {
    const cfg = readConfig();
    if (!cfg.apiToken) {
      return {
        content: [
          {
            type: "text" as const,
            text: "Not signed in. Use snapcommit_login first, then this command will return your billing portal URL.",
          },
        ],
        isError: true,
      };
    }
    try {
      const res = await fetch(`${API_BASE}/v1/account/portal`, {
        method: "POST",
        headers: { authorization: `Bearer ${cfg.apiToken}` },
      });
      if (!res.ok) {
        return {
          content: [
            { type: "text" as const, text: `Couldn't generate portal link (${res.status}). Try snapcommit.com/account directly.` },
          ],
          isError: true,
        };
      }
      const { url } = (await res.json()) as { url: string };
      return {
        content: [
          {
            type: "text" as const,
            text: [
              `Open this URL in your browser to manage billing, upgrade, downgrade, or cancel:`,
              ``,
              url,
              ``,
              `From the portal you can:`,
              `  • Update payment method`,
              `  • Change subscription tier`,
              `  • Cancel subscription (you keep Pro until end of billing cycle)`,
              `  • Download invoices`,
            ].join("\n"),
          },
        ],
      };
    } catch (e) {
      return {
        content: [
          { type: "text" as const, text: `Couldn't reach Snapcommit cloud (${(e as Error).message}). Try snapcommit.com/account directly.` },
        ],
        isError: true,
      };
    }
  };
}

// ────────────────────────────────────────────────────────────────────────────
// snapcommit_delete_account
// ────────────────────────────────────────────────────────────────────────────

export const deleteAccountSchema = {
  confirm: z
    .literal("I understand this deletes my Snapcommit account")
    .optional()
    .describe(
      "Pass this exact phrase to skip the email-confirmation step. Without it, we send a confirmation email and you must click the link within 24h.",
    ),
};

export function deleteAccount() {
  return async (args: { confirm?: string }) => {
    const cfg = readConfig();
    if (!cfg.apiToken) {
      return {
        content: [
          {
            type: "text" as const,
            text: "Not signed in. You don't have a cloud account to delete. Local memories remain at the storage path you've configured — delete that file yourself if you want.",
          },
        ],
      };
    }

    const phrase = "I understand this deletes my Snapcommit account";

    try {
      const res = await fetch(`${API_BASE}/v1/account/delete`, {
        method: "POST",
        headers: {
          authorization: `Bearer ${cfg.apiToken}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({ confirm: args.confirm === phrase }),
      });

      if (!res.ok) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Couldn't process deletion (${res.status}). Contact hello@snapcommit.com — we'll process it by hand.`,
            },
          ],
          isError: true,
        };
      }

      const body = (await res.json()) as { state: "email_sent" | "deleted" };

      if (body.state === "email_sent") {
        return {
          content: [
            {
              type: "text" as const,
              text: [
                `Confirmation email sent.`,
                ``,
                `What will get deleted (on our servers):`,
                `  • Your account row (email, token)`,
                `  • Usage history`,
                `  • Extraction-log metadata`,
                ``,
                `What does NOT get deleted (yours forever):`,
                `  • Memories at ${cfg.storagePath ?? "~/.snapcommit-mcp/memories.db"}`,
                `  • Cloud-synced copies (iCloud / Dropbox / Notion)`,
                `  • The MCP server itself (still works in Free mode)`,
                ``,
                `Click the link in the email within 24 hours to confirm. After that, nothing happens automatically.`,
              ].join("\n"),
            },
          ],
        };
      }

      // Immediate delete (confirm phrase provided)
      writeConfig({
        apiToken: undefined,
        tier: undefined,
        monthlyQuota: undefined,
        tierVerifiedAt: undefined,
      });
      return {
        content: [
          {
            type: "text" as const,
            text: [
              `Account deleted.`,
              ``,
              `Local memories at ${cfg.storagePath ?? "~/.snapcommit-mcp/memories.db"} are untouched — you own them.`,
              `Snapcommit MCP still works in Free mode. Sign up again anytime.`,
            ].join("\n"),
          },
        ],
      };
    } catch (e) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Couldn't reach Snapcommit cloud (${(e as Error).message}). Try again later or email hello@snapcommit.com.`,
          },
        ],
        isError: true,
      };
    }
  };
}
