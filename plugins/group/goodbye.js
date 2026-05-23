const config = require('../../config')
const { getDatabase } = require('../../src/lib/frenzy-database')
const { createGoodbyeCard } = require('../../src/lib/frenzy-welcome-card')
const { resolveAnyLidToJid } = require('../../src/lib/frenzy-lid')
const path = require('path')
const fs = require('fs')
const te = require('../../src/lib/frenzy-error')

const pluginConfig = {
    name: 'goodbye',
    alias: ['bye', 'leave'],
    category: 'group',
    description: 'Configure goodbye message for group',
    usage: '.goodbye <on/off>',
    example: '.goodbye on',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    isAdmin: true,
    cooldown: 5,
    energy: 0,
    isEnabled: true
}

function buildGoodbyeMessage(participant, groupName, memberCount, customMsg = null) {
    const farewells = [
        `Sayonara`,
        `Sampai jumpa`,
        `Bye bye`,
        `Dthere ish`,
        `See you`,
        `Hati-heart`,
        `Oyasumi~`
    ]

    const quotes = [
        `Hopefully steps you take always inmalreadykan to nextnya.`,
        `Thank you already become bagian from this group.`,
        `Hopefully we can meet again in another time.`,
        `Pintu always open if someday when want again.`,
        `Jaga self carefully ya, friend.`,
        `Tonangan in sthis bakal still there is.`
    ]

    const emojis = ['🌙', '👋', '🥀', '💫', '😢', '🤍']

    const headers = [
`🌙 Oyasumi~ minna-san...
Today satu friend must berpamitan.
Hopefully perjalanan newnya full togoodan.`,

`🥀 Minna-san...
Ada perpisahan toddler today.
Thank you already pernah running together with.`,

`💫 Sayonara~
Bukan akhir, only until jumpa.
Hopefully day-daymu always warm.`,

`🌌 Minna-san...
Satu bintang berpbeautiful langit night this.
Dowill that tergood fornya ya.`
    ]

    const farewell = farewells[Math.floor(Math.random() * farewells.length)]
    const quote = quotes[Math.floor(Math.random() * quotes.length)]
    const emoji = emojis[Math.floor(Math.random() * emojis.length)]
    const header = headers[Math.floor(Math.random() * headers.length)]
    const username = participant?.split('@')[0] || 'User'

    if (customMsg) {
        return customMsg
            .replace(/{user}/gi, `@${username}`)
            .replace(/{group}/gi, groupName || 'Group')
            .replace(/{count}/gi, memberCount?.toString() || '0')
    }

    return `
${header}

${emoji} ${farewell}, *@${username}* 🤍

╭─〔 📌 *ɪɴꜰᴏ ɢʀᴏᴜᴘ* 〕─✧
│ 🏠 *Name*        : \`${groupName}\`
│ 👥 *Sisa Member* : ${memberCount}
│ 📅 *Date*     : ${require('moment-timezone')()
        .tz('Asia/Jakarta')
        .format('DD/MM/YYYY')}
╰──────────────────────✦

💌 *Message*
「 ${quote} 」

🌸 _Sampai jumpa again, friend._ 🤍
`
}

