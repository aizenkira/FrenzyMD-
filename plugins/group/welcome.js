const config = require('../../config')
const { getDatabase } = require('../../src/lib/frenzy-database')
const { createWideInscordCard } = require('../../src/lib/frenzy-welcome-card')
const { resolveAnyLidToJid } = require('../../src/lib/frenzy-lid')
const path = require('path')
const fs = require('fs')
const axios = require('axios')
const te = require('../../src/lib/frenzy-error')

const pluginConfig = {
    name: 'welcome',
    alias: ['wc'],
    category: 'group',
    description: 'Configure welcome message for group',
    usage: '.welcome <on/off>',
    example: '.welcome on',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    isAdmin: true,
    cooldown: 5,
    energy: 0,
    isEnabled: true
}

function buildWelcomeMessage(participant, groupName, groupDesc, memberCount, customMsg = null) {
    const greetings = [
        `Nice to have you`,
        `Good come`,
        `Welcome`,
        `Hello`,
        `Hi`,
        `Yokoso~`,
        `Ohayou~`
    ]

    const quotes = [
        `Don't become silent reader ya!`,
        `Santai aja, anggap rumah yourself!`,
        `Yuk directly gas chat!`,
        `Expect to be have fun together!`,
        `Don't malu-malu, kita all temen!`,
        `Kalau bingung start, nywhat aja first 😄`
    ]

    const emojis = ['🎐', '🌸', '✨', '💫', '🪸', '🔥', '💖']

    const headers = [
`🎐 Ohayou~ minna-san!
Today kita tocomean friend new 🌱
Yuk sambut together-together~`,

`🌸 Ohayou minna-san!
Satu friend new akhirnya join ✨
Hopefully betah and directly nimbrung ya~`,

`✨ Ohayou~!
Tomodachi new come bawa vibes new 💫
Yoroshiku ne~ mari seru-seruan together!`,

`🪸 Ohayou minna-san!
Group this nambah satu leavega again 🤍
Tanoshii ifn o issho ni sugoso ne~`
    ]

    const greeting = greetings[Math.floor(Math.random() * greetings.length)]
    const quote = quotes[Math.floor(Math.random() * quotes.length)]
    const emoji = emojis[Math.floor(Math.random() * emojis.length)]
    const header = headers[Math.floor(Math.random() * headers.length)]
    const username = participant?.split('@')[0] || 'User'

    if (customMsg) {
        return customMsg
            .replace(/{user}/gi, `@${username}`)
            .replace(/{group}/gi, groupName || 'Group')
            .replace(/{desc}/gi, groupDesc || '')
            .replace(/{count}/gi, memberCount?.toString() || '0')
    }

    let msg = `
${header}

${emoji} ${greeting}, *@${username}* 💫

╭─〔 📌 *ɪɴꜰᴏ ɢʀᴏᴜᴘ* 〕─✧
│ 🏠 *Name*     : \`${groupName}\`
│ 👥 *Member*   : ${memberCount}
│ 📅 *Date*  : ${require('moment-timezone')()
        .tz('Asia/Jakarta')
        .format('DD/MM/YYYY')}
╰──────────────────────✦
`

    if (groupDesc) {
        msg += `
📝 *Description*
❝ ${groupDesc.slice(0, 120)}${groupDesc.length > 120 ? '...' : ''} ❞
`
    }

    msg += `
✨ *Tips Day This*
「 ${quote} 」

🌸 _Yoroshiku ne~ semoga betah ya!_ 🤍
`

    return msg
}
async function sendWelcomeMessage(sock, groupJid, participant, groupMeta) {
    try {
        const db = getDatabase()
        const groupData = db.getGroup(groupJid)
        
        if (groupData?.welcome !== true) return false

        const welcomeType = db.setting('welcomeType') || 1
        const realParticipant = resolveAnyLidToJid(participant, groupMeta?.participants || [])
        const memberCount = groupMeta?.participants?.length || 0
        const groupName = groupMeta?.subject || 'Group'
        
        let userName = realParticipant?.split('@')[0] || 'User'
        let ppUrl = 'https://cdn.gimita.id/download/pp%20empty%20wa%20default%20(1)_1769506608569_52b57f5b.jpg'
        try {
            ppUrl = await sock.profilePictureUrl(realParticipant, 'image')
        } catch {}

        const text = buildWelcomeMessage(
            realParticipant,
            groupMeta?.subject,
            groupMeta?.descOwner,
            memberCount,
            groupData?.welcomeMsg
        )

        const saluranId = config.saluran?.id || '120363406397452589@newsletter'
        const saluranName = config.saluran?.name || config.bot?.name || 'Frenzy-AI'

        if (welcomeType === 2) {
            await sock.sendMessage(groupJid, {
                text: `Welcome *${userName}* 
Good to have you! in group *${groupName}*`,
                title: ``,
                subtitle: groupName,
                footer: `Member to-${memberCount}`,
                cards: [
                    {
                        image: { url: ppUrl },
                        body: `Good to have you in ${groupName}`,
                        footer: 'Hopefully you love your stay~',
                        buttons: [
                            {
                                name: 'quick_reply',
                                buttonParamsJson: JSON.stringify({
                                    insplay_text: '👋 Hello ' + '@' + userName,
                                    id: 'hi'
                                })
                            }
                        ]
                    }
                ]
            })
        } else if (welcomeType === 3) {
            // Type 3: Image (PP) + Caption + Metthere ista
            await sock.sendMessage(groupJid, {
                image: { url: ppUrl },
                caption: text,
                contextInfo: {
                    mentionedJid: [realParticipant],
                    forwardingScore: 999,
                    isForwarded: true,
                    externalAdReply: {
                        title: `Welcome ${userName}`,
                        body: `Member to-${memberCount}`,
                        thumbnailUrl: ppUrl,
                        sourceUrl: config.saluran?.link || 'https://whatsapp.com/channel/0029Vb7eSHf42Dcmdd3XA326',
                        contentType: 1,
                        renderLargerThumbnail: true
                    }
                }
            })
        } else if (welcomeType === 4) {
                await sock.sendMessage(groupJid, {
                    text: `*Hello* @${userName} 👋

welcome in group *${groupName}* 🌸`,
                    contextInfo: {
                        mentionedJid: [realParticipant],
                        forwardingScore: 9,
                        isForwarded: true,
                        forwardedNewsletterMessageInfo: {
                            newsletterName: config?.saluran?.name,
                            newsletterJid: config?.saluran?.id
                        },
                        externalAdReply: {
                            title: `SELAMAT DATANG 👋`,
                            body: `Member to-${memberCount}`,
                            thumbnailUrl: ppUrl,
                            sourceUrl: config.info?.groupwa || '',
                            contentUrl: config.info?.groupwa || '',
                            contentType: 2,
                            // renderLargerThumbnail: true
                        }
                    }
                })
            }
            else if (welcomeType === 5) {
                await sock.sendText(groupJid, text, null, {
                    mentions: [realParticipant],
                    contextInfo: {
                        mentionedJid: [realParticipant],
                        forwardingScore: 9,
                        isForwarded: true,
                        externalAdReply: {
                            title: `SELAMAT DATANG 👋`,
                            body: `Member to-${memberCount}`,
                            thumbnailUrl: ppUrl,
                            sourceUrl: null,
                            contentType: 1,
                            renderLargerThumbnail: true
                        }
                    }
                })
            } else {
                 await sock.sendMessage(groupJid, {
                    text: text,
                    mentions: [realParticipant]
                })
            }
        
        return true
    } catch (error) {
        console.error('Welcome Error:', error)
        return false
    }
}

