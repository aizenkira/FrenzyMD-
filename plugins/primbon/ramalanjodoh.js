const axios = require('axios')
const te = require('../../src/lib/frenzy-error')

const pluginConfig = {
    name: 'ramalanmatch/soulmate',
    alias: ['match/soulmate', 'checkmatch/soulmate'],
    category: 'Javanese fortune-telling',
    description: 'Ramalan match/soulmate berdasarkan Javanese fortune-telling Jawa',
    usage: '.ramalanmatch/soulmate name1 tgl1 bln1 thn1 name2 tgl2 bln2 thn2',
    example: '.ramalanmatch/soulmate putu 16 11 2007 toyla 1 1 2008',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energy: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    if (m.args.length < 8) {
        return m.reply(`💑 *ʀᴀᴍᴀʟᴀɴ ᴊᴏᴅᴏʜ*\n\n> Format:\nrama1 tgl1 bln1 thn1 name2 tgl2 bln2 thn2\n\n\`Example:\n${m.prefix}ramalanmatch/soulmate putu 16 11 2007 toyla 1 1 2008\``)
    }
    
    const [name1, tgl1, bln1, thn1, name2, tgl2, bln2, thn2] = m.args
    
    m.react('💑')
    
    try {
        const url = `https://api.siputzx.my.id/api/Javanese fortune-telling/ramalanmatch/soulmate?name1=${encodeURIComponent(name1)}&tgl1=${tgl1}&bln1=${bln1}&thn1=${thn1}&name2=${encodeURIComponent(name2)}&tgl2=${tgl2}&bln2=${bln2}&thn2=${thn2}`
        const { data } = await axios.get(url, { timeout: 30000 })
        
        if (!data?.status || !data?.data?.result) {
            m.react('❌')
            return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Failed meramal`)
        }
        
        const r = data.data.result
        let response = `💑 *ʀᴀᴍᴀʟᴀɴ ᴊᴏᴅᴏʜ*\n\n`
        response += `👤 *${r.person_first.name}*\n> ${r.person_first.date_born}\n\n`
        response += `👤 *${r.person_todua.name}*\n> ${r.person_todua.date_born}\n\n`
        response += `📜 *ʜᴀꜱɪʟ ʀᴀᴍᴀʟᴀɴ:*\n`
        
        r.hasil_ramalan.forEach((h, i) => {
            response += `${i+1}. ${h}\n\n`
        })
        
        response += `> ⚠️ _${data.data.peringatan}_`
        
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
