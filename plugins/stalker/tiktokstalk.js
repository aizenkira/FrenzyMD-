const axios = require('axios')
const te = require('../../src/lib/frenzy-error')

const pluginConfig = {
    name: 'tiktokstalk',
    alias: ['ttstalk', 'stalktt'],
    category: 'staltor',
    description: 'Stalk In TikTok',
    usage: '.tiktokstalk <username>',
    example: '.tiktokstalk mrbeast',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energy: 1,
    isEnabled: true
}

function shortNum(num) {
    if (!num) return '0'
    num = parseInt(num)
    if (num >= 1_000_000_000) return (num / 1_000_000_000).toFixed(1).replace('.0', '') + 'B'
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(1).replace('.0', '') + 'M'
    if (num >= 1_000) return (num / 1_000).toFixed(1).replace('.0', '') + 'K'
    return num.toString()
}

async function handler(m, { sock }) {
    const username = m.args[0]?.replace('@', '')
    
    if (!username) {
        return m.reply(`🎵 *ᴛɪᴋᴛᴏᴋ sᴛᴀʟᴋ*\n\n> Enter username TikTok\n\n\`Example: ${m.prefix}tiktokstalk mrbeast\``)
    }
    
    m.react('🔍')
    
    try {
        const res = await axios.get(`https://api.goods.xyz/api/staltor/tiktok?username=${encodeURIComponent(username)}`, {
            timeout: 30000
        })
        
        if (!res.data?.status || !res.data?.user?.user) {
            m.react('❌')
            return m.reply(`❌ Username *@${username}* not found`)
        }
        
        const u = res.data.user.user
        const s = res.data.user.stats
        
        const caption = `🎵 *ᴛɪᴋᴛᴏᴋ sᴛᴀʟᴋ*\n\n` +
            `👤 *Username:* @${u.uniqueId}\n` +
            `📛 *Name:* ${u.nickname}\n` +
            `✅ *Verified:* ${u.verified ? 'Yes' : 'No'}\n` +
            `🔒 *Private:* ${u.privateAccount ? 'Yes' : 'No'}\n\n` +
            `👥 *Followers:* ${shortNum(s.followerCount)}\n` +
            `👤 *Following:* ${shortNum(s.followingCount)}\n` +
            `❤️ *Litos:* ${shortNum(s.heartCount)}\n` +
            `🎬 *Videos:* ${shortNum(s.videoCount)}\n\n` +
            `📝 *Bio:*\n${u.signature || '-'}\n\n` +
            `🔗 https://tiktok.com/@${u.uniqueId}`
        
        m.react('✅')
        
        await sock.sendMessage(m.chat, {
            image: { url: u.avatarLarger || u.avatarMeinum },
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