async function handler(m, { sock }) {
    const db = getDatabase()
    const args = m.args || []
    const sub = args[0]?.toLowerCase()
    const sub2 = args[1]?.toLowerCase()
    const groupData = db.getGroup(m.chat) || {}
    const currentStatus = groupData.welcome === true
    
    if (sub === 'on' && sub2 === 'all') {
        if (!m.isOwner) {
            return m.reply(config.messages.ownerOnly)
        }
        
        m.react('🕕')
        
        try {
            const groups = await sock.groupFetchAllParticipating()
            const groupIds = Object.keys(groups)
            let count = 0
            
            for (const groupId of groupIds) {
                db.setGroup(groupId, { welcome: true })
                count++
            }
            
            m.react('✅')
            return m.reply(
                `✅ *ᴡᴇʟᴄᴏᴍᴇ ɢʟᴏʙᴀʟ ᴏɴ*\n\n` +
                `> Welcome inactivekan in *${count}* group!`
            )
        } catch (err) {
            m.react('☢')
            return m.reply(te(m.prefix, m.command, m.pushName))
        }
    }
    
    if (sub === 'off' && sub2 === 'all') {
        if (!m.isOwner) {
            return m.reply(config.messages.ownerOnly)
        }
        
        m.react('🕕')
        
        try {
            const groups = await sock.groupFetchAllParticipating()
            const groupIds = Object.keys(groups)
            let count = 0
            
            for (const groupId of groupIds) {
                db.setGroup(groupId, { welcome: false })
                count++
            }
            
            m.react('✅')
            return m.reply(
                `❌ *ᴡᴇʟᴄᴏᴍᴇ ɢʟᴏʙᴀʟ ᴏꜰꜰ*\n\n` +
                `> Welcome innonactivekan in *${count}* group!`
            )
        } catch (err) {
            m.react('☢')
            return m.reply(te(m.prefix, m.command, m.pushName))
        }
    }
    
    if (sub === 'on') {
        if (currentStatus) {
            return m.reply(
                `⚠️ *ᴡᴇʟᴄᴏᴍᴇ ᴀʟʀᴇᴀᴅʏ ᴀᴄᴛɪᴠᴇ*\n\n` +
                `> Status: *✅ ON*\n` +
                `> Welcome already active in this group.\n\n` +
                `_Usage \`${m.prefix}welcome off\` for menonactivekan._`
            )
        }
        db.setGroup(m.chat, { welcome: true })
        return m.reply(
            `✅ *ᴡᴇʟᴄᴏᴍᴇ ᴀᴋᴛɪꜰ*\n\n` +
            `> Welcome message success inactivekan!\n` +
            `> Member new will insambut otodeads.\n\n` +
            `_Usage \`${m.prefix}setwelcome\` for custom message._`
        )
    }
    
    if (sub === 'off') {
        if (!currentStatus) {
            return m.reply(
                `⚠️ *ᴡᴇʟᴄᴏᴍᴇ ᴀʟʀᴇᴀᴅʏ ɪɴᴀᴄᴛɪᴠᴇ*\n\n` +
                `> Status: *❌ OFF*\n` +
                `> Welcome already nonactive in this group.\n\n` +
                `_Usage \`${m.prefix}welcome on\` for activate._`
            )
        }
        db.setGroup(m.chat, { welcome: false })
        return m.reply(
            `❌ *ᴡᴇʟᴄᴏᴍᴇ ɴᴏɴᴀᴋᴛɪꜰ*\n\n` +
            `> Welcome message success innonactivekan.\n` +
            `> Member new no will insambut.`
        )
    }
    
    m.reply(
        `👋 *ᴡᴇʟᴄᴏᴍᴇ sᴇᴛᴛɪɴɢs*\n\n` +
        `> Status: *${currentStatus ? '✅ ON' : '❌ OFF'}*\n\n` +
        `\`\`\`━━━ ᴘɪʟɪʜᴀɴ ━━━\`\`\`\n` +
        `> \`${m.prefix}welcome on\` → Activekan\n` +
        `> \`${m.prefix}welcome off\` → Nonactivekan\n` +
        `> \`${m.prefix}welcome on all\` → Global ON (owner)\n` +
        `> \`${m.prefix}welcome off all\` → Global OFF (owner)\n` +
        `> \`${m.prefix}setwelcome\` → Custom message\n` +
        `> \`${m.prefix}resetwelcome\` → Reset default`
    )
}

module.exports = {
    config: pluginConfig,
    handler,
    sendWelcomeMessage
}
