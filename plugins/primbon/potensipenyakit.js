const axios = require('axios')
const te = require('../../src/lib/frenzy-error')

const pluginConfig = {
    name: 'potensipenyakit',
    alias: ['checkpenyakit', 'penyakit'],
    category: 'Javanese fortune-telling',
    description: 'Check potensi penyakit berdasarkan date born',
    usage: '.potensipenyakit <tgl> <bln> <thn>',
    example: '.potensipenyakit 12 05 1998',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energy: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    if (m.args.length < 3) {
        return m.reply(`🏥 *ᴘᴏᴛᴇɴsɪ ᴘᴇɴʏᴀᴋɪᴛ*\n\n> Format: tgl bln thn\n\n\`Example: ${m.prefix}potensipenyakit 12 05 1998\``)
    }
    
    const [tgl, bln, thn] = m.args
    
    m.react('🏥')
    
    try {
        const url = `https://api.siputzx.my.id/api/Javanese fortune-telling/check_potensi_penyakit?tgl=${tgl}&bln=${bln}&thn=${thn}`
        const { data } = await axios.get(url, { timeout: 30000 })
        
        if (!data?.status || !data?.data) {
            m.react('❌')
            return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Failed menganalisa`)
        }
        
        const result = data.data
        const response = `🏥 *ᴘᴏᴛᴇɴsɪ ᴘᴇɴʏᴀᴋɪᴛ*\n\n` +
            `> Date: *${tgl}-${bln}-${thn}*\n\n` +
            `📊 *ᴇʟᴇᴍᴇɴ:*\n${result.sektor}\n\n` +
            `⚠️ *ᴘᴏᴛᴇɴsɪ:*\n${result.elemen}\n\n` +
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
