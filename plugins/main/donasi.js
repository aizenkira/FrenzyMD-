const config = require('../../config')
const path = require('path')
const fs = require('fs')
const fetch = require('node-fetch')

const pluginConfig = {
    name: 'donasi',
    alias: ['donate', 'donation', 'support', 'saweria', 'trakteer'],
    category: 'main',
    description: 'Donation information to support the bot with QRIS',
    usage: '.donasi',
    example: '.donasi',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energy: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    const botName = config.bot?.name || 'Frenzy-AI'
    const ownerName = config.owner?.name || 'Owner'
    const saluranId = config.saluran?.id || '120363406397452589@newsletter'
    const saluranName = config.saluran?.name || botName
    
    const donasiConfig = config.donasi || {}
    const payments = donasiConfig.payment || []
    const links = donasiConfig.links || []
    const qrisUrl = donasiConfig.qris || ''
    const benefits = donasiConfig.benefits || [
        'Mendukung development',
        'Server lebih stabil',
        'Feature new lebih fast',
        'Priority support'
    ]
    
    let text = `DONASI KE OWNER ${botName} 🙏`
    
    if (payments.length > 0 || links.length > 0) {
        text += `Payment\n`
        for (const pay of payments) {
            text += `🏦 *${pay.name?.toLowerCase().split('').map((c,i) => i === 0 ? c.toUpperCase() : c).join('')}*\n`
            text += `◦ ${pay.number} (a/n ${pay.holder})\n`
        }
        
        for (const link of links) {
            const icons = { saweria: '☕', trakteer: '🍵', paypal: '💰', default: '🔗' }
            const icon = icons[link.name?.toLowerCase()] || icons.default
            text += `${icon} *${link.name}*\n`
            text += `${link.url}\n`
        }
    } else {
        text += `╭┈┈⬡「 💳 *ᴘᴀʏᴍᴇɴᴛ* 」\n`
        text += `┃\n`
        text += `┃ > Not yet inkonfigurasi\n`
        text += `┃ > Eint config.donasi\n`
        text += `┃\n`
        text += `╰┈┈┈┈┈┈┈┈⬡\n\n`
    }
    
    text += `🎁 *ʙᴇɴᴇꜰɪᴛ*\n`
    for (const benefit of benefits) {
        text += `◦ ${benefit}\n`
    }
    text += `\n`
    
    text += `_Donasi berwhatsoever very valuable_\n`
    text += `Contact: @${config.owner?.number?.[0] || 'owner'}`
    
    const copyButtons = payments.map(pay => ({
        name: 'cta_copy',
        buttonParamsJson: JSON.stringify({
            insplay_text: `📋 Copy No. ${pay.name}`,
            copy_code: pay.number
        })
    }))
    
    const contextInfo = {
        mentionedJid: config.owner?.number?.[0] ? [`${config.owner.number[0]}@s.whatsapp.net`] : [],
        forwardingScore: 9999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
            newsletterJid: saluranId,
            newsletterName: saluranName,
            serverMessageId: 127
        }
    }
    
    if (qrisUrl) {
        try {
            const response = await fetch(qrisUrl)
            const qrisBuffer = Buffer.from(await response.arrayBuffer())
            
            await sock.sendButton(m.chat, qrisBuffer, text, m, {
                buttons: copyButtons
            })
        } catch (e) {
            await sock.sendButton(m.chat, null, text, m, {
                buttons: copyButtons
            })
        }
    } else {
        await sock.sendMessage(m.chat, {
            text: text,
            footer: botName,
            contextInfo: contextInfo,
            interactiveButtons: copyButtons
        }, { quoted: m })
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
