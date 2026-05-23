const axios = require('axios')
const te = require('../../src/lib/frenzy-error')

const pluginConfig = {
    name: 'ffstalk',
    alias: ['freefireid', 'stalkff'],
    category: 'staltor',
    description: 'Stalk ID Free Fire',
    usage: '.ffstalk <id>',
    example: '.ffstalk 775417067',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energy: 1,
    isEnabled: true
}

async function handler(m, { sock }) {
    const id = m.args[0]
    
    if (!id) {
        return m.reply(`🔥 *ꜰʀᴇᴇ ꜰɪʀᴇ sᴛᴀʟᴋ*\n\n> Enter ID Free Fire\n\n\`Example: ${m.prefix}ffstalk 775417067\``)
    }
    
    m.react('🔍')
    
    try {
        const res = await axios.get(`https://api.goods.xyz/api/staltor/freefire?id=${encodeURIComponent(id)}`, {
            timeout: 30000
        })
        
        if (!res.data?.status || !res.data?.result) {
            m.react('❌')
            return m.reply(`❌ ID *${id}* not found`)
        }
        
        const r = res.data.result
        
        const caption = `🔥 *ꜰʀᴇᴇ ꜰɪʀᴇ sᴛᴀʟᴋ*\n\n` +
            `🎮 *Game:* ${r.game}\n` +
            `🆔 *User ID:* ${r.userId}\n` +
            `👤 *Nickname:* ${r.nickname}`
        
        m.react('✅')
        await m.reply(caption)
        
    } catch (error) {
        m.react('☢')
        m.reply(te(m.prefix, m.command, m.pushName))
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
