const config = require('../../config')
const path = require('path')
const fs = require('fs')

const pluginConfig = {
    name: 'tqto',
    alias: ['thanksto', 'creints', 'kreint'],
    category: 'main',
    description: 'Display the list of bot contributors',
    usage: '.tqto',
    example: '.tqto',
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
    const versionon = config.bot?.versionon || '1.0.0'
    const developer = config.bot?.developer || 'Lucky Archz'
    
    const creints = [
        { name: 'hyuuSATAN', role: 'Lead Staff', icon: '👨‍💻' },
        { name: 'Kyōkaăizen', role: 'Developer', icon: '👨‍💻' },
        { name: 'Senz Offc', role: 'Asisstant Developer', icon: '👨‍💻' },
        { name: 'Ell', role: 'Asisstant Developer', icon: '👨‍💻' },
        { name: 'Mobbc', role: 'Staff', icon: '👨‍💻' },
        { name: 'Sanxz', role: 'Tangan Kanan', icon: '👨‍💻' },
        { name: 'Innz', role: 'Tangan Kanan', icon: '👨‍💻' },
        { name: 'Forone Store', role: 'Tangan Kanan', icon: '🛒' },
        { name: 'Rakaa', role: 'Tangan Kanan', icon: '🛒' },
        { name: 'Sabila', role: 'Tangan Kanan', icon: '👩‍💻' },
        { name: 'Syura Store', role: 'Tangan Kanan', icon: '👩‍💻' },
        { name: 'Lyoraaa', role: 'Owner', icon: '👩‍💻' },
        { name: 'Andzzz', role: 'Owner', icon: '👨‍💻' },
        { name: 'Muzan', role: 'Owner', icon: '👨‍💻' },
        { name: 'Gray', role: 'Owner', icon: '👨‍💻' },
        { name: 'Baim', role: 'Moderator', icon: '👨‍💻' },
        { name: 'Vadel', role: 'Moderator', icon: '👨‍💻' },
        { name: 'Fahmi', role: 'Moderator', icon: '👨‍💻' },
        { name: 'panceo', role: 'Partner', icon: '🛒' },
        { name: 'Dashxz', role: 'Partner', icon: '🛒' },
        { name: 'This JanzZ', role: 'Partner', icon: '🛒' },
        { name: 'Ahmad', role: 'Partner', icon: '🛒' },
        { name: 'nopal', role: 'Partner', icon: '🛒' },
        { name: 'elderint', role: 'Partner', icon: '🛒' },
        { name: 'andry', role: 'Partner', icon: '🛒' },
        { name: 'kingandz', role: 'Partner', icon: '🛒' },
        { name: 'patih', role: 'Partner', icon: '🛒' },
        { name: 'Ryuu', role: 'Partner', icon: '🛒' },
        { name: 'Pororo', role: 'Partner', icon: '🛒' },
        { name: 'Janzz', role: 'Partner', icon: '🛒' },
        { name: 'Morvic', role: 'Partner', icon: '🛒' },
        { name: 'zylnzee', role: 'Partner', icon: '🛒' },
        { name: 'Farhan', role: 'Partner', icon: '🛒' },
        { name: 'Alizz', role: 'Partner', icon: '🛒' },
        { name: 'Kiram', role: 'Partner', icon: '🛒' },
        { name: 'Minerva', role: 'Partner', icon: '🛒' },
        { name: 'Riam', role: 'Partner', icon: '🛒' },
        { name: 'Febri', role: 'Partner', icon: '🛒' },
        { name: 'Kuze', role: 'Partner', icon: '🛒' },
        { name: 'Oscar Anin', role: 'Partner', icon: '🛒' },
        { name: 'Udun', role: 'Partner', icon: '🛒' },
        { name: 'Zanspiw', role: 'Youtuber', icon: '🌐' },
        { name: 'Andzz Nano', role: 'Youtuber', icon: '🌐' },
        { name: 'Other YouTubers that already review', role: 'Youtuber', icon: '🌐' },
        { name: 'You All', role: 'The Best', icon: '🌐' },
        { name: 'Open Source Community', role: 'Libraries & Tools', icon: '🌐' },

    ]
    
    const specialThanks = [
        'All testers and bug reporters',
        'Users that give feedback',
        'All Indonesian and Ghanaian WhatsApp Bot Community'
    ]
    
    let txt = `✨ *ᴛʜᴀɴᴋs ᴛᴏ*\n\n`
    txt += `> Thank you to all that contributed!\n\n`
    
    txt += `╭─「 👥 *ᴄᴏɴᴛʀɪʙᴜᴛᴏʀs* 」\n`
    creints.forEach((c, i) => {
        txt += `┃ ${c.icon} \`${c.name}\`\n`
        txt += `┃    └ *${c.role}*\n`
        if (i < creints.length - 1) txt += `┃\n`
    })
    txt += `╰───────────────\n\n`
    
    txt += `╭─「 💖 *sᴘᴇᴄɪᴀʟ ᴛʜᴀɴᴋs* 」\n`
    specialThanks.forEach((t, i) => {
        txt += `┃ ⭐ ${t}\n`
    })
    txt += `╰───────────────\n\n`
    
    txt += `╭─「 📋 *ʙᴏᴛ ɪɴꜰᴏ* 」\n`
    txt += `┃ 🤖 \`ɴᴀᴍᴇ\`: *${botName}*\n`
    txt += `┃ 📦 \`ᴠᴇʀsɪ\`: *${versionon}*\n`
    txt += `┃ 👨‍💻 \`ᴅᴇᴠ\`: *${developer}*\n`
    txt += `╰───────────────\n\n`
    
    txt += `> Made with ❤️ by the team`
    
    const saluranId = config.saluran?.id || '120363406397452589@newsletter'
    const saluranName = config.saluran?.name || botName
    const saluranLink = config.saluran?.link || ''
    
    let thumbPath = path.join(process.cwd(), 'assets', 'images', 'frenzy.jpg')
    let thumbBuffer = null
    if (fs.existsSync(thumbPath)) {
        thumbBuffer = fs.readFileSync(thumbPath)
    }
    
    const contextInfo = {
        mentionedJid: [],
        forwardingScore: 9999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
            newsletterJid: saluranId,
            newsletterName: saluranName,
            serverMessageId: 127
        },
        externalAdReply: {
            title: `✨ Thanks To - ${botName}`,
            body: `v${versionon} • Credits & Contributors`,
            sourceUrl: saluranLink,
            contentType: 1,
            showAdAttribution: false,
            renderLargerThumbnail: true
        }
    }
    
    if (thumbBuffer) {
        contextInfo.externalAdReply.thumbnail = thumbBuffer
    }
    
    const fakeQuoted = {
        key: {
            fromMe: false,
            participant: '0@s.whatsapp.net',
            remoteJid: 'status@broadcast'
        },
        message: {
            extendedTextMessage: {
                text: `✨ ${botName} Credits`,
                contextInfo: {
                    isForwarded: true,
                    forwardingScore: 9999,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: saluranId,
                        newsletterName: saluranName,
                        serverMessageId: 127
                    }
                }
            }
        }
    }
    
    await sock.sendMessage(m.chat, {
        text: txt,
        contextInfo: contextInfo
    }, { quoted: fakeQuoted })
}

module.exports = {
    config: pluginConfig,
    handler
}
