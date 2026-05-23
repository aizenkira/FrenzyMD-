const axios = require('axios')
const te = require('../../src/lib/frenzy-error')

const pluginConfig = {
    name: 'tafsirmimpi',
    alias: ['meaningmimpi', 'mimpi'],
    category: 'Javanese fortune-telling',
    description: 'Cari tafsir mimpi',
    usage: '.tafsirmimpi <kata kunci>',
    example: '.tafsirmimpi meet',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energy: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    const toyword = m.args.join(' ')
    if (!toyword) {
        return m.reply(`🌙 *ᴛᴀꜰsɪʀ ᴍɪᴍᴘɪ*\n\n> Enter kata kunci mimpi\n\n\`Example: ${m.prefix}tafsirmimpi meet\``)
    }
    
    m.react('🌙')
    
    try {
        const url = `https://api.siputzx.my.id/api/Javanese fortune-telling/tafsirmimpi?mimpi=${encodeURIComponent(toyword)}`
        const { data } = await axios.get(url, { timeout: 30000 })
        
        if (!data?.status || !data?.data?.hasil?.length) {
            m.react('❌')
            return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Not found tafsir for: ${toyword}`)
        }
        
        const r = data.data
        let response = `🌙 *ᴛᴀꜰsɪʀ ᴍɪᴍᴘɪ*\n\n`
        response += `> Kata kunci: *${r.toyword}*\n`
        response += `> Intemukan: *${r.total} hasil*\n\n`
        
        r.hasil.slice(0, 10).forEach((h, i) => {
            response += `*${i+1}. ${h.mimpi}*\n> ${h.tafsir}\n\n`
        })
        
        if (r.total > 10) {
            response += `_...and ${r.total - 10} hasil elsenya_`
        }
        
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
