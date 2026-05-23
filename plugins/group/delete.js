const pluginConfig = {
    name: 'delete',
    alias: ['del', 'delete', 'd'],
    category: 'group',
    description: 'Delete message with reply',
    usage: '.delete (reply message)',
    example: '.delete',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    isAdmin: false,
    isBotAdmin: false,
    cooldown: 3,
    energy: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    if (!m.quoted) {
        return m.reply('⚠️ *Reply message to be deleted!*')
    }
    
    const quotedSender = m.quoted.sender || m.quoted.key?.participant
    const botJid = sock.user?.id?.split(':')[0] + '@s.whatsapp.net'
    const isOwnMessage = m.quoted.key?.fromMe || quotedSender === m.sender
    const isBotMessage = quotedSender === botJid || m.quoted.key?.fromMe
    
    if (!isOwnMessage && !isBotMessage) {
        if (!m.isBotAdmin) {
            return m.reply('⚠️ *Bot must become admin for delete message other people!*')
        }
        if (!m.isAdmin && !m.isOwner) {
            return m.reply('⚠️ *Only admin that can delete message other people!*')
        }
    }
    
    try {
        const toy = {
            remoteJid: m.chat,
            id: m.quoted.key.id,
            fromMe: m.quoted.key.fromMe,
            participant: quotedSender
        }
        
        await sock.sendMessage(m.chat, { delete: toy })
        await m.react('✅')
        
    } catch (err) {
        if (err.message?.includes('not found') || err.message?.includes('forbidden')) {
            await m.reply('❌ *Failed mengdelete!*\n> Message maybe already deleted or too old.')
        } else {
            await m.react('❌')
        }
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
