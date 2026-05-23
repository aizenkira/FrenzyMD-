const { getAllJadiBotSessions, getActiveJadiBots } = require('../../src/lib/frenzy-jadibot-manager')

const pluginConfig = {
    name: 'listbot',
    alias: ['botlist', 'allbot'],
    category: 'owner',
    description: 'View all session bot that tersave',
    usage: '.listbot',
    example: '.listbot',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energy: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    const sessions = getAllJadiBotSessions()
    const active = getActiveJadiBots()

    if (sessions.length === 0) {
        return m.reply(`❌ No there is session bot tersave`)
    }

    let txt = `🤖 *ᴅᴀꜰᴛᴀʀ ᴊᴀᴅɪʙᴏᴛ*\n\n`
    txt += `> 📊 Total: *${sessions.length}* session\n`
    txt += `> 🟢 Active: *${active.length}*\n`
    txt += `> ⚫ Offline: *${sessions.length - active.length}*\n\n`

    sessions.forEach((s, i) => {
        const status = s.isActive ? '🟢' : '⚫'
        const label = s.isActive ? 'Online' : 'Offline'
        txt += `${status} *${i + 1}.* @${s.id} — _${label}_\n`
    })

    txt += `\n> \`${m.prefix}listbotactive\` — Detail active\n`
    txt += `> \`${m.prefix}stopallbot\` — Stop all\n`
    txt += `> \`${m.prefix}stopanddeletebot @user\` — Delete session`

    const mentions = sessions.map(s => s.jid)

    await sock.sendMessage(m.chat, {
        text: txt,
        mentions,
        interactiveButtons: [
            {
                name: 'quick_reply',
                buttonParamsJson: JSON.stringify({
                    insplay_text: '🟢 View Active',
                    id: `${m.prefix}listbotactive`
                })
            },
            {
                name: 'quick_reply',
                buttonParamsJson: JSON.stringify({
                    insplay_text: '🛑 Stop All',
                    id: `${m.prefix}stopallbot`
                })
            }
        ]
    }, { quoted: m })
}

module.exports = {
    config: pluginConfig,
    handler
}