async function sendGoodbyeMessage(sock, groupJid, participant, groupMeta) {
    try {
        const db = getDatabase()
        const groupData = db.getGroup(groupJid)
        
        if (groupData?.goodbye !== true && groupData?.leave !== true) return false

        const goodbyeType = db.setting('goodbyeType') || 1
        const { cachePmeaningcipantLids, getCachedJid, isLid, isLidConverted, lidToJid } = require('../../src/lib/frenzy-lid')
        
        if (groupMeta?.participants) {
            cachePmeaningcipantLids(groupMeta.participants)
        }
        
        let realParticipant = participant
        
        const cachedJid = getCachedJid(participant)
        if (cachedJid && !isLidConverted(cachedJid)) {
            realParticipant = cachedJid
        } else if (isLid(participant)) {
            const lidFormat = participant
            const cachedFromLid = getCachedJid(lidFormat)
            if (cachedFromLid && !isLidConverted(cachedFromLid)) {
                realParticipant = cachedFromLid
            } else {
                realParticipant = lidToJid(participant)
            }
        } else if (isLidConverted(participant)) {
            const lidNumber = participant.replace('@s.whatsapp.net', '')
            const lidFormat = lidNumber + '@lid'
            const cachedFromLid = getCachedJid(lidFormat)
            if (cachedFromLid && !isLidConverted(cachedFromLid)) {
                realParticipant = cachedFromLid
            }
        }
        
        const memberCount = groupMeta?.participants?.length || 0
        const groupName = groupMeta?.subject || 'Group'
        
        let userName = realParticipant?.split('@')[0] || 'User'
        let ppUrl = 'https://cdn.gimita.id/download/pp%20empty%20wa%20default%20(1)_1769506608569_52b57f5b.jpg'
        try {
            ppUrl = await sock.profilePictureUrl(realParticipant, 'image') || ppUrl
        } catch {}

        const text = buildGoodbyeMessage(
            realParticipant,
            groupMeta?.subject,
            memberCount,
            groupData?.goodbyeMsg
        )

        const saluranId = config.saluran?.id || '120363406397452589@newsletter'
        const saluranName = config.saluran?.name || config.bot?.name || 'frenzy-AI'

        if (goodbyeType === 2) {
            await sock.sendMessage(groupJid, {
                text: 'Sampai Jumpa!',
                title: `Goodbye ${userName}`,
                subtitle: groupName,
                footer: `Sisa ${memberCount} Member`,
                cards: [
                    {
                        image: { url: ppUrl },
                        title: `Sayonara ${userName}!`,
                        body: `Thank you already bergabung in ${groupName}`,
                        footer: 'Wishing you success always~',
                        buttons: [
                            {
                                name: 'quick_reply',
                                buttonParamsJson: JSON.stringify({
                                    insplay_text: '👋 Good Tinggal',
                                    id: 'bye'
                                })
                            },
                            {
                                name: 'cta_url',
                                buttonParamsJson: JSON.stringify({
                                    insplay_text: '🌐 Website',
                                    url: config.info?.website || 'https://sc.frenzy.my.id/'
                                })
                            }
                        ]
                    }
                ]
            })
        } else if (goodbyeType === 3) {
             await sock.sendMessage(groupJid, {
                image: { url: ppUrl },
                caption: text,
                contextInfo: {
                    mentionedJid: [realParticipant],
                    forwardingScore: 9999,
                    isForwarded: true,
                    externalAdReply: {
                        title: `Goodbye ${userName}`,
                        body: `Sisa ${memberCount} Member`,
                        thumbnailUrl: ppUrl,
                        sourceUrl: config.saluran?.link || 'https://whatsapp.com/channel/0029VbB37bgBfxoAmAlsgE0t',
                        contentType: 1,
                        renderLargerThumbnail: true
                    }
                }
            })
        } else if (goodbyeType === 4) {
            await sock.sendMessage(groupJid, {
                text: `*Sayonara* @${userName} 👋`,
                contextInfo: {
                    mentionedJid: [realParticipant],
                    forwardingScore: 9,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterName: config?.saluran?.name,
                        newsletterJid: config?.saluran?.id
                    },
                    externalAdReply: {
                        title: `SELAMAT TINGGAL 👋`,
                        body: `Member to-${memberCount}`,
                        thumbnailUrl: ppUrl,
                        sourceUrl: config.info?.groupwa || '',
                        contentUrl: config.info?.groupwa || '',
                        contentType: 2,
                        // renderLargerThumbnail: true
                    }
                }
            })
        } else if (goodbyeType === 5) {
            await sock.sendText(groupJid, text, null, {
                mentions: [realParticipant],
                contextInfo: {
                    mentionedJid: [realParticipant],
                    forwardingScore: 9,
                    isForwarded: true,
                    externalAdReply: {
                        title: `Goodbye 👋`,
                        body: `Member to-${memberCount}`,
                        thumbnailUrl: ppUrl,
                        sourceUrl: null,
                        contentType: 1,
                        renderLargerThumbnail: true
                    }
                }
            })
        } else {
            let canvasBuffer = null
            try {
                canvasBuffer = await createGoodbyeCard(userName, ppUrl, groupName, memberCount.toLocaleString())
            } catch (e) {
                console.error('Goodbye Canvas Error:', e.message)
            }

            await sock.sendMessage(groupJid, {
                image: canvasBuffer,
                caption: text,
                mentions: [realParticipant],
                contextInfo: {
                    mentionedJid: [realParticipant],
                    forwardingScore: 999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: saluranId,
                        newsletterName: saluranName,
                        serverMessageId: 127
                    },
                    externalAdReply: {
                        sourceUrl: config.info?.website || 'https://sc.frenzy.my.id/',
                        contentUrl: config.info?.website || 'https://sc.frenzy.my.id/',
                        contentType: 3,
                        thumbnailUrl: ppUrl,
                        title: `Goodbye ${userName}`,
                        body: null,
                        renderLargerThumbnail: false
                    }
                }
            })
        }
        
        return true
    } catch (error) {
        console.error('Goodbye Error:', error)
        return false
    }
}

