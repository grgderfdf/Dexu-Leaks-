import path from "node:path";
import { fileURLToPath } from "node:url";
import { AttachmentBuilder } from "discord.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const LOGO_ATTACHMENT_NAME = "dexu-leaks-logo.png";
export const LOGO_ATTACHMENT_URI = `attachment://${LOGO_ATTACHMENT_NAME}`;
const LOGO_PATH = path.resolve(__dirname, "../assets/dexu-leaks-logo.png");

export function buildLogoAttachment() {
  return new AttachmentBuilder(LOGO_PATH, { name: LOGO_ATTACHMENT_NAME });
}
