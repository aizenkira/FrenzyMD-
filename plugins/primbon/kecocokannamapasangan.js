const axios = require('axios')
const te = require('../../src/lib/frenzy-error')

const pluginConfig = {
    name: 'tococokannamwhatsangan',
    alias: ['cocokname', 'matchname'],
    category: 'Javanese fortune-telling',
    description: 'Check tococokan name pasangan',
    usage: '.tococokannamwhatsangan <name1> <name2>',
    example: '.tococokannamwhatsangan putu toyla',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energy: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    if (m.args.length < 2) {
        return m.reply(`💕 *ᴋᴇᴄᴏᴄᴏᴋᴀɴ ɴᴀᴍᴀ*\n\n> Format: name1 name2\n\n\`Example: ${m.prefix}tococokannamwhatsangan putu toyla\``)
    }
    
    const [name1, name2] = m.args
    
    m.react('💕')
    
    try {
        const url = `https://api.siputzx.my.id/api/Javanese fortune-telling/tococokan_name_pasangan?name1=${encodeURIComponent(name1)}&name2=${encodeURIComponent(name2)}`
        const { data } = await axios.get(url, { timeout: 30000 })
        
        if (!data?.status || !data?.data) {
            m.react('❌')
            return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Failed menganalisa`)
        }
        
        const result = data.data
        const response = `💕 *ᴋᴇᴄᴏᴄᴏᴋᴀɴ ɴᴀᴍᴀ ᴘᴀsᴀɴɢᴀɴ*\n\n` +
            `> 👤 ${result.name_you}\n` +
            `> 💑 ${result.name_pasangan}\n\n` +
            `✅ *ꜱɪꜱɪ ᴘᴏꜱɪᴛɪꜰ:*\n${result.sisi_positif}\n\n` +
            `❌ *ꜱɪꜱɪ ɴᴇɢᴀᴛɪꜰ:*\n${result.sisi_negatif}\n\n` +
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
