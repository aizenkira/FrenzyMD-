const axios = require('axios')
const te = require('../../src/lib/frenzy-error')

const pluginConfig = {
    name: 'meaningname',
    alias: ['namemeaning', 'meaningnamI'],
    category: 'Javanese fortune-telling',
    description: 'Check meaning name according to Javanese fortune-telling',
    usage: '.meaningname <name>',
    example: '.meaningname putu',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energy: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    const name = m.args.join(' ')
    if (!name) {
        return m.reply(`📛 *ᴀʀᴛɪ ɴᴀᴍᴀ*\n\n> Enter name\n\n\`Example: ${m.prefix}meaningname putu\``)
    }
    
    m.react('📛')
    
    try {
        const url = `https://api.siputzx.my.id/api/Javanese fortune-telling/meaningname?name=${encodeURIComponent(name)}`
        const { data } = await axios.get(url, { timeout: 30000 })
        
        if (!data?.status || !data?.data) {
            m.react('❌')
            return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Cannot menganalisa name`)
        }
        
        const result = data.data
        const response = `📛 *ᴀʀᴛɪ ɴᴀᴍᴀ*\n\n` +
            `> Name: *${result.name}*\n\n` +
            `${result.meaning}\n\n` +
            `> _${result.catatan}_`
        
        m.react('✅')
        await m.reply(response)
        
    } catch (error) {
        m.react('☢')
        m.reply(te(m.prefix, m.command, m.pushName))
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
