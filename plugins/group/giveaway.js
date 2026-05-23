const { getDatabase } = require('../../src/lib/frenzy-database')
const config = require('../../config')
const timeHelper = require('../../src/lib/frenzy-time')
const cron = require('node-cron')
const path = require('path')
const fs = require('fs')

const pluginConfig = {
    name: 'giveaway',
    alias: ['ga', 'gaway'],
    category: 'group',
    description: 'System giveaway for group',
    usage: '.giveaway <start/end/join/list/delete/reroll/notifadmin>',
    example: '.giveaway start',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    isAdmin: false,
    cooldown: 5,
    energy: 0,
    isEnabled: true
}

const CLEANUP_DELAY = 3 * 24 * 60 * 60 * 1000
const pendingGiveaway = new Map()

function generateGiveawayId() {
    const random = Math.random().toString(36).substring(2, 8).toUpperCase()
    return `GA-${random}`
}

function parseTime(timeStr) {
    const regex = /(\d+)([smhd])/g
    let totalMs = 0
    let match
    
    while ((match = regex.exec(timeStr)) !== null) {
        const value = parseInt(match[1])
        const unit = match[2]
        
        if (unit === 's') totalMs += value * 1000
        if (unit === 'm') totalMs += value * 60 * 1000
        if (unit === 'h') totalMs += value * 60 * 60 * 1000
        if (unit === 'd') totalMs += value * 24 * 60 * 60 * 1000
    }
    
    return totalMs
}

function formatDuration(ms) {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)
    
    if (days > 0) return `${days} day ${hours % 24} hour`
    if (hours > 0) return `${hours} hour ${minutes % 60} minute`
    if (minutes > 0) return `${minutes} minute`
    return `${seconds} second`
}

function getGiveawayImage() {
    const imagePath = path.join(process.cwd(), 'assets', 'images', 'giveaway.jpg')
    if (fs.existsSync(imagePath)) {
        return fs.readFileSync(imagePath)
    }
    const defaultPath = path.join(process.cwd(), 'assets', 'images', 'frenzy.jpg')
    if (fs.existsSync(defaultPath)) {
        return fs.readFileSync(defaultPath)
    }
    return null
}

function extractAdminJid(input, mentionedJid) {
    if (mentionedJid && mentionedJid.length > 0) {
        return mentionedJid[0]
    }
    const match = input?.match(/@(\d+)/)
    if (match) {
        return `${match[1]}@s.whatsapp.net`
    }
    const numberMatch = input?.match(/(\d{10,15})/)
    if (numberMatch) {
        return `${numberMatch[1]}@s.whatsapp.net`
    }
    return null
}

function buildGiveawayMessage(giveaway, pmeaningcipantCount = 0, prefix = '.') {
    const endTimeFormatted = timeHelper.fromTimestamp(giveaway.endTime, 'DD/MM/YYYY HH:mm')
    const remaining = giveaway.endTime - Date.now()
    const remathisngText = remaining > 0 ? formatDuration(remaining) : 'Berakhir'
    const adminTag = giveaway.adminJid ? `@${giveaway.adminJid.split('@')[0]}` : 'Creator'
    
    return `🎉 *ɢɪᴠᴇᴀᴡᴀʏ*

╭┈┈⬡「 🎁 *${giveaway.title}* 」
┃ 🏆 ʜᴀᴅɪᴀʜ: *${giveaway.prizeName || 'Here is Speunlucky'}*
┃ 📝 ᴅᴇsᴋ: _${giveaway.description}_
╰┈┈⬡

╭┈┈⬡「 📋 *ɪɴꜰᴏ* 」
┃ 👥 ᴘᴇᴍᴇɴᴀɴɢ: \`${giveaway.winners} person\`
┃ 👤 ᴘᴇsᴇʀᴛᴀ: \`${pmeaningcipantCount} person\`
┃ ⏰ ʙᴇʀᴀᴋʜɪʀ: \`${endTimeFormatted}\`
┃ 🕕 sɪsᴀ: \`${remathisngText}\`
┃ 👮 ᴀᴅᴍɪɴ: ${adminTag}
┃ 🆔 ɪᴅ: \`${giveaway.giveawayId}\`
╰┈┈⬡

> *Cara Ikut:*
> Type \`${prefix}giveaway join ${giveaway.giveawayId}\`

> _Good luck! 🍀_`
}

