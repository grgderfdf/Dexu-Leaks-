import pg from "pg";

const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes("localhost") ? false : { rejectUnauthorized: false },
});

export async function setupDatabase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS discord_guild_config (
      guild_id          TEXT PRIMARY KEY,
      welcome_channel_id  TEXT,
      welcome_message     TEXT,
      ticket_category_id  TEXT,
      ticket_staff_role_id TEXT,
      ticket_log_channel_id TEXT,
      ticket_counter      INTEGER NOT NULL DEFAULT 0,
      auto_role_id        TEXT,
      created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS discord_tickets (
      id                SERIAL PRIMARY KEY,
      guild_id          TEXT NOT NULL,
      channel_id        TEXT NOT NULL UNIQUE,
      ticket_number     TEXT NOT NULL,
      opener_user_id    TEXT NOT NULL,
      claimed_by_user_id TEXT,
      status            TEXT NOT NULL DEFAULT 'open',
      created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      closed_at         TIMESTAMPTZ
    );
  `);
  console.log("[DB] Tablas listas.");
}
