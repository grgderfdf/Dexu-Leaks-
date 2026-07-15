import { ChannelType, MessageFlags } from "discord.js";
import { upsertGuildConfig } from "./config.js";
import {
  buildTicketPanelEmbed,
  buildTicketPanelRow,
  claimTicket,
  closeTicket,
  closeTicketChannel,
  openTicket,
} from "./tickets.js";
import { buildLogoAttachment } from "./assets.js";

async function handleConfigurarBienvenida(interaction) {
  const guildId = interaction.guildId;
  if (!guildId) return;

  const channel = interaction.options.getChannel("canal", true);
  const mensaje = interaction.options.getString("mensaje") ?? undefined;

  await upsertGuildConfig(guildId, {
    welcomeChannelId: channel.id,
    ...(mensaje ? { welcomeMessage: mensaje } : {}),
  });

  await interaction.reply({
    content: `Canal de bienvenida configurado en <#${channel.id}>.`,
    flags: MessageFlags.Ephemeral,
  });
}

async function handleConfigurarTickets(interaction) {
  const guildId = interaction.guildId;
  if (!guildId) return;

  const categoria = interaction.options.getChannel("categoria", true);
  const rolStaff = interaction.options.getRole("rol_staff", true);
  const canalRegistro = interaction.options.getChannel("canal_registro");

  await upsertGuildConfig(guildId, {
    ticketCategoryId: categoria.id,
    ticketStaffRoleId: rolStaff.id,
    ticketLogChannelId: canalRegistro?.id ?? null,
  });

  await interaction.reply({
    content: "Sistema de tickets configurado. Usa /panel-tickets para publicar el botón de apertura.",
    flags: MessageFlags.Ephemeral,
  });
}

async function handleConfigurarAutorol(interaction) {
  const guildId = interaction.guildId;
  if (!guildId) return;

  const rol = interaction.options.getRole("rol", true);
  await upsertGuildConfig(guildId, { autoRoleId: rol.id });

  await interaction.reply({
    content: `Rol automático configurado: <@&${rol.id}>. Se asignará a cada miembro nuevo al entrar.`,
    flags: MessageFlags.Ephemeral,
  });
}

async function handlePanelTickets(interaction) {
  const descripcion = interaction.options.getString("descripcion") ?? undefined;

  if (!interaction.channel || interaction.channel.type !== ChannelType.GuildText) {
    await interaction.reply({
      content: "Usa este comando en un canal de texto del servidor.",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  await interaction.channel.send({
    embeds: [buildTicketPanelEmbed(descripcion)],
    components: [buildTicketPanelRow()],
    files: [buildLogoAttachment()],
  });

  await interaction.reply({
    content: "Panel de tickets publicado.",
    flags: MessageFlags.Ephemeral,
  });
}

async function handleCerrarTicket(interaction) {
  const guild = interaction.guild;
  const channel = interaction.channel;

  if (!guild || !channel || channel.type !== ChannelType.GuildText) {
    await interaction.reply({
      content: "Usa este comando dentro de un canal de ticket.",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const result = await closeTicketChannel(guild, channel, interaction.user.id);

  if (!result.ok) {
    await interaction.reply({ content: result.reason, flags: MessageFlags.Ephemeral });
    return;
  }

  await interaction.reply({
    content: "🔒 Ticket cerrado. Este canal se eliminará en 5 segundos y se guardará un registro.",
  });
}

export async function handleInteraction(interaction) {
  try {
    if (interaction.isChatInputCommand()) {
      switch (interaction.commandName) {
        case "configurar-bienvenida": return await handleConfigurarBienvenida(interaction);
        case "configurar-tickets":   return await handleConfigurarTickets(interaction);
        case "panel-tickets":        return await handlePanelTickets(interaction);
        case "cerrar-ticket":        return await handleCerrarTicket(interaction);
        case "configurar-autorol":   return await handleConfigurarAutorol(interaction);
      }
    }

    if (interaction.isButton()) {
      switch (interaction.customId) {
        case "ticket:open":  return await openTicket(interaction);
        case "ticket:claim": return await claimTicket(interaction);
        case "ticket:close": return await closeTicket(interaction);
      }
    }
  } catch (err) {
    console.error(`[Interacción] Error: ${err.message}`);
    if (interaction.isRepliable() && !interaction.replied) {
      await interaction
        .reply({ content: "Ocurrió un error al procesar esta acción.", flags: MessageFlags.Ephemeral })
        .catch(() => {});
    }
  }
}
