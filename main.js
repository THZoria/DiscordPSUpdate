// psFirmwareWatcherBot.js
// Discord bot to watch PS4 & PS5 firmware versions and post updates to a channel

require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs').promises;
const path = require('path');

const TOKEN = process.env.DISCORD_TOKEN;       
const CHANNEL_ID = process.env.CHANNEL_ID;       
const CHECK_INTERVAL = 30 * 1000;              
const LANGS = ['fr-fr', 'en-us'];
const SEEN_FILE = path.resolve(__dirname, 'seen_versions.json');

if (!TOKEN || !CHANNEL_ID) {
  console.error('Merci de définir DISCORD_TOKEN et CHANNEL_ID via votre fichier .env.');
  process.exit(1);
}

async function loadSeen() {
  try {
    const data = await fs.readFile(SEEN_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    return { ps4: [], ps5: [] };
  }
}

async function saveSeen(seen) {
  await fs.writeFile(SEEN_FILE, JSON.stringify(seen, null, 2), 'utf-8');
}

async function getLatestVersion(consoleName) {
  for (const lang of LANGS) {
    const url = `https://www.playstation.com/${lang}/support/hardware/${consoleName}/system-software-info/`;
    try {
      const res = await axios.get(url, { timeout: 10000 });
      const $ = cheerio.load(res.data);
      const text = $('body').text();
      const match = /Version\s*[:\-]\s*([0-9]+\.[0-9]+(?:\.[0-9]+)?)/i.exec(text);
      if (match) return match[1];
    } catch (e) {
      console.debug(`Erreur HTTP pour ${consoleName}@${lang}:`, e.message);
    }
  }
  throw new Error(`Impossible de récupérer la version pour ${consoleName}`);
}

// --- EMBED DISCORD ---
async function sendEmbed(channel, consoleName, oldVersion, newVersion) {
  const embed = new EmbedBuilder()
    .setTitle(`Mise à jour firmware ${consoleName.toUpperCase()}`)
    .setDescription(`Nouvelle version disponible : **${newVersion}** (avant : ${oldVersion})`)
    .setTimestamp()
    .setColor(0x000066FF)
    .addFields(
      { name: 'Console', value: consoleName.toUpperCase(), inline: true },
      { name: 'Ancienne version', value: oldVersion, inline: true },
      { name: 'Nouvelle version', value: newVersion, inline: true }
    );
  await channel.send({ embeds: [embed] });
}

// --- MAIN ---
(async () => {
  const client = new Client({ intents: [GatewayIntentBits.Guilds] });
  await client.login(TOKEN);
  console.log('Bot connecté.');

  const channel = await client.channels.fetch(CHANNEL_ID);
  if (!channel) {
    console.error('Salon introuvable :', CHANNEL_ID);
    process.exit(1);
  }

  let seen = await loadSeen();
  const last = {};

  for (const consoleName of ['ps4', 'ps5']) {
    try {
      const v = await getLatestVersion(consoleName);
      last[consoleName] = v;
      const existing = seen[consoleName] || [];
      const oldVersion = existing.length ? existing[existing.length - 1] : 'N/A';
      if (!existing.includes(v)) {
        await sendEmbed(channel, consoleName, oldVersion, v);
        seen[consoleName] = [...(existing || []), v];
        await saveSeen(seen);
        console.log(`${consoleName.toUpperCase()}: ${v} posté (avant ${oldVersion})`);
      } else {
        console.log(`${consoleName.toUpperCase()} version déjà vue : ${v}`);
      }
    } catch (e) {
      console.error(`Erreur initiale ${consoleName}:`, e.message);
    }
  }

  setInterval(async () => {
    for (const consoleName of ['ps4', 'ps5']) {
      try {
        const v = await getLatestVersion(consoleName);
        if (!seen[consoleName].includes(v)) {
          const oldVersion = last[consoleName] || 'N/A';
          await sendEmbed(channel, consoleName, oldVersion, v);
          seen[consoleName].push(v);
          await saveSeen(seen);
          console.log(`${consoleName.toUpperCase()}: nouvelle version ${v}`);
        } else {
          console.log(`${consoleName.toUpperCase()}: pas de changement (${v})`);
        }
        last[consoleName] = v;
      } catch (e) {
        console.error(`Erreur check ${consoleName}:`, e.message);
      }
    }
  }, CHECK_INTERVAL);
})();
