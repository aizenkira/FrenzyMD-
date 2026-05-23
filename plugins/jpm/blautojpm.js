const { getDatabase } = require('../../src/lib/frenzy-database')
const config = require('../../config')

const pluginConfig = {
    name: 'blautojpm',
    alias: ['blacklistautojpm', 'autojpmbl', 'listblautojpm'],
    category: 'jpm',
    description: 'Blacklist group from Auto JPM',
    usage: '.blautojpm <add/del/list>',
    example: '.blautojpm add',
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
    const args = m.args || []
    const action = m.command.includes('list') ? 'list' : (args[0] || '').toLowerCase()
    
    let blacklist = db.setting('autoJpmBlacklist') || []
    
    const saluranId = config.saluran?.id || '120363406397452589@newsletter'
    const saluranName = config.saluran?.name || config.bot?.name || 'Frenzy-AI'
    
    const contextInfo = {
        forwardingScore: 9999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
            newsletterJid: saluranId,
            newsletterName: saluranName,
            serverMessageId: 127
        }
    }
    
    if (!action || action === 'list') {
        if (blacklist.length === 0) {
            return m.reply(
                `📋 *ʙʟᴀᴄᴋʟɪsᴛ ᴀᴜᴛᴏ ᴊᴘᴍ*\n\n` +
                `> Not yet there is group that in-blacklist\n\n` +
                `*ᴜsᴀɢᴇ:*\n` +
                `> \`${m.prefix}blautojpm add\` - Blacklist this group\n` +
                `> \`${m.prefix}blautojpm del\` - Delete from blacklist`
            )
        }
        
        let txt = `📋 *ʙʟᴀᴄᴋʟɪsᴛ ᴀᴜᴛᴏ ᴊᴘᴍ*\n\n`
        txt += `> Total: *${blacklist.length}* group\n\n`
        
        const isThisBlacklisted = blacklist.includes(m.chat)
        txt += `> Group this: *${isThisBlacklisted ? '✅ Blacklisted' : '❌ No'}*\n\n`
        txt += `*ᴜsᴀɢᴇ:*\n`
        txt += `> \`${m.prefix}blautojpm add\` - Blacklist this group\n`
        txt += `> \`${m.prefix}blautojpm del\` - Delete from blacklist`
        
        return m.reply(txt)
    }
    
    if (action === 'add') {
        const jids = args.length > 1 ? args.slice(1).join('').split(',').filter(j => j.includes('@g.us')) : [m.chat]
        if (jids.length === 0 || !jids[0].includes('@g.us')) {
            return m.reply(`❌ Format JID group no valid or bot no in in group!`)
        }

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
        db.setting('autoJpmBlacklist', blacklist)
        await db.save()
        
        m.react('✅')
        return m.reply(
            `✅ *ʙʟᴀᴄᴋʟɪsᴛ ᴀᴜᴛᴏ ᴊᴘᴍ*\n\n` +
            `> Success inadd: \`${added}\` group\n` +
            `> Already there is: \`${duplicate}\` group\n` +
            `> Total blacklist: \`${blacklist.length}\` group\n\n` +
            `_Group-this group no will receive Auto JPM again._`
        )
    }
    
    if (action === 'del' || action === 'remove' || action === 'delete') {
        const jids = args.length > 1 ? args.slice(1).join('').split(',').filter(j => j.includes('@g.us')) : [m.chat]
        if (jids.length === 0 || !jids[0].includes('@g.us')) {
            return m.reply(`❌ Format JID group no valid or bot no in in group!`)
        }

        let removed = 0
        
        for (const targetGroup of jids) {
            const index = blacklist.indexOf(targetGroup)
            if (index !== -1) {
                blacklist.splice(index, 1)
                removed++
            }
        }
        
        db.setting('autoJpmBlacklist', blacklist)
        await db.save()
        
        m.react('✅')
        return m.reply(
            `✅ *ᴜɴʙʟᴀᴄᴋʟɪsᴛ ᴀᴜᴛᴏ ᴊᴘᴍ*\n\n` +
            `> Success deleted: \`${removed}\` group\n` +
            `> Sisa blacklist: \`${blacklist.length}\` group\n\n` +
            `_Group-this group will receive Auto JPM again._`
        )
    }
    
    return m.reply(`❌ Action no valid. Usage: \`add\`, \`del\`, or \`list\``)
}

module.exports = {
    config: pluginConfig,
    handler
}
