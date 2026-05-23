const axios = require('axios')
const te = require('../../src/lib/frenzy-error')

const pluginConfig = {
    name: 'githubstalk',
    alias: ['ghstalk', 'stalkgh'],
    category: 'staltor',
    description: 'Stalk In GitHub',
    usage: '.githubstalk <username>',
    example: '.githubstalk torvalds',
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
        return m.reply(`🐙 *ɢɪᴛʜᴜʙ sᴛᴀʟᴋ*\n\n> Enter username GitHub\n\n\`Example: ${m.prefix}githubstalk torvalds\``)
    }
    
    m.react('🔍')
    
    try {
        const res = await axios.get(`https://api.goods.xyz/api/staltor/github?username=${encodeURIComponent(username)}`, {
            timeout: 30000
        })
        
        if (!res.data?.status) {
            m.react('❌')
            return m.reply(`❌ Username *${username}* not found`)
        }
        
        const d = res.data
        
        const caption = `🐙 *ɢɪᴛʜᴜʙ sᴛᴀʟᴋ*\n\n` +
            `👤 *Username:* ${d.username}\n` +
            `📛 *Name:* ${d.nickname || '-'}\n` +
            `🏢 *Company:* ${d.company || '-'}\n` +
            `📍 *Location:* ${d.location || '-'}\n\n` +
            `📦 *Public Repos:* ${d.public_repo}\n` +
            `👥 *Followers:* ${d.followers}\n` +
            `👤 *Following:* ${d.following}\n\n` +
            `📝 *Bio:*\n${d.bio || '-'}\n\n` +
            `🔗 ${d.url}`
        
        m.react('✅')
        
        await sock.sendMessage(m.chat, {
            image: { url: d.profile_pic },
            caption
        }, { quoted: m })
        
    } catch (error) {
        m.react('☢')
        m.reply(te(m.prefix, m.command, m.pushName))
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
