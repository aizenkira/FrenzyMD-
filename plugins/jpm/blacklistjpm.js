const { getDatabase } = require('../../src/lib/frenzy-database')
const config = require('../../config')
const fs = require("fs")
const path = require('path')
const pluginConfig = {
    name: 'blacklistjpm',
    alias: ['bljpm', 'jpmbl', 'jpmblacklist', 'listblacklistjpm'],
    category: 'jpm',
    description: 'Blacklist group from JPM with interactive buttons',
    usage: '.blacklistjpm',
    example: '.blacklistjpm',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energy: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    const db = getDatabase()
    const args = m.text.split(' ') || []
    const action = args[0]
    let blacklist = db.setting('jpmBlacklist') || []
    
    if (action === 'add' && args.length > 1) {
        const jids = args.slice(1).join('').split(',').filter(j => j.includes('@g.us'))
        if (jids.length === 0) return m.reply(`❌ Format JID group no valid! (Must mengandung @g.us)`)
        
        let added = 0
        let duplicate = 0
        
        for (const targetGroup of jids) {
            if (!blacklist.includes(targetGroup)) {
                blacklist.push(targetGroup)
                added++
            } else {
                duplicate++
            }
        }
        
        db.setting('jpmBlacklist', blacklist)
        m.react('🚫')
        
        return m.reply(
            `🚫 *ᴅɪᴛᴀᴍʙᴀʜᴋᴀɴ ᴋᴇ ʙʟᴀᴄᴋʟɪsᴛ*\n\n` +
            `> Success inadd: \`${added}\` group\n` +
            `> Already there is: \`${duplicate}\` group\n` +
            `> Total blacklist: \`${blacklist.length}\` group\n\n` +
            `_Group-this group no will receive JPM again._`
        )
    }
    
    if (action === 'del' || action === 'remove' || action === 'delete') {
        if (args.length > 1) {
            const jids = args.slice(1).join('').split(',').filter(j => j.includes('@g.us'))
            if (jids.length === 0) return m.reply(`❌ Format JID group no valid! (Must mengandung @g.us)`)
            
            let removed = 0
            
            for (const targetGroup of jids) {
                const index = blacklist.indexOf(targetGroup)
                if (index !== -1) {
                    blacklist.splice(index, 1)
                    removed++
                }
            }
            
            db.setting('jpmBlacklist', blacklist)
            m.react('✅')
            
            return m.reply(
                `✅ *ᴅɪʜᴀᴘᴜs ᴅᴀʀɪ ʙʟᴀᴄᴋʟɪsᴛ*\n\n` +
                `> Success deleted: \`${removed}\` group\n` +
                `> Sisa blacklist: \`${blacklist.length}\` group`
            )
        }
    }
    
    if (action === 'list') {
        if (blacklist.length === 0) {
            return m.reply(`📋 *ᴊᴘᴍ ʙʟᴀᴄᴋʟɪsᴛ*\n\n> No there is group that in-blacklist`)
        }
        
        let listText = `📋 *ᴊᴘᴍ ʙʟᴀᴄᴋʟɪsᴛ*\n\n> Total: \`${blacklist.length}\` group\n\n`
        
        for (let i = 0; i < blacklist.length; i++) {
            const groupId = blacklist[i]
            try {
                const meta = await sock.groupMetadata(groupId)
                listText += `${i + 1}. ${meta.subject}\n`
            } catch (e) {
                listText += `${i + 1}. Unknown Group\n`
            }
        }
        
        return m.reply(listText)
    }
    
    return m.reply(
        `📢 *JPM BLACKLIST (DAFTAR HITAM)*\n\n` +
        `Feature this in use for mengecualikan group-group specific so that no insenin message Broadcast JPM by owner.\n\n` +
        `*PENGGUNAAN COMMAND:*\n` +
        `• \`${m.prefix}blacklistjpm list\` — View all list group yg inblacklist\n` +
        `• \`${m.prefix}blacklistjpm add <jid1>,<jid2>\` — Addkan group to blacklist\n` +
        `• \`${m.prefix}blacklistjpm del <jid1>,<jid2>\` — Delete group from blacklist\n\n` +
        `*CONTOH PENGGUNAAN:*\n` +
        `> \`${m.prefix}blacklistjpm add 1203631@g.us, 1203632@g.us\`\n\n` +
        `*STATISTIK SAAT INI:*\n` +
        `> Group inblacklist: \`${blacklist.length}\` group`
    )
}

module.exports = {
    config: pluginConfig,
    handler
}
