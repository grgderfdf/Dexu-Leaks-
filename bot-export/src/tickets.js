import {
  ActionRowBuilder,
  AttachmentBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  EmbedBuilder,
  PermissionFlagsBits,
} from "discord.js";
import { pool } from "./db.js";
import { getGuildConfig, nextTicketNumber } from "./config.js";
import { buildLogoAttachment, LOGO_ATTACHMENT_URI } from "./assets.js";

export const TICKET_PANEL_TITLE = "Soporte — Dexu Leaks";

export function buildTicketPanelEmbed(description) {
  return new EmbedBuilder()
    .setTitle(TICKET_PANEL_TITLE)
    .setDescription(
      description ??
        "¿Necesitas ayuda? Pulsa el botón de abajo para abrir un ticket privado con el equipo de staff.",
    )
    .setColor(0x5865f2)
    .setThumbnail(LOGO_ATTACHMENT_URI)
    .setFooter({ text: "Dexu Leaks", iconURL: LOGO_ATTACHMENT_URI });
}

export function buildTicketPanelRow() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("ticket:open")
      .setLabel("Abrir ticket")
      .setEmoji("🎫")
      .setStyle(ButtonStyle.Primary),
  );
}

function buildTicketControlsRow(claimed) {
  const row = new ActionRowBuilder();
  if (!claimed) {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId("ticket:claim")
        .setLabel("Reclamar")
        .setEmoji("🙋")
        .setStyle(ButtonStyle.Secondary),
    );
  }
  row.addComponents(
    new ButtonBuilder()
      .setCustomId("ticket:close")
      .setLabel("Cerrar ticket")
      .setEmoji("🔒")
      .setStyle(ButtonStyle.Danger),
  );
  return row;
}

export async function openTicket(interaction) {
  const guild = interaction.guild;
  const config = await getGuildConfig(guild.id);

  if (!config?.ticket_category_id || !config?.ticket_staff_role_id) {
    await interaction.reply({
      content: "El sistema de tickets no está configurado todavía. Pide a un administrador que use /configurar-tickets.",
      ephemeral: true,
    });
    return;
  }

  const { rows: existing } = await pool.query(
    "SELECT * FROM discord_tickets WHERE opener_user_id = $1 AND guild_id = $2 AND status != 'closed'",
    [interaction.user.id, guild.id],
  );

  if (existing.length > 0) {
    await interaction.reply({
      content: `Ya tienes un ticket abierto: <#${existing[0].channel_id}>`,
      ephemeral: true,
    });
    return;
  }

  const ticketNumber = await nextTicketNumber(guild.id);
  const paddedNumber = String(ticketNumber).padStart(4, "0");

  const channel = await guild.channels.create({
    name: `ticket-${paddedNumber}`,
    type: ChannelType.GuildText,
    parent: config.ticket_category_id,
    permissionOverwrites: [
      { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
      {
        id: interaction.user.id,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory,
        ],
      },
      {
        id: config.ticket_staff_role_id,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory,
        ],
      },
    ],
  });

  await pool.query(
    `INSERT INTO discord_tickets (guild_id, channel_id, ticket_number, opener_user_id, status)
     VALUES ($1, $2, $3, $4, 'open')`,
    [guild.id, channel.id, paddedNumber, interaction.user.id],
  );

  const embed = new EmbedBuilder()
    .setTitle(`Ticket #${paddedNumber}`)
    .setDescription(
      `Hola <@${interaction.user.id}>, cuéntanos en qué podemos ayudarte. El staff (<@&${config.ticket_staff_role_id}>) atenderá tu caso pronto.`,
    )
    .setColor(0x5865f2)
    .setThumbnail(LOGO_ATTACHMENT_URI)
    .setFooter({ text: "Dexu Leaks", iconURL: LOGO_ATTACHMENT_URI })
    .setTimestamp(new Date());

  await channel.send({
    content: `<@${interaction.user.id}> <@&${config.ticket_staff_role_id}>`,
    embeds: [embed],
    components: [buildTicketControlsRow(false)],
    files: [buildLogoAttachment()],
  });

  await interaction.reply({
    content: `Tu ticket fue creado: ${channel}`,
    ephemeral: true,
  });

  console.log(`[Tickets] Ticket #${paddedNumber} abierto por ${interaction.user.tag}`);
}

export async function claimTicket(interaction) {
  const guild = interaction.guild;
  const config = await getGuildConfig(guild.id);
  const member = await guild.members.fetch(interaction.user.id);

  if (
    config?.ticket_staff_role_id &&
    !member.roles.cache.has(config.ticket_staff_role_id) &&
    !member.permissions.has(PermissionFlagsBits.ManageGuild)
  ) {
    await interaction.reply({
      content: "Solo el staff puede reclamar este ticket.",
      ephemeral: true,
    });
    return;
  }

  const { rows } = await pool.query(
    `UPDATE discord_tickets SET claimed_by_user_id = $1, status = 'claimed'
     WHERE channel_id = $2 RETURNING *`,
    [interaction.user.id, interaction.channelId],
  );

  if (rows.length === 0) {
    await interaction.reply({
      content: "No se encontró este ticket en la base de datos.",
      ephemeral: true,
    });
    return;
  }

  await interaction.update({ components: [buildTicketControlsRow(true)] });
  await interaction.followUp({ content: `🙋 <@${interaction.user.id}> ha reclamado este ticket.` });
}

export async function closeTicketChannel(guild, channel, closedByUserId) {
  const { rows } = await pool.query(
    `UPDATE discord_tickets SET status = 'closed', closed_at = NOW()
     WHERE channel_id = $1 RETURNING *`,
    [channel.id],
  );

  if (rows.length === 0) {
    return { ok: false, reason: "No se encontró este ticket en la base de datos." };
  }

  const ticket = rows[0];
  const config = await getGuildConfig(guild.id);

  if (config?.ticket_log_channel_id) {
    const logChannel = guild.channels.cache.get(config.ticket_log_channel_id);
    if (logChannel?.isTextBased()) {
      await logChannel.send({
        embeds: [
          new EmbedBuilder()
            .setTitle(`Ticket #${ticket.ticket_number} cerrado`)
            .addFields(
              { name: "Abierto por", value: `<@${ticket.opener_user_id}>` },
              { name: "Cerrado por", value: `<@${closedByUserId}>` },
            )
            .setColor(0xed4245)
            .setTimestamp(new Date()),
        ],
      });
    }
  }

  console.log(`[Tickets] Ticket #${ticket.ticket_number} cerrado por ${closedByUserId}`);

  setTimeout(() => {
    channel.delete().catch((err) => console.error(`[Tickets] Error borrando canal: ${err.message}`));
  }, 5000);

  return { ok: true };
}

export async function closeTicket(interaction) {
  const guild = interaction.guild;
  const channel = interaction.channel;

  if (!channel || channel.type !== ChannelType.GuildText) {
    await interaction.reply({
      content: "Este comando solo funciona dentro de un canal de ticket.",
      ephemeral: true,
    });
    return;
  }

  const result = await closeTicketChannel(guild, channel, interaction.user.id);

  if (!result.ok) {
    await interaction.reply({ content: result.reason, ephemeral: true });
    return;
  }

  await interaction.reply({
    content: "🔒 Ticket cerrado. Este canal se eliminará en 5 segundos y se guardará un registro.",
  });
}
