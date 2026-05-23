/**
 * @file plugins/owner/self.js
 * @description Plugin for activate mode self (only owner & bot)
 */

const config = require('../../config');
const { getDatabase } = require('../../src/lib/frenzy-database');
const te = require('../../src/lib/frenzy-error')

const pluginConfig = {
    name: 'self',
    alias: ['selfmode', 'private-mode'],
    category: 'owner',
    description: 'Mengactivekan mode self (only owner & bot that can access)',
    usage: '.self',
    example: '.self',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 3,
    energy: 0,
    isEnabled: true
};

/**
 * Handler for command self
 */
async function handler(m, { sock }) {
    try {
        const isRealOwner = validateOwner(m);
        if (!isRealOwner) {
            return await m.reply('🚫 *ᴀᴋsᴇs ᴅɪᴛᴏʟᴀᴋ*\n\n> Only owner that can change mode bot!');
        }
        const currentMode = config.mode;
        if (currentMode === 'self') {
            return await m.reply('ℹ️ Bot already in mode *self*');
        }
        config.mode = 'self';
        const db = getDatabase();
        db.setting('botMode', 'self');
        
        const responseText = `🔒 *ᴍᴏᴅᴇ sᴇʟꜰ ᴀᴋᴛɪꜰ*\n\n` +
            `> Bot now only merespon:\n` +
            `> • Owner bot\n` +
            `> • Bot yourself (fromMe)\n\n` +
            `_Usage .public for restore access_`;
        await m.reply(responseText);
        console.log(`[Mode] Changed to SELF by ${m.pushName} (${m.sender})`);
    } catch (error) {
        console.error('[Self Command Error]', error);
        m.reply(te(m.prefix, m.command, m.pushName));
    }
}

/**
 * Validasi owner with multiple checks
 */
function validateOwner(m) {
    if (!m.isOwner) return false;
    if (m.fromMe) return true;
    const senderNumber = m.sender?.replace(/[^0-9]/g, '') || '';
    const ownerNumbers = config.owner?.number || [];
    
    const isInOwnerList = ownerNumbers.some(owner => {
        const cleanOwner = owner.replace(/[^0-9]/g, '');
        return senderNumber.includes(cleanOwner) || cleanOwner.includes(senderNumber);
    });
    if (!isInOwnerList) return false;
    if (!m.sender || !m.sender.includes('@')) return false;
    return true;
}

module.exports = {
    config: pluginConfig,
    handler
};