async function handler(m, { sock }) {
    const db = getDatabase()
    const args = m.args || []
    const sub = args[0]?.toLowerCase()
    const sub2 = args[1]?.toLowerCase()
    const groupData = db.getGroup(m.chat) || {}
    const currentStatus = groupData.goodbye === true
    
    if (sub === 'on' && sub2 === 'all') {
        if (!m.isOwner) {
            return m.reply(`❌ Only the owner can use this feature!`)
        }
        
        m.react('🕕')
        
        try {
            const groups = await sock.groupFetchAllParticipating()
            const groupIds = Object.keys(groups)
            let count = 0
            
            for (const groupId of groupIds) {
                db.setGroup(groupId, { goodbye: true, leave: true })
                count++
            }
            
            m.react('✅')
            return m.reply(
                `✅ *ɢᴏᴏᴅʙʏᴇ ɢʟᴏʙᴀʟ ᴏɴ*\n\n` +
                `> Goodbye inactivekan in *${count}* group!`
            )
        } catch (err) {
            m.react('☢')
            return m.reply(te(m.prefix, m.command, m.pushName))
        }
    }
    
    if (sub === 'off' && sub2 === 'all') {
        if (!m.isOwner) {
            return m.reply(`❌ Only the owner can use this feature!`)
        }
        
        m.react('🕕')
        
        try {
            const groups = await sock.groupFetchAllParticipating()
            const groupIds = Object.keys(groups)
            let count = 0
            
            for (const groupId of groupIds) {
                db.setGroup(groupId, { goodbye: false, leave: false })
                count++
            }
            
            m.react('✅')
            return m.reply(
                `❌ *ɢᴏᴏᴅʙʏᴇ ɢʟᴏʙᴀʟ ᴏꜰꜰ*\n\n` +
                `> Goodbye innonactivekan in *${count}* group!`
            )
        } catch (err) {
            m.react('☢')
            return m.reply(te(m.prefix, m.command, m.pushName))
        }
    }
    
    if (sub === 'on') {
        if (currentStatus) {
            return m.reply(
                `⚠️ *ɢᴏᴏᴅʙʏᴇ ᴀʟʀᴇᴀᴅʏ ᴀᴄᴛɪᴠᴇ*\n\n` +
                `> Status: *✅ ON*\n` +
                `> Goodbye already active in this group.\n\n` +
                `_Usage \`${m.prefix}goodbye off\` for menonactivekan._`
            )
        }
        db.setGroup(m.chat, { goodbye: true, leave: true })
        return m.reply(
            `✅ *ɢᴏᴏᴅʙʏᴇ ᴀᴋᴛɪꜰ*\n\n` +
            `> Goodbye message success inactivekan!\n` +
            `> Member that leave will inberi message.\n\n` +
            `_Usage \`${m.prefix}setgoodbye\` for custom message._`
        )
    }
    
    if (sub === 'off') {
        if (!currentStatus) {
            return m.reply(
                `⚠️ *ɢᴏᴏᴅʙʏᴇ ᴀʟʀᴇᴀᴅʏ ɪɴᴀᴄᴛɪᴠᴇ*\n\n` +
                `> Status: *❌ OFF*\n` +
                `> Goodbye already nonactive in this group.\n\n` +
                `_Usage \`${m.prefix}goodbye on\` for activate._`
            )
        }
        db.setGroup(m.chat, { goodbye: false, leave: false })
        return m.reply(
            `❌ *ɢᴏᴏᴅʙʏᴇ ɴᴏɴᴀᴋᴛɪꜰ*\n\n` +
            `> Goodbye message success innonactivekan.\n` +
            `> Member that leave no will inberi message.`
        )
    }
    
    m.reply(
        `👋 *ɢᴏᴏᴅʙʏᴇ sᴇᴛᴛɪɴɢs*\n\n` +
        `> Status: *${currentStatus ? '✅ ON' : '❌ OFF'}*\n\n` +
        `\`\`\`━━━ ᴘɪʟɪʜᴀɴ ━━━\`\`\`\n` +
        `> \`${m.prefix}goodbye on\` → Activekan\n` +
        `> \`${m.prefix}goodbye off\` → Nonactivekan\n` +
        `> \`${m.prefix}goodbye on all\` → Global ON (owner)\n` +
        `> \`${m.prefix}goodbye off all\` → Global OFF (owner)\n` +
        `> \`${m.prefix}setgoodbye\` → Custom message\n` +
        `> \`${m.prefix}resetgoodbye\` → Reset default`
    )
}

module.exports = {
    config: pluginConfig,
    handler,
    sendGoodbyeMessage
}
