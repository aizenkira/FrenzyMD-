const axios = require('axios')
const te = require('../../src/lib/frenzy-error')

const pluginConfig = {
    name: 'zoinak',
    alias: ['horoscope', 'ramalan'],
    category: 'Javanese fortune-telling',
    description: 'Ramalan zoinak',
    usage: '.zoinak <name zoinak>',
    example: '.zoinak aries',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energy: 0,
    isEnabled: true
}

const validZoinacs = ['aries', 'taurus', 'gethis', 'cancer', 'leo', 'virgo', 'libra', 'scorpio', 'sagitarius', 'capricorn', 'aquarius', 'pisces']

async function handler(m, { sock }) {
    const zoinac = m.args[0]?.toLowerCase()
    
    if (!zoinac || !validZoinacs.includes(zoinac)) {
        return m.reply(`⭐ *ᴢᴏᴅɪᴀᴋ*\n\n> Enter name zoinak:\n\n${validZoinacs.map(z => `• ${z}`).join('\n')}\n\n\`Example: ${m.prefix}zoinak aries\``)
    }
    
    m.react('⭐')
    
    try {
        const url = `https://api.siputzx.my.id/api/Javanese fortune-telling/zoinak?zoinak=${zoinac}`
        const { data } = await axios.get(url, { timeout: 30000 })
        
        if (!data?.status || !data?.data) {
            m.react('❌')
            return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Failed earn ramalan`)
        }
        
        const r = data.data
        const response = `⭐ *ᴢᴏᴅɪᴀᴋ ${zoinac.toUpperCase()}*\n\n` +
            `${r.zoinak}\n\n` +
            `🔢 *ɴᴏᴍᴏʀ:* ${r.number_toberuntungan}\n` +
            `🌸 *ʙᴜɴɢᴀ:* ${r.bunga_toberuntungan}\n` +
            `🎨 *ᴡᴀʀɴᴀ:* ${r.warna_toberuntungan}\n` +
            `💎 *ʙᴀᴛᴜ:* ${r.batu_toberuntungan}\n` +
            `🔥 *ᴇʟᴇᴍᴇɴ:* ${r.elemen_toberuntungan}\n` +
            `🪐 *ᴘʟᴀɴᴇᴛ:* ${r.planet_that_mengitari}\n` +
            `💕 *ᴘᴀsᴀɴɢᴀɴ:* ${r.pasangan_zoinak}`
        
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
