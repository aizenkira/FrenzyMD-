const config = require('../../config')
const fs = require('fs')
const path = require('path')
const fetch = require('node-fetch')

const pluginConfig = {
    name: 'payment',
    alias: ['pay', 'pay', 'retoning', 'rek'],
    category: 'store',
    description: 'Tampilkan metode payment with QRIS',
    usage: '.payment',
    example: '.payment',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energy: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    const payments = config.store?.payment || []
    const qrisUrl = config.store?.qris || ''
    
    if (payments.length === 0) {
        return m.reply(
            `💳 *ᴍᴇᴛᴏᴅᴇ ᴘᴇᴍʙᴀʏᴀʀᴀɴ*\n\n` +
            `> Not yet there is metode payment that inkonfigurasi\n\n` +
            `> Owner will added in \`config.js\`:\n` +
            `\`\`\`\nstore: {\n  payment: [\n    { name: 'You', number: '08xxx', holder: 'Name' }\n  ],\n  qris: 'https://link/qris.jpg'\n}\n\`\`\``
        )
    }
    
    let txt = `💳 *ᴍᴇᴛᴏᴅᴇ ᴘᴇᴍʙᴀʏᴀʀᴀɴ*\n\n`
    txt += `╭─「 💰 *ᴘɪʟɪʜᴀɴ* 」\n`
    
    for (const pay of payments) {
        txt += `┃\n`
        txt += `┃ 🏦 *${pay.name}*\n`
        txt += `┃ └ 📱 ${pay.number}\n`
        txt += `┃ └ 👤 a/n ${pay.holder}\n`
    }
    
    txt += `┃\n`
    txt += `╰───────────────\n\n`
    txt += `> After transfer, send bukti payment\n`
    txt += `> Confirdeadon to owner for process order`
    
    m.react('💳')
    
    const copyButtons = payments.map(pay => ({
        name: 'cta_copy',
        buttonParamsJson: JSON.stringify({
            insplay_text: `📋 Copy No. ${pay.name}`,
            copy_code: pay.number
        })
    }))
    
    if (qrisUrl) {
        try {
            const response = await fetch(qrisUrl)
            const qrisBuffer = Buffer.from(await response.arrayBuffer())
            
            await sock.sendMessage(m.chat, {
                image: qrisBuffer,
                caption: txt,
                footer: config.bot?.name || 'frenzy Store',
                interactiveButtons: copyButtons
            }, { quoted: m })
        } catch (e) {
            await sock.sendMessage(m.chat, {
                text: txt,
                footer: config.bot?.name || 'frenzy Store',
                interactiveButtons: copyButtons
            }, { quoted: m })
        }
    } else {
        await sock.sendMessage(m.chat, {
            text: txt,
            footer: config.bot?.name || 'frenzy Store',
            interactiveButtons: copyButtons
        }, { quoted: m })
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
