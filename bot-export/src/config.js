import { pool } from "./db.js";

export async function getGuildConfig(guildId) {
  const { rows } = await pool.query(
    "SELECT * FROM discord_guild_config WHERE guild_id = $1",
    [guildId],
  );
  return rows[0] ?? null;
}

export async function upsertGuildConfig(guildId, values) {
  const fields = Object.keys(values);
  if (fields.length === 0) return;

  const colMap = {
    welcomeChannelId: "welcome_channel_id",
    welcomeMessage: "welcome_message",
    ticketCategoryId: "ticket_category_id",
    ticketStaffRoleId: "ticket_staff_role_id",
    ticketLogChannelId: "ticket_log_channel_id",
    ticketCounter: "ticket_counter",
    autoRoleId: "auto_role_id",
  };

  const setCols = fields.map((f) => colMap[f]).filter(Boolean);
  const setVals = fields.map((f) => values[f]);

  const setClause = setCols.map((col, i) => `${col} = $${i + 2}`).join(", ");
  const insertCols = ["guild_id", ...setCols].join(", ");
  const insertPlaceholders = Array.from({ length: setCols.length + 1 }, (_, i) => `$${i + 1}`).join(", ");

  await pool.query(
    `INSERT INTO discord_guild_config (${insertCols})
     VALUES (${insertPlaceholders})
     ON CONFLICT (guild_id) DO UPDATE SET ${setClause}, updated_at = NOW()`,
    [guildId, ...setVals],
  );
}

export async function nextTicketNumber(guildId) {
  const config = await getGuildConfig(guildId);
  const next = (config?.ticket_counter ?? 0) + 1;
  await upsertGuildConfig(guildId, { ticketCounter: next });
  return next;
}