function buildWinnerMessage(giveaway, winners) {
    let winnerList = ''
    winners.forEach((w, i) => {
        winnerList += `┃ ${i + 1}. @${w.split('@')[0]}\n`
    })
    const adminTag = giveaway.adminJid ? `@${giveaway.adminJid.split('@')[0]}` : 'Creator'
    
    return `🎊 *ɢɪᴠᴇᴀᴡᴀʏ sᴇʟᴇsᴀɪ!*

╭┈┈⬡「 🎁 *${giveaway.title}* 」
┃ 🏆 ʜᴀᴅɪᴀʜ: *${giveaway.prizeName || 'Here is Speunlucky'}*
┃ 👮 ᴀᴅᴍɪɴ: ${adminTag}
╰┈┈⬡

╭┈┈⬡「 🏅 *ᴘᴇᴍᴇɴᴀɴɢ* 」
${winnerList}╰┈┈⬡

> 🎉 Good toon the winners!
> Check DM for detail here is.

> _ID: ${giveaway.giveawayId}_`
}

async function selectWinners(giveaway) {
    const participants = giveaway.participants || []
    const numWinners = Math.min(giveaway.winners, participants.length)
    const shuffled = [...participants].sort(() => Math.random() - 0.5)
    return shuffled.slice(0, numWinners)
}

async function endGiveaway(giveawayId, sock, db) {
    const giveaways = db.setting('giveaways') || {}
    const giveaway = giveaways[giveawayId]
    
    if (!giveaway || giveaway.ended) return
    
    const participants = giveaway.participants || []
    const notifAdmin = db.setting('giveawayNotifAdmin') ?? true
    const imageBuffer = getGiveawayImage()
    
    if (participants.length === 0) {
        await sock.sendMessage(giveaway.chatId, {
            text: `❌ *ɢɪᴠᴇᴀᴡᴀʏ ʙᴇʀᴀᴋʜɪʀ*\n\n` +
                `> ID: \`${giveawayId}\`\n` +
                `> Status: No there is peserta\n\n` +
                `> _Giveaway cancelled._`
        })
        
        if (notifAdmin && giveaway.adminJid) {
            try {
                await sock.sendMessage(giveaway.adminJid, {
                    text: `❌ *ɢɪᴠᴇᴀᴡᴀʏ ʙᴇʀᴀᴋʜɪʀ*\n\n` +
                        `> ID: \`${giveawayId}\`\n` +
                        `> Title: ${giveaway.title}\n` +
                        `> Status: No there is peserta\n\n` +
                        `> _Giveaway cancelled._`
                })
            } catch (e) {}
        }
        
        giveaway.ended = true
        giveaway.endedAt = Date.now()
        db.setting('giveaways', giveaways)
        return
    }
    
    const winners = await selectWinners(giveaway)
    const winnerMsg = buildWinnerMessage(giveaway, winners)
    const mentions = giveaway.adminJid ? [...winners, giveaway.adminJid] : winners
    
    if (imageBuffer) {
        await sock.sendMessage(giveaway.chatId, {
            image: imageBuffer,
            caption: winnerMsg,
            mentions
        })
    } else {
        await sock.sendMessage(giveaway.chatId, {
            text: winnerMsg,
            mentions
        })
    }
    
    for (const winner of winners) {
        try {
            await sock.sendMessage(winner, {
                text: `🎉 *sᴇʟᴀᴍᴀᴛ!*\n\n` +
                    `> You memenangkan giveaway!\n\n` +
                    `╭┈┈⬡「 📋 *ᴅᴇᴛᴀɪʟ* 」\n` +
                    `┃ 🎁 ᴛɪᴛʟᴇ: \`${giveaway.title}\`\n` +
                    `┃ 🏆 ʜᴀᴅɪᴀʜ: *${giveaway.prizeName}*\n` +
                    `┃ 🆔 ɪᴅ: \`${giveawayId}\`\n` +
                    `╰┈┈⬡\n\n` +
                    `╭┈┈⬡「 🎁 *ᴅᴇᴛᴀɪʟ ʜᴀᴅɪᴀʜ* 」\n` +
                    `${giveaway.prizeDetails || 'Contact admin for detail'}\n` +
                    `╰┈┈⬡\n\n` +
                    `> _This information resmi from bot._`
            })
        } catch (e) {}
    }
    
    if (notifAdmin && giveaway.adminJid) {
        try {
            let winnerListText = ''
            winners.forEach((w, i) => {
                winnerListText += `${i + 1}. @${w.split('@')[0]}\n`
            })
            
            await sock.sendMessage(giveaway.adminJid, {
                text: `🎊 *ɴᴏᴛɪꜰ ɢɪᴠᴇᴀᴡᴀʏ*\n\n` +
                    `> Giveaway has berakhir!\n\n` +
                    `╭┈┈⬡「 📋 *ᴅᴇᴛᴀɪʟ* 」\n` +
                    `┃ 🎁 ᴛɪᴛʟᴇ: \`${giveaway.title}\`\n` +
                    `┃ 🏆 ʜᴀᴅɪᴀʜ: \`${giveaway.prize}\`\n` +
                    `┃ 👥 ᴘᴇsᴇʀᴛᴀ: \`${participants.length}\`\n` +
                    `┃ 🆔 ɪᴅ: \`${giveawayId}\`\n` +
                    `╰┈┈⬡\n\n` +
                    `╭┈┈⬡「 🏅 *ᴘᴇᴍᴇɴᴀɴɢ* 」\n` +
                    `${winnerListText}╰┈┈⬡\n\n` +
                    `> _This notification resmi from bot._`,
                mentions: winners
            })
        } catch (e) {}
    }
    
    giveaway.ended = true
    giveaway.endedAt = Date.now()
    giveaway.winnerList = winners
    db.setting('giveaways', giveaways)
}

