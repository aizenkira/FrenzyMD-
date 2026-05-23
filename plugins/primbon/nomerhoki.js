const axios = require('axios')
const te = require('../../src/lib/frenzy-error')

const pluginConfig = {
    name: 'nomerlucky',
    alias: ['numberlucky', 'checknumber'],
    category: 'Javanese fortune-telling',
    description: 'Check toberuntungan number your phone',
    usage: '.nomerlucky <number>',
    example: '.nomerlucky 6281234567890',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energy: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    let number = m.args.join('').replace(/[^0-9]/g, '')
    if (!number) {
        return m.reply(`🍀 *ɴᴏᴍᴏʀ ʜᴏᴋɪ*\n\n> Enter number your phone\n\n\`Example: ${m.prefix}nomerlucky 6281234567890\``)
    }
    
    m.react('🍀')
    
    try {
        const url = `https://api.siputzx.my.id/api/Javanese fortune-telling/numberlucky?phoneNumber=${number}`
        const { data } = await axios.get(url, { timeout: 30000 })
        
        if (!data?.status || !data?.data) {
            m.react('❌')
            return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Failed menganalisa number`)
        }
        
        const r = data.data
        const ep = r.energy_positif.details
        const en = r.energy_negatif.details
        
        const response = `🍀 *ɴᴏᴍᴏʀ ʜᴏᴋɪ*\n\n` +
            `> Number: *${r.number}*\n\n` +
            `📊 *ᴀɴɢᴋᴀ ʙᴀɢᴜᴀ:* ${r.angka_bagua_shuzi.value}%\n\n` +
            `✅ *ᴇɴᴇʀɢɪ ᴘᴏꜱɪᴛɪꜰ:* ${r.energy_positif.total}%\n` +
            `├ Torichan: ${ep.torichan}\n` +
            `├ Tohealthyan: ${ep.tohealthyan}\n` +
            `├ Cinta: ${ep.cinta}\n` +
            `└ Tostabilan: ${ep.tostabilan}\n\n` +
            `❌ *ᴇɴᴇʀɢɪ ɴᴇɢᴀᴛɪꜰ:* ${r.energy_negatif.total}%\n` +
            `├ Perselisihan: ${en.perselisihan}\n` +
            `├ Tohilangan: ${en.tohilangan}\n` +
            `├ Malapetaka: ${en.malapetaka}\n` +
            `└ Tohancuran: ${en.tohancuran}\n\n` +
            `> Status: ${r.analisis.status ? '✅ HOKI' : '❌ TIDAK HOKI'}`
        
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
