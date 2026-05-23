const { getDatabase } = require('../../src/lib/frenzy-database')

const pluginConfig = {
    name: 'delaycreate',
    alias: ['setdelay', 'paneldelay', 'jedwhatnel'],
    category: 'panel',
    description: 'Set delay time for all panel create command',
    usage: '.delaycreate <time>',
    example: '.delaycreate 5m',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 0,
    energy: 0,
    isEnabled: true
}

function parseTime(input) {
    if (!input || input === '0') return 0
    
    const match = input.match(/^(\d+)(s|m|h)?$/i)
    if (!match) return null
    
    const value = parseInt(match[1])
    const unit = (match[2] || 's').toLowerCase()
    
    switch (unit) {
        case 's': return value * 1000
        case 'm': return value * 60 * 1000
        case 'h': return value * 60 * 60 * 1000
        default: return value * 1000
    }
}

function formatTime(ms) {
    if (ms <= 0) return 'Tanpa delay'
    
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    
    if (hours > 0) return `${hours} hour ${minutes % 60} minute`
    if (minutes > 0) return `${minutes} minute ${seconds % 60} second`
    return `${seconds} second`
}

async function handler(m, { sock }) {
    const db = getDatabase()
    const input = m.text?.trim()
    
    const DEFAULT_JEDA = 5 * 60 * 1000
    
    if (!input) {
        const currentDelay = db.setting('panelCreateDelay') ?? DEFAULT_JEDA
        return m.reply(
            `⏱️ *ᴊᴇᴅᴀ ᴘᴀɴᴇʟ ᴄʀᴇᴀᴛᴇ*\n\n` +
            `╭┈┈⬡「 📋 *ɪɴꜰᴏ* 」\n` +
            `┃ ◦ Delay currently: *${formatTime(currentDelay)}*\n` +
            `┃ ◦ Default: *5 minute*\n` +
            `╰┈┈⬡\n\n` +
            `> Usage: \`${m.prefix}delaycreate <time>\`\n` +
            `> Example: \`${m.prefix}delaycreate 5m\` (5 minute)\n` +
            `> For nonactivekan: \`${m.prefix}delaycreate 0\`\n\n` +
            `*Format time:*\n` +
            `• \`30s\` = 30 second\n` +
            `• \`5m\` = 5 minute\n` +
            `• \`1h\` = 1 hour`
        )
    }
    
    const delayMs = parseTime(input)
    
    if (delayMs === null) {
        return m.reply(`❌ Format time no valid!\n\n> Example: 30s, 5m, 1h`)
    }
    
    db.setting('panelCreateDelay', delayMs)
    db.setting('panelCreateLastUsed', 0)
    
    m.react('✅')
    
    if (delayMs === 0) {
        return m.reply(
            `✅ *ᴊᴇᴅᴀ ᴅɪɴᴏɴᴀᴋᴛɪꜰᴋᴀɴ*\n\n` +
            `> Panel create now tanpa delay`
        )
    }
    
    return m.reply(
        `✅ *ᴊᴇᴅᴀ ᴅɪsᴇᴛ*\n\n` +
        `╭┈┈⬡「 ⏱️ *ᴋᴏɴꜰɪɢ* 」\n` +
        `┃ ◦ Delay: *${formatTime(delayMs)}*\n` +
        `╰┈┈⬡\n\n` +
        `> After panel increate, SEMUA user must waiting ${formatTime(delayMs)} before can create again.`
    )
}

module.exports = {
    config: pluginConfig,
    handler
}