async function handler(m, { sock, args: rawArgs }) {
    const db = getDatabase()
    const args = rawArgs || m.args || []
    const action = args[0]?.toLowerCase() || ''
    const prefix = m.prefix || '.'
    const botConfig = config
    
    let giveaways = db.setting('giveaways') || {}
    
    if (action === '--confirm' && args[1]) {
        const targetGroupId = args[1]
        const pendingData = pendingGiveaway.get(m.sender)
        
        if (!pendingData) {
            return m.reply(`⚠️ *No pending data found. Please create a giveaway again.*`)
        }
        
        try {
            let groupName = 'Group'
            try {
                const meta = await sock.groupMetadata(targetGroupId)
                groupName = meta.subject
            } catch (e) {}
            
            await m.reply(`🕕 *Memposting giveaway to ${groupName}...*`)
            
            const giveawayId = generateGiveawayId()
            const endTime = Date.now() + pendingData.duration
            
            const giveaway = {
                giveawayId,
                chatId: targetGroupId,
                title: pendingData.title,
                prizeName: pendingData.prizeName,
                prizeDetails: pendingData.prizeDetails,
                description: pendingData.description,
                winners: pendingData.winners,
                endTime,
                creatorId: m.sender,
                adminJid: pendingData.adminJid || m.sender,
                participants: [],
                ended: false,
                createdAt: Date.now()
            }
            
            giveaways[giveawayId] = giveaway
            db.setting('giveaways', giveaways)
            
            const giveawayText = buildGiveawayMessage(giveaway, 0, prefix)
            const imageBuffer = getGiveawayImage()
            
            const saluranId = botConfig.saluran?.id || '120363406397452589@newsletter'
            const saluranName = botConfig.saluran?.name || botConfig.bot?.name || 'Frenzy-AI'
            
            const contextInfo = {
                mentionedJid: [m.sender, giveaway.adminJid],
                forwardingScore: 9999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: saluranId,
                    newsletterName: saluranName,
                    serverMessageId: 127
                }
            }
            
            if (imageBuffer) {
                await sock.sendMessage(targetGroupId, {
                    image: imageBuffer,
                    caption: giveawayText,
                    contextInfo
                })
            } else {
                await sock.sendMessage(targetGroupId, {
                    text: giveawayText,
                    contextInfo
                })
            }
            

            
            const successMsg = `✅ *ɢɪᴠᴇᴀᴡᴀʏ ᴅɪᴘᴏsᴛ*

╭┈┈⬡「 📋 *ᴅᴇᴛᴀɪʟ* 」
┃ 🆔 ɪᴅ: \`${giveawayId}\`
┃ 🏠 ɢʀᴜᴘ: *${groupName}*
┃ 🎁 ᴛɪᴛʟᴇ: \`${pendingData.title}\`
┃ 🏆 ʜᴀᴅɪᴀʜ: *${pendingData.prizeName}*
┃ ⏱️ ᴅᴜʀᴀsɪ: \`${formatDuration(pendingData.duration)}\`
╰┈┈⬡

> _Giveaway success inposting!_
> _Detail here is only will sent to winners._`
            
            await m.reply(successMsg)
            pendingGiveaway.delete(m.sender)
            m.react('🎉')
            
        } catch (error) {
            await m.reply(
                `❌ *ᴇʀʀᴏʀ*\n\n` +
                `> Failed memposting giveaway.\n` +
                `> _${error.message}_`
            )
        }
        return
    }
    
    if (!action) {
        return m.reply(
            `🎉 *ɢɪᴠᴇᴀᴡᴀʏ sʏsᴛᴇᴍ*\n\n` +
            `╭┈┈⬡「 📋 *ᴄᴏᴍᴍᴀɴᴅs* 」\n` +
            `┃ 🎁 \`${prefix}giveaway start\`\n` +
            `┃    _Create giveaway (private only)_\n` +
            `┃\n` +
            `┃ 🎫 \`${prefix}giveaway join <id>\`\n` +
            `┃    _Ikut giveaway_\n` +
            `┃\n` +
            `┃ 📋 \`${prefix}giveaway list\`\n` +
            `┃    _View giveaway active_\n` +
            `┃\n` +
            `┃ 🏁 \`${prefix}giveaway end <id>\`\n` +
            `┃    _Akhiri giveaway_\n` +
            `┃\n` +
            `┃ 🎲 \`${prefix}giveaway reroll <id>\`\n` +
            `┃    _Choose again winners_\n` +
            `┃\n` +
            `┃ 🗑️ \`${prefix}giveaway delete <id>\`\n` +
            `┃    _Delete giveaway_\n` +
            `┃\n` +
            `┃ 🔔 \`${prefix}giveaway notifadmin\`\n` +
            `┃    _Toggle notification admin_\n` +
            `╰┈┈⬡\n\n` +
            `> _Example: ${prefix}giveaway start_`
        )
    }
    
    if (action === 'notifadmin') {
        if (!m.isAdmin && !m.isOwner) {
            return m.reply(`⚠️ *ᴀᴋsᴇs ᴅɪᴛᴏʟᴀᴋ*\n\n> Only admin that can configure notifications.`)
        }
        
        const subAction = args[1]?.toLowerCase()
        const current = db.setting('giveawayNotifAdmin') ?? true
        
        if (subAction === 'on') {
            db.setting('giveawayNotifAdmin', true)
            m.react('✅')
            return m.reply(`✅ *ɴᴏᴛɪꜰ ᴀᴅᴍɪɴ ᴀᴋᴛɪꜰ*\n\n> Admin will receive DM winners giveaway.`)
        }
        
        if (subAction === 'off') {
            db.setting('giveawayNotifAdmin', false)
            m.react('❌')
            return m.reply(`❌ *ɴᴏᴛɪꜰ ᴀᴅᴍɪɴ ɴᴏɴᴀᴋᴛɪꜰ*\n\n> Admin no will receive DM winners.`)
        }
        
        return m.reply(
            `🔔 *ɴᴏᴛɪꜰ ᴀᴅᴍɪɴ ɢɪᴠᴇᴀᴡᴀʏ*\n\n` +
            `> Status: \`${current ? 'ON ✅' : 'OFF ❌'}\`\n\n` +
            `> \`${prefix}giveaway notifadmin on\` - Activekan\n` +
            `> \`${prefix}giveaway notifadmin off\` - Nonactivekan\n\n` +
            `> _If active, admin giveaway will\n> receive DM list winners._`
        )
    }
    
    if (action === 'start' || action === 'create' || action === 'new') {
        if (m.isGroup) {
            return m.reply(
                `⚠️ *ᴘʀɪᴠᴀᴛᴇ ᴏɴʟʏ*\n\n` +
                `> Command this only can in use in private chat chat.\n` +
                `> Please chat bot seway directly.`
            )
        }
        
        if (!m.isAdmin && !m.isOwner) {
            return m.reply(`⚠️ *ᴀᴋsᴇs ᴅɪᴛᴏʟᴀᴋ*\n\n> Only admin/owner that can create a giveaway.`)
        }
        
        const fullText = m.text || args.slice(1).join(' ')
        const firstPipe = fullText.indexOf('|')
        const input = firstPipe > -1 ? fullText : args.slice(1).join(' ')
        
        if (!input || !input.includes('|')) {
            return m.reply(
                `🎉 *ʙᴜᴀᴛ ɢɪᴠᴇᴀᴡᴀʏ*\n\n` +
                `> *Format:*\n` +
                `> \`${prefix}giveaway start <title>|<desk>|<winners>|<durasi>|<name_here is>|<detail_here is>\`\n\n` +
                `> *Example:*\n` +
                `> \`${prefix}giveaway start Event FF|Speunlucky merdeka|1|1d|In Free Fire|Email: xxx@mail.com\nPassword: 123456\`\n\n` +
                `> *Format Durasi:*\n` +
                `> \`1m\` = 1 minute, \`1h\` = 1 hour, \`1d\` = 1 day\n\n` +
                `> *Note:*\n` +
                `> - name_here is: tampil in group (publik)\n` +
                `> - detail_here is: only sent to winners (confidential)`
            )
        }
        
        const parts = input.split('|')
        
        if (parts.length < 6) {
            return m.reply(
                `⚠️ *ᴠᴀʟɪᴅᴀsɪ ɢᴀɢᴀʟ*\n\n` +
                `> Format no complete!\n` +
                `> Need 6 palivelyter:\n` +
                `> \`title|desk|winners|durasi|name_here is|detail_here is\`\n\n` +
                `> - name_here is: tampil in group\n` +
                `> - detail_here is: confidential for winners`
            )
        }
        
        const title = parts[0].trim()
        const description = parts[1].trim()
        const winnersStr = parts[2].trim()
        const timeStr = parts[3].trim()
        const prizeName = parts[4].trim()
        
        const firstFiveParts = parts.slice(0, 5).join('|')
        const prizeDetailsRaw = input.substring(firstFiveParts.length + 1)
        const prizeDetails = prizeDetailsRaw.trim() || 'Contact admin for detail'
        
        const winners = parseInt(winnersStr)
        const duration = parseTime(timeStr)
        
        if (isNaN(winners) || winners < 1) {
            return m.reply(
                `⚠️ *ᴠᴀʟɪᴅᴀsɪ ɢᴀɢᴀʟ*\n\n` +
                `> Amount winners must angka at least 1!`
            )
        }
        
        if (duration <= 0) {
            return m.reply(
                `⚠️ *ᴠᴀʟɪᴅᴀsɪ ɢᴀɢᴀʟ*\n\n` +
                `> Format durasi wrong!\n` +
                `> Usage: \`1m\`, \`1h\`, or \`1d\``
            )
        }
        
        pendingGiveaway.set(m.sender, {
            title,
            prizeName,
            prizeDetails,
            description,
            winners,
            duration,
            adminJid: m.sender,
            timestamp: Date.now()
        })
        
        try {
            global.isFetchingGroups = true
            const groups = await sock.groupFetchAllParticipating()
            global.isFetchingGroups = false
            const groupList = Object.entries(groups)
            
            if (groupList.length === 0) {
                pendingGiveaway.delete(m.sender)
                return m.reply(`⚠️ *Bot no berin the group manapun.*`)
            }
            
            const groupRows = groupList.map(([id, meta]) => ({
                title: meta.subject || 'Unknown Group',
                description: `${meta.participants?.length || 0} members`,
                id: `${prefix}giveaway --confirm ${id}`
            }))
            
            let thumbnail = null
            try {
                thumbnail = fs.readFileSync('./assets/images/giveaway.jpg')
            } catch (e) {
                try {
                    thumbnail = fs.readFileSync('./assets/images/frenzy.jpg')
                } catch (e2) {}
            }
            
            await sock.sendMessage(m.chat, {
                text: `🎉 *ᴘɪʟɪʜ ɢʀᴜᴘ ᴜɴᴛᴜᴋ ɢɪᴠᴇᴀᴡᴀʏ*\n\n` +
                      `╭┈┈⬡「 📋 *ᴅᴇᴛᴀɪʟ* 」\n` +
                      `┃ 🎁 ᴛɪᴛʟᴇ: \`${title}\`\n` +
                      `┃ 🏆 ʜᴀᴅɪᴀʜ: *${prizeName}*\n` +
                      `┃ 👥 ᴘᴇᴍᴇɴᴀɴɢ: \`${winners} person\`\n` +
                      `┃ ⏱️ ᴅᴜʀᴀsɪ: \`${formatDuration(duration)}\`\n` +
                      `╰┈┈⬡\n\n` +
                      `> Total Group: *${groupList.length}*\n` +
                      `> _Choose group from list below:_`,
                contextInfo: {
                    isForwarded: true,
                    forwardingScore: 999,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: botConfig.saluran?.id,
                        newsletterName: botConfig.saluran?.name
                    },
                    externalAdReply: thumbnail ? {
                        title: botConfig.bot?.name || 'FRENZY MD',
                        body: 'GIVEAWAY SYSTEM',
                        thumbnail: thumbnail,
                        sourceUrl: botConfig.saluran?.link || '',
                        contentType: 1,
                        renderLargerThumbnail: false
                    } : undefined
                },
                footer: botConfig.bot?.name || 'FRENZY MD',
                interactiveButtons: [
                    {
                        name: 'single_select',
                        buttonParamsJson: JSON.stringify({
                            title: '🏠 Choose Group Target',
                            sections: [{
                                title: 'Group List',
                                rows: groupRows
                            }]
                        })
                    },
                    {
                        name: 'quick_reply',
                        buttonParamsJson: JSON.stringify({
                            insplay_text: '❌ Cancel',
                            id: `${prefix}cancelga`
                        })
                    }
                ]
            }, { quoted: m })
            
        } catch (error) {
            pendingGiveaway.delete(m.sender)
            await m.reply(
                `❌ *ᴇʀʀᴏʀ*\n\n` +
                `> Failed fetch list group.\n` +
                `> _${error.message}_`
            )
        }
        return
    }
    
    if (action === 'join' || action === 'ikut') {
        if (!m.isGroup) {
            return m.reply(`⚠️ *ɢʀᴜᴘ ᴏɴʟʏ*\n\n> Command this only can in group.`)
        }
        
        const giveawayId = args[1]?.toUpperCase()
        
        if (!giveawayId) {
            const activeGiveaways = Object.values(giveaways).filter(g => 
                g.chatId === m.chat && !g.ended && g.endTime > Date.now()
            )
            
            if (activeGiveaways.length === 0) {
                return m.reply(
                    `⚠️ *ᴛɪᴅᴀᴋ ᴀᴅᴀ ɢɪᴠᴇᴀᴡᴀʏ*\n\n` +
                    `> No there is giveaway active in this group.`
                )
            }
            
            if (activeGiveaways.length === 1) {
                const ga = activeGiveaways[0]
                
                if (ga.participants.includes(m.sender)) {
                    return m.reply(
                        `⚠️ *sᴜᴅᴀʜ ᴛᴇʀᴅᴀꜰᴛᴀʀ*\n\n` +
                        `> You already ikut giveaway this!`
                    )
                }
                
                ga.participants.push(m.sender)
                db.setting('giveaways', giveaways)
                
                m.react('✅')
                return m.reply(
                    `✅ *ʙᴇʀʜᴀsɪʟ ɪᴋᴜᴛ!*\n\n` +
                    `╭┈┈⬡「 📋 *ᴅᴇᴛᴀɪʟ* 」\n` +
                    `┃ 🎁 ᴛɪᴛʟᴇ: \`${ga.title}\`\n` +
                    `┃ 🏆 ʜᴀᴅɪᴀʜ: \`${ga.prize}\`\n` +
                    `┃ 👤 ᴘᴇsᴇʀᴛᴀ ᴋᴇ: \`${ga.participants.length}\`\n` +
                    `╰┈┈⬡\n\n` +
                    `> _Good luck! 🍀_`
                )
            }
            
            return m.reply(
                `⚠️ *ᴘɪʟɪʜ ɢɪᴠᴇᴀᴡᴀʏ*\n\n` +
                `> Ada ${activeGiveaways.length} giveaway active.\n` +
                `> Usage: \`${prefix}giveaway join <id>\``
            )
        }
        
        const giveaway = giveaways[giveawayId]
        
        if (!giveaway) {
            return m.reply(
                `⚠️ *ᴛɪᴅᴀᴋ ᴅɪᴛᴇᴍᴜᴋᴀɴ*\n\n` +
                `> Giveaway with ID \`${giveawayId}\` not found.`
            )
        }
        
        if (giveaway.chatId !== m.chat) {
            return m.reply(
                `⚠️ *ɢɪᴠᴇᴀᴡᴀʏ ʙᴜᴋᴀɴ ᴅɪ ɢʀᴜᴘ ɪɴɪ*\n\n` +
                `> This giveaway is from another group.`
            )
        }
        
        if (giveaway.ended) {
            return m.reply(
                `⚠️ *ɢɪᴠᴇᴀᴡᴀʏ ʙᴇʀᴀᴋʜɪʀ*\n\n` +
                `> Giveaway this already berakhir.`
            )
        }
        
        if (giveaway.endTime < Date.now()) {
            return m.reply(
                `⚠️ *ᴡᴀᴋᴛᴜ ʜᴀʙɪs*\n\n` +
                `> Time giveaway already ran out.`
            )
        }
        
        if (giveaway.participants.includes(m.sender)) {
            return m.reply(
                `⚠️ *sᴜᴅᴀʜ ᴛᴇʀᴅᴀꜰᴛᴀʀ*\n\n` +
                `> You already ikut giveaway this!`
            )
        }
        
        giveaway.participants.push(m.sender)
        db.setting('giveaways', giveaways)
        
        m.react('✅')
        return m.reply(
            `✅ *ʙᴇʀʜᴀsɪʟ ɪᴋᴜᴛ!*\n\n` +
            `╭┈┈⬡「 📋 *ᴅᴇᴛᴀɪʟ* 」\n` +
            `┃ 🎁 ᴛɪᴛʟᴇ: \`${giveaway.title}\`\n` +
            `┃ 🏆 ʜᴀᴅɪᴀʜ: \`${giveaway.prize}\`\n` +
            `┃ 👤 ᴘᴇsᴇʀᴛᴀ ᴋᴇ: \`${giveaway.participants.length}\`\n` +
            `╰┈┈⬡\n\n` +
            `> _Good luck! 🍀_`
        )
    }
    
    if (action === 'list' || action === 'check') {
        if (!m.isGroup) {
            return m.reply(`⚠️ *ɢʀᴜᴘ ᴏɴʟʏ*\n\n> Command this only can in group.`)
        }
        
        const activeGiveaways = Object.values(giveaways).filter(g => 
            g.chatId === m.chat && !g.ended && g.endTime > Date.now()
        )
        
        if (activeGiveaways.length === 0) {
            return m.reply(
                `📋 *ᴅᴀꜰᴛᴀʀ ɢɪᴠᴇᴀᴡᴀʏ*\n\n` +
                `> No there is giveaway active in this group.\n\n` +
                `> Create new: \`${prefix}giveaway start\` (in private chat)`
            )
        }
        
        let text = `📋 *ᴅᴀꜰᴛᴀʀ ɢɪᴠᴇᴀᴡᴀʏ ᴀᴋᴛɪꜰ*\n\n`
        
        activeGiveaways.forEach((g, i) => {
            const remaining = formatDuration(g.endTime - Date.now())
            text += `╭┈┈⬡「 ${i + 1}. *${g.title}* 」\n`
            text += `┃ 🆔 ɪᴅ: \`${g.giveawayId}\`\n`
            text += `┃ 🏆 ʜᴀᴅɪᴀʜ: \`${g.prize}\`\n`
            text += `┃ 👥 ᴘᴇsᴇʀᴛᴀ: \`${g.participants.length}\`\n`
            text += `┃ 🕕 sɪsᴀ: \`${remaining}\`\n`
            text += `╰┈┈⬡\n\n`
        })
        
        text += `> Join: \`${prefix}giveaway join <id>\``
        
        return m.reply(text)
    }
    
    if (action === 'end' || action === 'stop') {
        const giveawayId = args[1]?.toUpperCase()
        
        if (!giveawayId) {
            return m.reply(
                `⚠️ *ᴠᴀʟɪᴅᴀsɪ ɢᴀɢᴀʟ*\n\n` +
                `> Usage: \`${prefix}giveaway end <id>\``
            )
        }
        
        const giveaway = giveaways[giveawayId]
        
        if (!giveaway) {
            return m.reply(`⚠️ *ᴛɪᴅᴀᴋ ᴅɪᴛᴇᴍᴜᴋᴀɴ*\n\n> ID \`${giveawayId}\` not found.`)
        }
        
        if (giveaway.creatorId !== m.sender && !m.isOwner) {
            return m.reply(`⚠️ *ʙᴜᴋᴀɴ ᴘᴇᴍʙᴜᴀᴛ*\n\n> Only pemcreate giveaway or owner that can mendon'thiri.`)
        }
        
        if (giveaway.ended) {
            return m.reply(`⚠️ *sᴜᴅᴀʜ ʙᴇʀᴀᴋʜɪʀ*\n\n> Giveaway this already berakhir.`)
        }
        
        await m.reply(`🕕 Mendon'thiri giveaway and choose winners...`)
        await endGiveaway(giveawayId, sock, db)
        
        m.react('✅')
        return
    }
    
    if (action === 'reroll') {
        const giveawayId = args[1]?.toUpperCase()
        
        if (!giveawayId) {
            return m.reply(
                `⚠️ *ᴠᴀʟɪᴅᴀsɪ ɢᴀɢᴀʟ*\n\n` +
                `> Usage: \`${prefix}giveaway reroll <id>\``
            )
        }
        
        const giveaway = giveaways[giveawayId]
        
        if (!giveaway) {
            return m.reply(`⚠️ *ᴛɪᴅᴀᴋ ᴅɪᴛᴇᴍᴜᴋᴀɴ*\n\n> ID \`${giveawayId}\` not found.`)
        }
        
        if (giveaway.creatorId !== m.sender && !m.isOwner) {
            return m.reply(`⚠️ *ʙᴜᴋᴀɴ ᴘᴇᴍʙᴜᴀᴛ*\n\n> Only pemcreate or owner that can reroll.`)
        }
        
        if (!giveaway.ended) {
            return m.reply(`⚠️ *ʙᴇʟᴜᴍ ʙᴇʀᴀᴋʜɪʀ*\n\n> Giveaway this not yet berakhir.`)
        }
        
        if (giveaway.participants.length === 0) {
            return m.reply(`⚠️ *ᴛɪᴅᴀᴋ ᴀᴅᴀ ᴘᴇsᴇʀᴛᴀ*\n\n> No there is peserta for in-reroll.`)
        }
        
        await m.reply(`🎲 Memilih again winners...`)
        
        const winners = await selectWinners(giveaway)
        const winnerMsg = buildWinnerMessage(giveaway, winners)
        const mentions = giveaway.adminJid ? [...winners, giveaway.adminJid] : winners
        
        await sock.sendMessage(giveaway.chatId, {
            text: `🎲 *ʀᴇʀᴏʟʟ ᴘᴇᴍᴇɴᴀɴɢ*\n\n` + winnerMsg,
            mentions
        })
        
        const notifAdmin = db.setting('giveawayNotifAdmin') ?? true
        if (notifAdmin && giveaway.adminJid) {
            try {
                let winnerListText = ''
                winners.forEach((w, i) => {
                    winnerListText += `${i + 1}. @${w.split('@')[0]}\n`
                })
                
                await sock.sendMessage(giveaway.adminJid, {
                    text: `🎲 *ʀᴇʀᴏʟʟ ɢɪᴠᴇᴀᴡᴀʏ*\n\n` +
                        `> Pemenang has in-reroll!\n\n` +
                        `╭┈┈⬡「 📋 *ᴅᴇᴛᴀɪʟ* 」\n` +
                        `┃ 🎁 ᴛɪᴛʟᴇ: \`${giveaway.title}\`\n` +
                        `┃ 🆔 ɪᴅ: \`${giveawayId}\`\n` +
                        `╰┈┈⬡\n\n` +
                        `╭┈┈⬡「 🏅 *ᴘᴇᴍᴇɴᴀɴɢ ʙᴀʀᴜ* 」\n` +
                        `${winnerListText}╰┈┈⬡`,
                    mentions: winners
                })
            } catch (e) {}
        }
        
        giveaway.winnerList = winners
        db.setting('giveaways', giveaways)
        
        m.react('🎲')
        return
    }
    
    if (action === 'delete' || action === 'delete') {
        const giveawayId = args[1]?.toUpperCase()
        
        if (!giveawayId) {
            return m.reply(
                `⚠️ *ᴠᴀʟɪᴅᴀsɪ ɢᴀɢᴀʟ*\n\n` +
                `> Usage: \`${prefix}giveaway delete <id>\``
            )
        }
        
        const giveaway = giveaways[giveawayId]
        
        if (!giveaway) {
            return m.reply(`⚠️ *ᴛɪᴅᴀᴋ ᴅɪᴛᴇᴍᴜᴋᴀɴ*\n\n> ID \`${giveawayId}\` not found.`)
        }
        
        if (giveaway.creatorId !== m.sender && !m.isOwner) {
            return m.reply(`⚠️ *ʙᴜᴋᴀɴ ᴘᴇᴍʙᴜᴀᴛ*\n\n> Only pemcreate or owner that can mengdelete.`)
        }
        
        delete giveaways[giveawayId]
        db.setting('giveaways', giveaways)
        
        m.react('🗑️')
        return m.reply(
            `🗑️ *ɢɪᴠᴇᴀᴡᴀʏ ᴅɪʜᴀᴘᴜs*\n\n` +
            `> ID: \`${giveawayId}\`\n` +
            `> Status: Success deleted`
        )
    }
    
    return m.reply(
        `⚠️ *ᴀᴋsɪ ᴛɪᴅᴀᴋ ᴠᴀʟɪᴅ*\n\n` +
        `> Usage: \`${prefix}giveaway\` for view list command.`
    )
}

let giveawayChectorStarted = false

function startGiveawayChector(sock) {
    if (giveawayChectorStarted) return
    giveawayChectorStarted = true

    cron.schedule('*/60 * * * * *', async () => {
        try {
            const db = getDatabase()
            const giveaways = db.setting('giveaways') || {}

            for (const [id, ga] of Object.entries(giveaways)) {
                if (ga.ended) continue
                if (ga.endTime && ga.endTime <= Date.now()) {
                    await endGiveaway(id, sock, db)
                }
            }
        } catch (e) {}
    })
}

module.exports = {
    config: pluginConfig,
    handler,
    startGiveawayChector
}
