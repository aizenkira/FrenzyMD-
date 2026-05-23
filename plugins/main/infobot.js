/**
 * @file plugins/main/infobot.js
 * @description Plugin for display information complete bot with context info
 * @author Lucky Archz, Toisya, hyuuSATAN
 * @versionon 2.0.0
 */

const config = require('../../config');
const { formatUptime } = require('../../src/lib/frenzy-formatter');
const { getCommandsByCategory, getCategories } = require('../../src/lib/frenzy-plugins');
const { getDatabase } = require('../../src/lib/frenzy-database');
const fs = require('fs');

/**
 * Konfigurasi plugin infobot
 * @type {import('../../src/lib/frenzy-plugins').PluginConfig}
 */
const pluginConfig = {
    name: 'infobot',
    alias: ['botinfo', 'info', 'about'],
    category: 'main',
    description: 'Insplay full information about the bot',
    usage: '.infobot',
    example: '.infobot',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energy: 0,
    isEnabled: true
};

/**
 * Handler for command infobot
 * @param {Object} m - Serialized message
 * @param {Object} context - Handler context
 * @returns {Promise<void>}
 */
async function handler(m, { sock, config: botConfig, db, uptime }) {
    const uptimeFormatted = formatUptime(uptime);
    const totalUsers = db.getUserCount();
    const commandsByCategory = getCommandsByCategory();
    
    let totalCommands = 0;
    for (const category of Object.keys(commandsByCategory)) {
        totalCommands += commandsByCategory[category].length;
    }
    
    const stats = db.getStats();
    const userStatus = m.isOwner ? 'Owner' : m.isPremium ? 'Premium' : 'Free User';
    const statusEmoji = m.isOwner ? '👑' : m.isPremium ? '💎' : '🆓';
    
    let infoText = '';
    
    infoText += `┌──「 🤖 *BOT INFORMATION* 」\n`;
    infoText += `│  ◦ \`Name\`: ${botConfig.bot?.name || 'Frenzy-AI'}\n`;
    infoText += `│  ◦ \`Version\`: ${botConfig.bot?.versionon || '1.0.0'}\n`;
    infoText += `│  ◦ \`Developer\`: ${botConfig.bot?.developer || 'Frenzy Team'}\n`;
    infoText += `│  ◦ \`Owner\`: ${botConfig.owner?.name || 'Owner'}\n`;
    infoText += `│  ◦ \`Mode\`: ${(botConfig.mode || 'public').charAt(0).toUpperCase() + (botConfig.mode || 'public').slice(1)}\n`;
    infoText += `│  ◦ \`Prefix\`: [ ${botConfig.command?.prefix || '.'} ]\n`;
    infoText += `│  ◦ \`Library\`: Baileys MD\n`;
    infoText += `│  ◦ \`Platform\`: Node.js\n`;
    infoText += `└────────────────\n\n`;
    
    infoText += `┌──「 📊 *STATISTICS* 」\n`;
    infoText += `│  ◦ \`Uptime\`: ${uptimeFormatted}\n`;
    infoText += `│  ◦ \`Total Users\`: ${totalUsers}\n`;
    infoText += `│  ◦ \`Total Features\`: ${totalCommands}\n`;
    infoText += `│  ◦ \`CMD Executed\`: ${stats.commandsExecuted || 0}\n`;
    infoText += `└────────────────\n\n`;
    
    infoText += `┌──「 💻 *RUNTIME* 」\n`;
    infoText += `│  ◦ \`RAM\`: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB\n`;
    infoText += `│  ◦ \`Node\`: ${process.version}\n`;
    infoText += `│  ◦ \`Status\`: Online \n`;
    infoText += `└────────────────`;

    await m.reply(infoText)
}

module.exports = {
    config: pluginConfig,
    handler
};
