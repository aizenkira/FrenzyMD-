const { stopJadiBot, getAllJadiBotSessions } = require('../../src/lib/frenzy-jadibot-manager')
const te = require('../../src/lib/frenzy-error')

const pluginConfig = {
    name: 'stopanddeletebot',
    alias: ['deletebot', 'removebot', 'deletebot'],
    category: 'owner',
    description: 'Stop and delete session bot user seway permanen',
    usage: '.stopanddeletebot @user',
    example: '.stopanddeletebot @628xxx',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energy: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    let target = null

    if (m.quoted) {
        target = m.quoted.sender
    } else if (m.mentionedJid?.[0]) {
        target = m.mentionedJid[0]
    } else if (m.text?.trim()) {
        const num = m.text.trim().replace(/[^0-9]/g, '')
        if (num) target = num + '@s.whatsapp.net'
    }

    if (!target) {
        const sessions = getAllJadiBotSessions()

        if (sessions.length === 0) {
            return m.reply(`❌ No there is session bot tersave`)
        }

        let txt = `🗑️ *sᴛᴏᴘ & ᴅᴇʟᴇᴛᴇ ᴊᴀᴅɪʙᴏᴛ*\n\n`
        txt += `Choose target with mention or reply:\n\n`

        sessions.forEach((s, i) => {
            const status = s.isActive ? '🟢' : '⚫'
            txt += `${status} *${i + 1}.* @${s.id}\n`
        })

        txt += `\n> Example: \`${m.prefix}stopanddeletebot @628xxx\``

        return sock.sendMessage(m.chat, {
            text: txt,
            mentions: sessions.map(s => s.jid)
        }, { quoted: m })
    }

    const id = target.replace(/@.+/g, '')
    const sessions = getAllJadiBotSessions()
    const session = sessions.find(s => s.id === id)

    if (!session) {
        return m.reply(`❌ Session bot for *@${id}* not found`, { mentions: [target] })
    }

    m.react('🕕')

    try {
        await stopJadiBot(target, true)

        m.react('✅')

        await sock.sendMessage(m.chat, {
            text: `🗑️ *ᴊᴀᴅɪʙᴏᴛ ᴅɪʜᴀᴘᴜs*\n\n` +
                `> 📱 Number: *@${id}*\n` +
                `> 🗑️ Status: *Deleted*\n\n` +
                `Session has deleted seway permanen.\n` +
                `User perlu \`.bot\` again for create a new session.`,
            mentions: [target]
        }, { quoted: m })
    } catch (error) {
        m.react('☢')
        m.reply(te(m.prefix, m.command, m.pushName))
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
