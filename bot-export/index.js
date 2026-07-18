import "dotenv/config";
import { Client, Events, GatewayIntentBits } from "discord.js";
import { setupDatabase } from "./src/db.js";
import { commands } from "./src/commands.js";
import { handleInteraction } from "./src/interactions.js";
import { handleGuildMemberAdd } from "./src/welcome.js";

const token = process.env.DISCORD_BOT_TOKEN;
if (!token) {
  console.error("❌ Falta DISCORD_BOT_TOKEN en el archivo .env");
  process.exit(1);
}
if (!process.env.DATABASE_URL) {
  console.error("❌ Falta DATABASE_URL en el archivo .env");
  process.exit(1);
}

await setupDatabase();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages,
  ],
});

async function registerCommandsForGuild(guildId) {
  try {
    const guild = await client.guilds.fetch(guildId);
    await guild.commands.set(commands);
    console.log(`[Comandos] Registrados en servidor: ${guild.name}`);
  } catch (err) {
    console.error(`[Comandos] Error registrando en ${guildId}: ${err.message}`);
  }
}

client.once(Events.ClientReady, async (ready) => {
  console.log(`✅ Bot conectado como: ${ready.user.tag}`);
  console.log(`📡 Servidores: ${ready.guilds.cache.size}`);
  for (const guildId of ready.guilds.cache.keys()) {
    await registerCommandsForGuild(guildId);
  }
});

client.on(Events.GuildCreate, async (guild) => {
  await registerCommandsForGuild(guild.id);
});

client.on(Events.GuildMemberAdd, (member) => {
  console.log(`[MemberAdd] Nuevo miembro: ${member.user.tag} en ${member.guild.name}`);
  handleGuildMemberAdd(member).catch((err) =>
    console.error(`[MemberAdd] Error: ${err.message}`),
  );
});

client.on(Events.InteractionCreate, (interaction) => {
  handleInteraction(interaction).catch((err) =>
    console.error(`[Interaction] Error: ${err.message}`),
  );
});

client.on(Events.Error, (err) => {
  console.error(`[Discord] Error: ${err.message}`);
});

client.login(token);

