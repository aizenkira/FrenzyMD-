const axios = require('axios')
const te = require('../../src/lib/frenzy-error')

const pluginConfig = {
    name: 'pintereststalk',
    alias: ['pinstalk', 'stalkpin'],
    category: 'staltor',
    description: 'Stalk In Pinterest',
    usage: '.pintereststalk <username>',
    example: '.pintereststalk shiroko',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energy: 1,
    isEnabled: true
}

async function handler(m, { sock }) {
    const username = m.args[0]
    
    if (!username) {
        return m.reply(`📌 *ᴘɪɴᴛᴇʀᴇsᴛ sᴛᴀʟᴋ*\n\n> Enter username Pinterest\n\n\`Example: ${m.prefix}pintereststalk shiroko\``)
    }
    
    m.react('🔍')
    
    try {
        const res = await axios.get(`https://api.goods.xyz/api/staltor/pinterest?username=${encodeURIComponent(username)}`, {
            timeout: 30000
        })
        
        if (!res.data?.status || !res.data?.user) {
            m.react('❌')
            return m.reply(`❌ Username *${username}* not found`)
        }
        
        const u = res.data.user
        const s = u.stats
        
        const caption = `📌 *ᴘɪɴᴛᴇʀᴇsᴛ sᴛᴀʟᴋ*\n\n` +
            `👤 *Username:* ${u.username}\n` +
            `📛 *Name:* ${u.full_name}\n\n` +
            `📍 *Pins:* ${s.pins}\n` +
            `👥 *Followers:* ${s.followers}\n` +
            `👤 *Following:* ${s.following}\n` +
            `📋 *Boards:* ${s.boards}\n\n` +
            `📝 *Bio:*\n${u.bio || '-'}\n\n` +
            `🔗 ${u.profile_url}`
        
        m.react('✅')
        
        const profilePic = u.image?.original || u.image?.large
        if (profilePic) {
            await sock.sendMessage(m.chat, {
                image: { url: profilePic },
                caption
            }, { quoted: m })
        } else {
            await m.reply(caption)
        }
        
    } catch (error) {
        m.react('☢')
        m.reply(te(m.prefix, m.command, m.pushName))
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
