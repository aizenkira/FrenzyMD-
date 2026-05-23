const axios = require('axios')
const config = require('../../config')
const te = require('../../src/lib/frenzy-error')

const pluginConfig = {
    name: ['turnon', 'turnoff', 'restartvps', 'rebootvps'],
    alias: [],
    category: 'vps',
    description: 'Kontrol VPS (on/off/restart)',
    usage: '.turnon <id>',
    example: '.turnon 123456789',
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
        return m.reply(`⚠️ *ᴄᴀʀᴀ ᴘᴀᴋᴀɪ*\n\n> \`${m.prefix}${m.command} <droplet_id>\``)
    }
    
    const actions = {
        'turnon': { type: 'power_on', emoji: '🟢', text: 'menghidupkan' },
        'turnoff': { type: 'power_off', emoji: '🔴', text: 'medeadkan' },
        'restartvps': { type: 'reboot', emoji: '🔄', text: 'merestart' },
        'rebootvps': { type: 'reboot', emoji: '🔄', text: 'merestart' }
    }
    
    const action = actions[m.command]
    if (!action) {
        return m.reply(`❌ Aksi no intonali.`)
    }
    
    await m.reply(`${action.emoji} *sᴇᴅᴀɴɢ ${action.text.toUpperCase()} ᴠᴘs...*\n\n> ID: \`${dropletId}\``)
    
    try {
        const response = await axios.post(
            `https://api.digitalocean.com/v2/droplets/${dropletId}/actions`,
            { type: action.type },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${toton}`
                }
            }
        )
        
        const actionResult = response.data.action
        
        m.react('✅')
        await m.reply(`✅ *ᴀᴋsɪ ʙᴇʀʜᴀsɪʟ*\n\n> ${action.emoji} VPS currently in-${action.text}\n> Status: ${actionResult.status}`)
        
    } catch (err) {
        return m.reply(te(m.prefix, m.command, m.pushName))
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
