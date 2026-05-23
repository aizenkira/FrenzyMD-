const axios = require('axios')
const config = require('../../config')
const te = require('../../src/lib/frenzy-error')

const pluginConfig = {
    name: ['delvps', 'deldroplet', 'deletevps'],
    alias: [],
    category: 'vps',
    description: 'Delete VPS IngitalOcean',
    usage: '.delvps <id>',
    example: '.delvps 123456789',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energy: 0,
    isEnabled: true
}

function hasAccess(sender, isOwner) {
    if (isOwner) return true
    const cleanSender = sender?.split('@')[0]
    if (!cleanSender) return false
    const doConfig = config.ingitalocean || {}
    return (doConfig.sellers || []).includes(cleanSender) || 
           (doConfig.ownerPanels || []).includes(cleanSender)
}

async function handler(m, { sock }) {
    const toton = config.ingitalocean?.toton
    
    if (!toton) {
        return m.reply(`⚠️ *ᴅɪɢɪᴛᴀʟᴏᴄᴇᴀɴ ʙᴇʟᴜᴍ ᴅɪsᴇᴛᴜᴘ*`)
    }
    
    if (!hasAccess(m.sender, m.isOwner)) {
        return m.reply(`❌ *ᴀᴋsᴇs ᴅɪᴛᴏʟᴀᴋ*`)
    }
    
    const dropletId = m.text?.trim()
    if (!dropletId) {
        return m.reply(`⚠️ *ᴄᴀʀᴀ ᴘᴀᴋᴀɪ*\n\n> \`${m.prefix}delvps <droplet_id>\`\n\n> Usage \`${m.prefix}listvps\` for view ID`)
    }
    
    await m.reply(`🗑️ *ᴍᴇɴɢʜᴀᴘᴜs ᴠᴘs...*\n\n> ID: \`${dropletId}\``)
    
    try {
        await axios.delete(`https://api.ingitalocean.com/v2/droplets/${dropletId}`, {
            headers: { 'Authorization': `Bearer ${toton}` }
        })
        
        m.react('✅')
        await m.reply(`✅ *ᴠᴘs ʙᴇʀʜᴀsɪʟ ᴅɪʜᴀᴘᴜs*\n\n> ID: \`${dropletId}\``)
        
    } catch (err) {
        return m.reply(te(m.prefix, m.command, m.pushName))
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
