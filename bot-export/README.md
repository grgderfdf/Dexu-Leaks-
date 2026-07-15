# 🤖 Dexu Leaks Bot

Bot de Discord para el servidor **Dexu Leaks**. Incluye bienvenida automática, asignación de rol y sistema de tickets.

---

## ⚙️ Instalación

### 1. Requisitos
- [Node.js 18+](https://nodejs.org)
- Una base de datos PostgreSQL gratuita (recomendado: [Neon](https://neon.tech))

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables de entorno
Copia el archivo de ejemplo y rellénalo:
```bash
cp .env.example .env
```
Edita `.env` con:
- `DISCORD_BOT_TOKEN` → tu token del bot (Discord Developer Portal → Tu app → Bot → Token)
- `DATABASE_URL` → la URL de conexión de tu base de datos PostgreSQL

### 4. Agregar el logo
Copia el archivo `dexu-leaks-logo.png` dentro de la carpeta `assets/`:
```
assets/
  dexu-leaks-logo.png   ← tu logo aquí
```

### 5. Arrancar el bot
```bash
npm start
```
La primera vez crea las tablas de la base de datos automáticamente.

---

## 🎮 Comandos

| Comando | Descripción |
|---|---|
| `/configurar-bienvenida` | Elige el canal de bienvenida (y mensaje opcional) |
| `/configurar-tickets` | Elige categoría, rol de staff y canal de registro |
| `/configurar-autorol` | Elige el rol que se asigna al entrar |
| `/panel-tickets` | Publica el botón de apertura de tickets |
| `/cerrar-ticket` | Cierra el ticket desde dentro del canal |

---

## 🔑 Permisos necesarios del bot

En el **Discord Developer Portal → Tu app → Bot → Privileged Gateway Intents** activa:
- ✅ **SERVER MEMBERS INTENT**
- ✅ **MESSAGE CONTENT INTENT**

Cuando invites el bot al servidor usa estos **Scopes**: `bot` + `applications.commands`

Permisos recomendados:
- Gestionar canales
- Gestionar roles
- Ver canales
- Enviar mensajes
- Leer historial de mensajes

---

## 🌐 Hosting gratuito recomendado

| Servicio | Link | Notas |
|---|---|---|
| **Railway** | https://railway.app | Fácil, $5 gratis/mes |
| **Render** | https://render.com | Free tier (se duerme si no hay actividad) |
| **Fly.io** | https://fly.io | Free tier con máquina siempre encendida |

> Para **Neon** (base de datos gratuita): https://neon.tech → New Project → copia la "Connection string"
