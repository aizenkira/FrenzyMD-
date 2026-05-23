const config = require('../../config')
const { getDatabase } = require('../../src/lib/frenzy-database')
const te = require('../../src/lib/frenzy-error')

const pluginConfig = {
    name: 'notifgantitag',
    alias: ['notiflabel', 'notiftag', 'labeltag'],
    category: 'group',
    description: 'Configure notifications for member label/tag changes',
    usage: '.notifgantitag <on/off>',
    example: '.notifgantitag on',
    isGroup: true,
    isAdmin: true,
    cooldown: 5,
    energy: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    const db = getDatabase()
    const args = m.args || []
    const sub = args[0]?.toLowerCase()
    const sub2 = args[1]?.toLowerCase()
    const groupData = db.getGroup(m.chat) || {}
    const currentStatus = groupData.notifLabelChange === true
    
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
                db.setGroup(groupId, { notifLabelChange: true })
                count++
            }
            
            m.react('✅')
            return m.reply(
                `✅ *ɴᴏᴛɪꜰ ʟᴀʙᴇʟ ɢʟᴏʙᴀʟ ᴏɴ*\n\n` +
                `> Notifikasi ganti label inactivekan in *${count}* group!`
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
                db.setGroup(groupId, { notifLabelChange: false })
                count++
            }
            
            m.react('✅')
            return m.reply(
                `❌ *ɴᴏᴛɪꜰ ʟᴀʙᴇʟ ɢʟᴏʙᴀʟ ᴏꜰꜰ*\n\n` +
                `> Notifikasi ganti label innonactivekan in *${count}* group!`
            )
        } catch (err) {
            m.react('☢')
            return m.reply(te(m.prefix, m.command, m.pushName))
        }
    }
    
    if (sub === 'on') {
        if (currentStatus) {
            return m.reply(
                `⚠️ *ɴᴏᴛɪꜰ ʟᴀʙᴇʟ ᴀʟʀᴇᴀᴅʏ ᴀᴄᴛɪᴠᴇ*\n\n` +
                `> Status: *✅ ON*\n` +
                `> Notifikasi ganti label already active in this group.\n\n` +
                `_Usage \`${m.prefix}notifgantitag off\` for menonactivekan._`
            )
        }
        db.setGroup(m.chat, { notifLabelChange: true })
        return m.reply(
            `✅ *ɴᴏᴛɪꜰ ʟᴀʙᴇʟ ᴀᴋᴛɪꜰ*\n\n` +
            `> Notifikasi changes label member success inactivekan!\n` +
            `> Bot will notify typea there is member that labelnya inganti.\n\n` +
            `_Example: Admreceived tag "VIP" to member_`
        )
    }
    
    if (sub === 'off') {
        if (!currentStatus) {
            return m.reply(
                `⚠️ *ɴᴏᴛɪꜰ ʟᴀʙᴇʟ ᴀʟʀᴇᴀᴅʏ ɪɴᴀᴄᴛɪᴠᴇ*\n\n` +
                `> Status: *❌ OFF*\n` +
                `> Notifikasi ganti label already nonactive in this group.\n\n` +
                `_Usage \`${m.prefix}notifgantitag on\` for activate._`
            )
        }
        db.setGroup(m.chat, { notifLabelChange: false })
        return m.reply(
            `❌ *ɴᴏᴛɪꜰ ʟᴀʙᴇʟ ɴᴏɴᴀᴋᴛɪꜰ*\n\n` +
            `> Notifikasi changes label member success innonactivekan.`
        )
    }
    
    m.reply(
        `🏷️ *ɴᴏᴛɪꜰ ɢᴀɴᴛɪ ᴛᴀɢ/ʟᴀʙᴇʟ*\n\n` +
        `> Status: *${currentStatus ? '✅ ON' : '❌ OFF'}*\n\n` +
        `\`\`\`━━━ ᴘɪʟɪʜᴀɴ ━━━\`\`\`\n` +
        `> \`${m.prefix}notifgantitag on\` → Activekan\n` +
        `> \`${m.prefix}notifgantitag off\` → Nonactivekan\n` +
        `> \`${m.prefix}notifgantitag on all\` → Global ON (owner)\n` +
        `> \`${m.prefix}notifgantitag off all\` → Global OFF (owner)\n\n` +
        `> 📋 *Feature this will notify when:*\n` +
        `> • Admreceived label to member\n` +
        `> • Admin mengdelete label from member\n` +
        `> • Label member berchange`
    )
}

async function handleLabelChange(msg, sock) {
    try {
        const db = getDatabase()
        
        const protocolMessage = msg.message?.protocolMessage
        if (!protocolMessage) return false
        if (protocolMessage.type !== 30) return false
        
        const memberLabel = protocolMessage.memberLabel
        if (!memberLabel) return false
        
        const groupJid = msg.key.remoteJid
        if (!groupJid?.endsWith('@g.us')) return false
        
        const groupData = db.getGroup(groupJid) || {}
        
        const participant = msg.key.participant || msg.participant || 'Unknown'
        const label = memberLabel.label || ''
        
        const fs = require('fs')
        if (groupData.antitoxic && label && label.trim()) {
            try {
                const { isToxic, handleToxicMessage, DEFAULT_TOXIC_WORDS } = require('./antitoxic')
                const toxicWords = groupData.toxicWords || DEFAULT_TOXIC_WORDS
                const toxicCheck = isToxic(label, toxicWords)
                
                if (toxicCheck.toxic) {
                    await sock.sendText(groupJid, `Hei @${participant.split('@')[0]}, Tag you mengandung kata toxic !`, null, {
                        mentions: [participant],
                        contextInfo: {
                            mentionedJid: [participant],
                            forwardingScore: 99,
                            isForwarded: true,
                            externalAdReply: {
                                contentType: 1,
                                contentUrl: null,
                                sourceUrl: null,
                                title: "LABEL WARNING",
                                body: null,
                                thumbnail: fs.readFileSync('./assets/images/frenzy.jpg'),
                                renderLargerThumbnail: true,
                            }
                        },
                    })
                    return true
                }
            } catch {}
        }
        
        if (groupData.notifLabelChange !== true) return false
        
        let groupMeta = null
        try {
            groupMeta = await sock.groupMetadata(groupJid)
        } catch {}
        
        let notifText = ''
        
        if (label && label.trim()) {
            notifText = `🎉 @${participant.split('@')[0]} has change label become *${label}*`
        } else {
            notifText = `🥗 @${participant.split('@')[0]} has mengdelete label`
        }

        console.log(notifText)
        
        await sock.sendText(groupJid, notifText, null, {
            mentions: [participant],
            contextInfo: {
                mentionedJid: [participant],
                forwardingScore: 99,
                isForwarded: true,
                externalAdReply: {
                    contentType: 1,
                    contentUrl: null,
                    sourceUrl: null,
                    title: "LABEL WARNING",
                    body: null,
                    thumbnail: fs.readFileSync('./assets/images/frenzy.jpg'),
                    renderLargerThumbnail: true,
                }
            },
        })
        
        return true
    } catch (error) {
        console.error('[NotifLabelChange] Error:', error.message)
        return false
    }
}

module.exports = {
    config: pluginConfig,
    handler,
    handleLabelChange
}
