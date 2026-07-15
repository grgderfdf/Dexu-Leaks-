import { EmbedBuilder } from "discord.js";
import { getGuildConfig } from "./config.js";

const DEFAULT_WELCOME_MESSAGE =
  "¡Bienvenido/a {usuario} a **{servidor}**! Nos alegra tenerte por aquí.";
const DEFAULT_AUTO_ROLE_NAME = ".gg community";

async function assignAutoRole(member, autoRoleId) {
  const role =
    (autoRoleId && member.guild.roles.cache.get(autoRoleId)) ||
    member.guild.roles.cache.find(
      (r) => r.name.toLowerCase() === DEFAULT_AUTO_ROLE_NAME,
    );

  if (!role) {
    console.warn(`[AutoRol] Rol no encontrado en ${member.guild.name}. Crea un rol llamado "${DEFAULT_AUTO_ROLE_NAME}" o usa /configurar-autorol.`);
    return;
  }

  try {
    await member.roles.add(role);
    console.log(`[AutoRol] Rol "${role.name}" asignado a ${member.user.tag}`);
  } catch (err) {
    console.error(`[AutoRol] Error asignando rol: ${err.message} (revisa permisos y posición del rol del bot)`);
  }
}

export async function handleGuildMemberAdd(member) {
  const config = await getGuildConfig(member.guild.id);

  await assignAutoRole(member, config?.auto_role_id);

  if (!config?.welcome_channel_id) return;

  const channel = member.guild.channels.cache.get(config.welcome_channel_id);
  if (!channel?.isTextBased()) return;

  const template = config.welcome_message ?? DEFAULT_WELCOME_MESSAGE;
  const text = template
    .replaceAll("{usuario}", `<@${member.id}>`)
    .replaceAll("{servidor}", member.guild.name);

  const embed = new EmbedBuilder()
    .setDescription(text)
    .setColor(0x57f287)
    .setThumbnail(member.user.displayAvatarURL())
    .setFooter({ text: `Miembro #${member.guild.memberCount}` })
    .setTimestamp(new Date());

  try {
    await channel.send({ embeds: [embed] });
  } catch (err) {
    console.error(`[Bienvenida] Error enviando mensaje: ${err.message}`);
  }
}
