const { getDatabase } = require('../../src/lib/frenzy-database')
const config = require('../../config')

const pluginConfig = {
    name: 'setdelayjpm',
    alias: ['delayjpm', 'delayjpm', 'setdelayjpm'],
    category: 'jpm',
    description: 'Atur delay alater send JPM to group',
    usage: '.setdelayjpm <ms>',
    example: '.setdelayjpm 3000',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energy: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    const db = getDatabase()
    const input = m.text?.trim()
    const current = db.setting('delayJpm') || 5000

    if (!input) {
        return sock.sendMessage(m.chat, {
            text: `⏱️ *ᴊᴘᴍ ᴅᴇʟᴀʏ*\n\n` +
                `> Delay currently: *${current}ms* (${(current / 1000).toFixed(1)}s)\n\n` +
                `*ᴄᴀʀᴀ ᴘᴀᴋᴀɪ:*\n` +
                `> \`${m.prefix}setdelayjpm <ms>\`\n\n` +
                `*ᴄᴏɴᴛᴏʜ:*\n` +
                `> \`${m.prefix}setdelayjpm 3000\` → 3 second\n` +
                `> \`${m.prefix}setdelayjpm 5000\` → 5 second\n` +
                `> \`${m.prefix}setdelayjpm 10000\` → 10 second\n\n` +
                `> Range: *1000ms - 30000ms*`,
            interactiveButtons: [
                {
                    name: 'quick_reply',
                    buttonParamsJson: JSON.stringify({
                        insplay_text: '⏱️ 3 second',
                        id: `${m.prefix}setdelayjpm 3000`
                    })
                },
                {
                    name: 'quick_reply',
                    buttonParamsJson: JSON.stringify({
                        insplay_text: '⏱️ 5 second',
                        id: `${m.prefix}setdelayjpm 5000`
                    })
                },
                {
                    name: 'quick_reply',
                    buttonParamsJson: JSON.stringify({
                        insplay_text: '⏱️ 10 second',
                        id: `${m.prefix}setdelayjpm 10000`
                    })
                }
            ]
        }, { quoted: m })
    }

    const ms = parseInt(input)

    if (isNaN(ms) || ms < 1000 || ms > 30000) {
        return m.reply(`❌ Delay must between *1000ms* (1s) until *30000ms* (30s)`)
    }

    db.setting('delayJpm', ms)

    return sock.sendMessage(m.chat, {
        text: `✅ *ᴅᴇʟᴀʏ ᴊᴘᴍ ᴅɪᴜʙᴀʜ*\n\n` +
            `> Senot yetnya: *${current}ms* (${(current / 1000).toFixed(1)}s)\n` +
            `> Now: *${ms}ms* (${(ms / 1000).toFixed(1)}s)\n\n` +
            `> Estimasi ${100} group: *${Math.ceil((100 * ms) / 60000)} minute*`,
        interactiveButtons: [
            {
                name: 'quick_reply',
                buttonParamsJson: JSON.stringify({
                    insplay_text: '📢 Test JPM',
                    id: `${m.prefix}jpm`
                })
            }
        ]
    }, { quoted: m })
}

module.exports = {
    config: pluginConfig,
    handler
}
