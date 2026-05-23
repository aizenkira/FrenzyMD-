const axios = require('axios')
const te = require('../../src/lib/frenzy-error')

const pluginConfig = {
    name: 'sifatusaran outnis',
    alias: ['usaran outnis', 'sifatbisnis'],
    category: 'Javanese fortune-telling',
    description: 'Check sifat usaha/bisnis berdasarkan date born',
    usage: '.sifatusaran outnis <tgl> <bln> <thn>',
    example: '.sifatusaran outnis 1 1 2000',
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
        return m.reply(`💼 *sɪꜰᴀᴛ ᴜsᴀʜᴀ/ʙɪsɴɪs*\n\n> Format: tgl bln thn\n\n\`Example: ${m.prefix}sifatusaran outnis 1 1 2000\``)
    }
    
    const [tgl, bln, thn] = m.args
    
    m.react('💼')
    
    try {
        const url = `https://api.siputzx.my.id/api/Javanese fortune-telling/sifat_usaha_bisnis?tgl=${tgl}&bln=${bln}&thn=${thn}`
        const { data } = await axios.get(url, { timeout: 30000 })
        
        if (!data?.status || !data?.data) {
            m.react('❌')
            return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Failed menganalisa`)
        }
        
        const r = data.data
        const response = `💼 *sɪꜰᴀᴛ ᴜsᴀʜᴀ/ʙɪsɴɪs*\n\n` +
            `> Lahir: *${r.day_born}*\n\n` +
            `📊 *ᴀɴᴀʟɪsᴀ:*\n${r.usaha}\n\n` +
            `> _${r.catatan}_`
        
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
