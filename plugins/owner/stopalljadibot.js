const { stopAllJadiBots, getActiveJadiBots } = require('../../src/lib/frenzy-jadibot-manager')
const te = require('../../src/lib/frenzy-error')

const pluginConfig = {
    name: 'stopallbot',
    alias: ['stopallbot', 'killallbots'],
    category: 'owner',
    description: 'Hentikan all bot that active',
    usage: '.stopallbot',
    example: '.stopallbot',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energy: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    const active = getActiveJadiBots()

    if (active.length === 0) {
        return m.reply(`❌ No there is bot that active`)
    }

    m.react('🕕')

    try {
        const stopped = await stopAllJadiBots()

        m.react('✅')

        const names = stopped.map(id => `@${id}`).join(', ')

        await sock.sendMessage(m.chat, {
            text: `🛑 *sᴇᴍᴜᴀ ᴊᴀᴅɪʙᴏᴛ ᴅɪʜᴇɴᴛɪᴋᴀɴ*\n\n` +
                `> 📊 Total: *${stopped.length}* bot\n` +
                `> 💾 Session: *Tersave*\n\n` +
                `Inhentikan: ${names}\n\n` +
                `> All session insave and can inactivekan again.`,
            mentions: stopped.map(id => id + '@s.whatsapp.net')
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
