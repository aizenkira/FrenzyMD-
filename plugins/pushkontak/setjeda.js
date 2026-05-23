const { getDatabase } = require('../../src/lib/frenzy-database')

const pluginConfig = {
    name: 'setdelay',
    alias: ['setdelay', 'delay'],
    category: 'pushcontacts',
    description: 'Atur delay for pushcontacts/jpm',
    usage: '.setdelay <push/jpm> <ms>',
    example: '.setdelay push 5000',
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
    const args = m.args
    
    const currentDelayPush = db.setting('delayPush') || 5000
    const currentDelayJpm = db.setting('delayJpm') || 5000
    
    if (args.length < 2) {
        return m.reply(
            `⏱️ *sᴇᴛ ᴊᴇᴅᴀ*\n\n` +
            `╭┈┈⬡「 📋 *sᴇᴛᴛɪɴɢ sᴀᴀᴛ ɪɴɪ* 」\n` +
            `┃ 📤 ᴊᴇᴅᴀ ᴘᴜsʜ: \`${currentDelayPush}ms\`\n` +
            `┃ 📢 ᴊᴇᴅᴀ ᴊᴘᴍ: \`${currentDelayJpm}ms\`\n` +
            `╰┈┈⬡\n\n` +
            `*ᴄᴀʀᴀ ᴘᴀᴋᴀɪ:*\n` +
            `> \`${m.prefix}setdelay push 5000\`\n` +
            `> \`${m.prefix}setdelay jpm 6000\`\n\n` +
            `> _1 second = 1000ms_`
        )
    }
    
    const target = args[0].toLowerCase()
    const value = parseInt(args[1])
    
    if (!['push', 'jpm'].includes(target)) {
        return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Choice: \`push\` or \`jpm\``)
    }
    
    if (isNaN(value) || value < 1000) {
        return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Enter angka at least 1000 (1 second)`)
    }
    
    if (value > 60000) {
        return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Mactionmal 60000 (1 minute)`)
    }
    
    if (target === 'push') {
        db.setting('delayPush', value)
        m.react('✅')
        return m.reply(`✅ *ᴊᴇᴅᴀ ᴘᴜsʜ ᴅɪᴜʙᴀʜ*\n\n> Delay: \`${value}ms\` (${value/1000} second)`)
    }
    
    if (target === 'jpm') {
        db.setting('delayJpm', value)
        m.react('✅')
        return m.reply(`✅ *ᴊᴇᴅᴀ ᴊᴘᴍ ᴅɪᴜʙᴀʜ*\n\n> Delay: \`${value}ms\` (${value/1000} second)`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
