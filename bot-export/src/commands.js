import {
  ChannelType,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";

export const commands = [
  new SlashCommandBuilder()
    .setName("configurar-bienvenida")
    .setDescription("Configura el canal de mensajes de bienvenida")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addChannelOption((o) =>
      o.setName("canal")
        .setDescription("Canal donde se enviarán las bienvenidas")
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true),
    )
    .addStringOption((o) =>
      o.setName("mensaje")
        .setDescription("Usa {usuario} y {servidor} como variables")
        .setRequired(false),
    ),

  new SlashCommandBuilder()
    .setName("configurar-tickets")
    .setDescription("Configura el sistema de tickets del servidor")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addChannelOption((o) =>
      o.setName("categoria")
        .setDescription("Categoría donde se crearán los canales de ticket")
        .addChannelTypes(ChannelType.GuildCategory)
        .setRequired(true),
    )
    .addRoleOption((o) =>
      o.setName("rol_staff")
        .setDescription("Rol del equipo que atenderá los tickets")
        .setRequired(true),
    )
    .addChannelOption((o) =>
      o.setName("canal_registro")
        .setDescription("Canal donde se registran los tickets cerrados")
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(false),
    ),

  new SlashCommandBuilder()
    .setName("panel-tickets")
    .setDescription("Publica el panel para abrir tickets en este canal")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addStringOption((o) =>
      o.setName("descripcion")
        .setDescription("Descripción personalizada del panel")
        .setRequired(false),
    ),

  new SlashCommandBuilder()
    .setName("cerrar-ticket")
    .setDescription("Cierra el ticket actual (úsalo dentro del canal del ticket)"),

  new SlashCommandBuilder()
    .setName("configurar-autorol")
    .setDescription("Configura el rol que se asigna automáticamente a los miembros nuevos")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addRoleOption((o) =>
      o.setName("rol")
        .setDescription("Rol a asignar automáticamente (ej. .gg community)")
        .setRequired(true),
    ),
].map((cmd) => cmd.toJSON());
