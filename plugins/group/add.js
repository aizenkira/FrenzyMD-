const te = require('../../src/lib/frenzy-error')
const pluginConfig = {
    name: 'add',
    alias: ['addmember', 'invite'],
    category: 'group',
    description: 'Add members to the group (supports multiple addition)',
    usage: '.add <number1> [number2] [number3]... [link_group]',
    example: '.add 233533416608 233544444555',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energy: 0,
    isEnabled: true,
    isAdmin: true,
    isBotAdmin: true
}

async function handler(m, { sock }) {
    const args = m.args || []
    
    if (args.length === 0) {
        return m.reply(
            `👥 *ᴀᴅᴅ ᴍᴇᴍʙᴇʀ*\n\n` +
            `> How to use:\n` +
            `> 1. In group: \`${m.prefix}add <number>\`\n` +
            `> 2. Multiple: \`${m.prefix}add <number1> <number2> ...\`\n` +
            `> 3. In private: \`${m.prefix}add <number> <link_group>\`\n\n` +
            `> Example:\n` +
            `> \`${m.prefix}add 6281234567890\`\n` +
            `> \`${m.prefix}add 628123 628456 628789\`\n` +
            `> \`${m.prefix}add 628123 https://chat.whatsapp.com/xxx\`\n\n` +
            `> Syarat:\n` +
            `> - Bot must admin in group target\n` +
            `> - User running command must admin`
        )
    }
    
    let targetGroup = m.isGroup ? m.chat : null
    let targetNumbers = []
    
    for (const arg of args) {
        const linkMatch = arg.match(/chat\.whatsapp\.com\/([a-zA-Z0-9]+)/)
        if (linkMatch) {
            try {
                const groupInfo = await sock.groupGetInviteInfo(linkMatch[1])
                targetGroup = groupInfo.id
            } catch (e) {
                return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Group link no longer valid or already expired!`)
            }
        } else if (arg.includes('@g.us')) {
            targetGroup = arg
        } else {
            let num = arg.replace(/[^0-9]/g, '')
            if (num.startsWith('0')) {
                num = '62' + num.slice(1)
            }
            if (num.length >= 10) {
                targetNumbers.push(num)
            }
        }
    }
    
    if (targetNumbers.length === 0) {
        return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Enter number that is valid!`)
    }
    
    if (!targetGroup) {
        return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Run in group or with link group!\n\n\`${m.prefix}add <number> <link_group>\``)
    }
    
    try {
        const groupMeta = await sock.groupMetadata(targetGroup)
        const botId = sock.user?.id?.split(':')[0] + '@s.whatsapp.net'
        const botParticipant = groupMeta.participants.find(p => 
            p.id === botId || p.jid === botId || p.id?.includes(sock.user?.id?.split(':')[0])
        )
        
        if (!botParticipant || !['admin', 'superadmin'].includes(botParticipant.admin)) {
            return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Bot not an admin in group *${groupMeta.subject}*!`)
        }
        
        if (!m.isGroup) {
            const senderId = m.sender?.split('@')[0]
            const senderParticipant = groupMeta.participants.find(p => 
                p.id?.includes(senderId) || p.jid?.includes(senderId)
            )
            
            if (!senderParticipant || !['admin', 'superadmin'].includes(senderParticipant.admin)) {
                return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> You not an admin in group *${groupMeta.subject}*!`)
            }
        }
        
        const validNumbers = []
        const alreadyInGroup = []
        
        for (const num of targetNumbers) {
            const existingMember = groupMeta.participants.find(p => 
                p.id?.includes(num) || p.jid?.includes(num)
            )
            
            if (existingMember) {
                alreadyInGroup.push(num)
            } else {
                validNumbers.push(num + '@s.whatsapp.net')
            }
        }
        
        if (validNumbers.length === 0) {
            return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> All number already exist in group!`)
        }
        
        m.react('🕕')
        
        const results = await sock.groupPmeaningcipantsUpdate(targetGroup, validNumbers, 'add')
        
        let successList = []
        let invitedList = []
        let failedList = []
        
        for (const res of results) {
            const num = res.content?.attrs?.phone_number?.replace('@s.whatsapp.net', '') || ''
            
            if (res.status === '200') {
                successList.push(num)
            } else if (res.status === '408') {
                invitedList.push(num)
            } else {
                failedList.push({ num, status: res.status })
            }
        }
        
        let resultText = `🥗 @${m.sender.split('@')[0]} has added member to group\n\n`
        
        if (successList.length > 0) {
            resultText += `Ada *${successList.length}* members successfully added:\n`
            successList.forEach(n => resultText += `• @${n}\n`)
            resultText += `\n`
        }
        
        if (invitedList.length > 0) {
            resultText += `📨 *And there is also *${invitedList.length}* members that were invited:*\n`
            invitedList.forEach(n => resultText += `• @${n}\n`)
            resultText += `\n`
        }
        
        if (failedList.length > 0) {
            resultText += `❌ *ɢᴀɢᴀʟ (${failedList.length}):*\n`
            failedList.forEach(f => resultText += `• @${f.num} (${f.status})\n`)
            resultText += `\n`
        }
        
        if (alreadyInGroup.length > 0) {
            resultText += `⏭️ *sᴜᴅᴀʜ ᴅɪ ɢʀᴜᴘ (${alreadyInGroup.length}):*\n`
            alreadyInGroup.forEach(n => resultText += `• @${n}\n`)
        }
        
        m.react(successList.length > 0 || invitedList.length > 0 ? '✅' : '❌')
        await m.reply(resultText, { mentions: [ ...successList.map(n => n + '@s.whatsapp.net'), ...invitedList.map(n => n + '@s.whatsapp.net'), ...failedList.map(f => f.num + '@s.whatsapp.net'), ...alreadyInGroup.map(n => n + '@s.whatsapp.net'), m.sender ] })
        
    } catch (error) {
        m.react('❌')
        
        if (error.message?.includes('not-authorized')) {
            await m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Bot don't have permission to add members!`)
        } else if (error.message?.includes('forbidden')) {
            await m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Bot don't have access to this group!`)
        } else {
            m.reply(te(m.prefix, m.command, m.pushName))
        }
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
