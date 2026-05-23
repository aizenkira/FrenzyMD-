const axios = require('axios')
const te = require('../../src/lib/frenzy-error')

const pluginConfig = {
    name: 'ytstalk',
    alias: ['youtubestalk', 'stalkyt'],
    category: 'staltor',
    description: 'Stalk channel YouTube',
    usage: '.ytstalk <username>',
    example: '.ytstalk mrbeast',
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
        return m.reply(`📺 *ʏᴏᴜᴛᴜʙᴇ sᴛᴀʟᴋ*\n\n> Enter username YouTube\n\n\`Example: ${m.prefix}ytstalk mrbeast\``)
    }
    
    m.react('🔍')
    
    try {
        const res = await axios.get(`https://api.goods.xyz/api/staltor/ytstalk?username=${encodeURIComponent(username)}`, {
            timeout: 30000
        })
        
        if (!res.data?.status || !res.data?.result) {
            m.react('❌')
            return m.reply(`❌ Channel *${username}* not found`)
        }
        
        const c = res.data.result.channelMetadata
        const videos = res.data.result.videoDataList
        
        let caption = `📺 *ʏᴏᴜᴛᴜʙᴇ sᴛᴀʟᴋ*\n\n` +
            `👤 *Username:* ${c.username}\n` +
            `👥 *Subscribers:* ${c.subscriberCount}\n` +
            `🎬 *Videos:* ${c.videoCount}\n\n` +
            `📝 *Description:*\n${c.description?.substring(0, 300) || '-'}${c.description?.length > 300 ? '...' : ''}\n\n` +
            `🔗 ${c.channelUrl}\n\n`
        
        if (videos?.length > 0) {
            caption += `📹 *ᴠɪᴅᴇᴏ ᴛᴇʀʙᴀʀᴜ:*\n`
            videos.slice(0, 5).forEach((v, i) => {
                caption += `${i+1}. ${v.title}\n   ⏱️ ${v.duration} | 👁️ ${v.viewCount}\n\n`
            })
        }
        
        m.react('✅')
        
        if (c.avatarUrl) {
            await sock.sendMessage(m.chat, {
                image: { url: c.avatarUrl },
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
