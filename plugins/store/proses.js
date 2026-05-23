const { getDatabase } = require('../../src/lib/frenzy-database')
const config = require('../../config')

const pluginConfig = {
    name: 'process',
    alias: ['prs', 'process'],
    category: 'store',
    description: 'Start process transaction with buyer',
    usage: '.prs',
    example: '.prs',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 3,
    energy: 0,
    isEnabled: true
}

const defaultTemplate = `「 *TRANSAKSI DIPROSES* 」

⌚️ JAM     : {hour}
✨ STATUS  : Inprocess

*👤 Buyer:*
@{buyer_number} ({buyer})

Please wait ya, order being processed🙏`

function generateProcessMessage(db, session) {
    const processSettings = db.setting('processTemplate') || {}
    const template = processSettings.template || defaultTemplate
    
    const now = new Date()
    const hour = `${now.getHours().toString().padStart(2, '0')}.${now.getMinutes().toString().padStart(2, '0')}.${now.getSeconds().toString().padStart(2, '0')}`
    const date = `${now.getDate()}-${now.getMonth() + 1}-${now.getFullYear()}`
    
    return template
        .replace(/{buyer}/gi, session.buyerName)
        .replace(/{buyer_number}/gi, session.buyerNumber)
        .replace(/{hour}/gi, hour)
        .replace(/{time}/gi, hour)
        .replace(/{date}/gi, date)
}

async function handler(m, { sock }) {
    const db = getDatabase()
    
    if (!m.quoted) {
        return m.reply(
            `📦 *ᴘʀᴏsᴇs ᴛʀᴀɴsᴀᴋsɪ*\n\n` +
            `> Reply message buyer lalu type \`${m.prefix}prs\`\n\n` +
            `*ғʟᴏᴡ:*\n` +
            `1. Reply message buyer → \`${m.prefix}prs\`\n` +
            `2. Process transaction...\n` +
            `3. Done → \`${m.prefix}done\` or \`${m.prefix}done order|note\``
        )
    }
    
    const buyerJid = m.quoted.sender || m.quotedSender
    const buyerName = m.quoted.pushName || 'Buyer'
    const buyerNumber = buyerJid?.split('@')[0] || ''
    
    if (!buyerJid) {
        return m.reply(`❌ Cannot earn number buyer!`)
    }
    
    let sessions = db.setting('transactionSessions') || {}
    
    if (sessions[buyerJid]) {
        return m.reply(
            `⚠️ Buyer this already exist transaction active!\n\n` +
            `> Name: ${sessions[buyerJid].buyerName}\n` +
            `> Number: ${sessions[buyerJid].buyerNumber}\n\n` +
            `> Delete: \`${m.prefix}cancelprocess @${buyerNumber}\``
        )
    }
    
    const session = {
        buyerJid,
        buyerName,
        buyerNumber,
        sellerJid: m.sender,
        chatJid: m.chat,
        startedAt: Date.now(),
        status: 'processing'
    }
    
    sessions[buyerJid] = session
    db.setting('transactionSessions', sessions)
    await db.save()
    
    const saluranId = config.saluran?.id || '120363406397452589@newsletter'
    const saluranName = config.saluran?.name || config.bot?.name || 'frenzy-AI'
    
    const processMessage = generateProcessMessage(db, session)
    
    await sock.sendMessage(m.chat, {
        text: processMessage,
        mentions: [buyerJid],
        contextInfo: {
            mentionedJid: [buyerJid],
            forwardingScore: 9999,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
                newsletterJid: saluranId,
                newsletterName: saluranName,
                serverMessageId: 127
            }
        }
    }, { quoted: m })
    
    m.react('✅')
}

module.exports = {
    config: pluginConfig,
    handler
}
