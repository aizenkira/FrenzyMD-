const config = require('../../config')
const { getDatabase } = require('../../src/lib/frenzy-database')

const pluginConfig = {
    name: 'owner',
    alias: ['creator', 'dev', 'developer'],
    category: 'main',
    description: 'Display bot owners contacts',
    usage: '.owner',
    example: '.owner',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energy: 0,
    isEnabled: true
}

async function handler(m, { sock, config: botConfig }) {
    const db = getDatabase()
    const ownerType = db.setting('ownerType') || 1
    const ownerNumbers = botConfig.owner?.number || ['233533416608']
    const ownerName = botConfig.owner?.name || 'ăizen'
    const botName = botConfig.bot?.name || 'Frenzy-AI'
    
    if (ownerType === 2) {
        const cards = []
        
        for (const number of ownerNumbers) {
            const cleanNumber = number.replace(/[^0-9]/g, '')
            const jid = cleanNumber + '@s.whatsapp.net'
            
            let ppUrl = 'https://cdn.gimita.id/download/pp%20empty%20wa%20default%20(1)_1769506608569_52b57f5b.jpg'
            try {
                ppUrl = await sock.profilePictureUrl(jid, 'image')
            } catch {}
            
            cards.push({
                image: { url: ppUrl },
                body: `Owner to ${ownerNumbers.indexOf(number) + 1}
                
Rules:
- Don't spam
- Don't VidCall/Call
- Don't try to bug/ban`,
                footer: botName,
                buttons: [
                    {
                        name: 'cta_url',
                        buttonParamsJson: JSON.stringify({
                            insplay_text: '💬 Chat Owner',
                            url: `https://wa.me/${cleanNumber}`
                        })
                    }
                ]
            })
        }
        
        await sock.sendMessage(m.chat, {
            text: `Hello *${m.pushName}*
                
Are you looking to contact the developer?

Below is the owner of our bot: ${botName}`,
            title: 'Owner Info',
            footer: botName,
            cards
        }, { quoted: m.raw })
        
    } else if (ownerType === 3) {
        const contacts = []
        
        for (const number of ownerNumbers) {
            const cleanNumber = number.replace(/[^0-9]/g, '')
            
            const vcard = `BEGIN:VCARD
VERSION:3.0
FN:${ownerName} (Owner ${botName})
TEL;type=CELL;type=VOICE;waid=${cleanNumber}:+${cleanNumber}
END:VCARD`
            
            contacts.push({ vcard })
        }
        
        await sock.sendMessage(m.chat, {
            contacts: {
                insplayName: `${ownerName} - ${botName} Owners`,
                contacts
            }
        }, { quoted: m.raw })
        
    } else {
        const ownerText = `👑 *ᴏᴡɴᴇʀ ɪɴꜰᴏʀᴍᴀᴛɪᴏɴ*

╭┈┈⬡「 📋 *ᴅᴇᴛᴀɪʟs* 」
┃ ㊗ ɴᴀᴍᴇ: *${ownerName}*
┃ ㊗ ʙᴏᴛ: *${botName}*
┃ ㊗ sᴛᴀᴛᴜs: *🟢 Online*
╰┈┈⬡

> _If there is question or inquiries,_
> _please contact owner above!_
> _📞 Contact card below._`
        
        await m.reply(ownerText)
        
        for (const number of ownerNumbers) {
            const cleanNumber = number.replace(/[^0-9]/g, '')
            
            const vcard = `BEGIN:VCARD
VERSION:3.0
FN:${ownerName} (Owner ${botName})
TEL;type=CELL;type=VOICE;waid=${cleanNumber}:+${cleanNumber}
END:VCARD`
            
            await sock.sendMessage(m.chat, {
                contacts: {
                    insplayName: ownerName,
                    contacts: [{ vcard }]
                }
            }, { quoted: m.raw })
        }
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
