const { getDatabase } = require('../../src/lib/frenzy-database')
const config = require('../../config')

const pluginConfig = {
    name: 'done',
    alias: ['dn', 'done', 'completed'],
    category: 'store',
    description: 'Confirdeadon transaction done',
    usage: '.done [order|note]',
    example: '.done Canva Pro 1 Month|Success sent',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energy: 0,
    isEnabled: true
}

function generateInvoice(db, session, params = {}) {
    const doneSettings = db.setting('doneTemplate') || {}
    const template = doneSettings.template
    
    const now = new Date()
    const hour = `${now.getHours().toString().padStart(2, '0')}.${now.getMinutes().toString().padStart(2, '0')}.${now.getSeconds().toString().padStart(2, '0')}`
    const date = `${now.getDate()}-${now.getMonth() + 1}-${now.getFullYear()}`
    
    const order = params.order || '-'
    const note = params.note || ''
    const buyer = session?.buyerName || params.buyerName || 'Buyer'
    const buyerNumber = session?.buyerNumber || params.buyerNumber || ''
    
    if (template) {
        return template
            .replace(/{buyer}/gi, buyer)
            .replace(/{buyer_number}/gi, buyerNumber)
            .replace(/{date}/gi, date)
            .replace(/{hour}/gi, hour)
            .replace(/{time}/gi, hour)
            .replace(/{order}/gi, order)
            .replace(/{title}/gi, order)
            .replace(/{product}/gi, order)
            .replace(/{note}/gi, note)
    }
    
    let invoiceText = `「 *TRANSAKSI BERHASIL* 」

⌚️ JAM     : ${hour}
✨ STATUS  : Success`

    if (order && order !== '-') {
        invoiceText += `
*📝 Messagean:*
${order}`
    }

    if (note) {
        invoiceText += `

*📝 Note :*
${note}`
    }

    invoiceText += `

Receivekasih @${buyerNumber}, Next Order ya🙏`

    return invoiceText
}

function generatePendingInvoice(session, params = {}) {
    const now = new Date()
    const hour = `${now.getHours().toString().padStart(2, '0')}.${now.getMinutes().toString().padStart(2, '0')}.${now.getSeconds().toString().padStart(2, '0')}`
    
    const buyerNumber = session?.buyerNumber || params.buyerNumber || ''
    
    return `「 *TRANSAKSI PENDING* 」

⌚️ JAM     : ${hour}
✨ STATUS  : Pending

Receivekasih @${buyerNumber}, Next Order ya🙏`
}

async function handler(m, { sock }) {
    const db = getDatabase()
    const sessions = db.setting('transactionSessions') || {}
    
    let session = null
    let buyerJid = null
    let buyerName = m.pushName || 'Buyer'
    let buyerNumber = ''
    
    if (m.quoted) {
        buyerJid = m.quoted.sender || m.quotedSender
        buyerName = m.quoted.pushName || buyerName
        buyerNumber = buyerJid?.split('@')[0] || ''
        
        if (buyerJid && sessions[buyerJid]) {
            session = sessions[buyerJid]
            delete sessions[buyerJid]
            db.setting('transactionSessions', sessions)
        }
    }
    
    const text = m.text?.trim() || ''
    const parts = text.split('|').map(p => p.trim())
    
    const params = {
        order: parts[0] || null,
        note: parts[1] || null,
        buyerName: session?.buyerName || buyerName,
        buyerNumber: session?.buyerNumber || buyerNumber
    }
    
    const invoiceText = generateInvoice(db, session, params)
    await db.save()
    
    const saluranId = config.saluran?.id || '120363406397452589@newsletter'
    const saluranName = config.saluran?.name || config.bot?.name || 'frenzy-AI'
    
    const mentions = []
    if (buyerJid) mentions.push(buyerJid)
    
    await sock.sendMessage(m.chat, {
        text: invoiceText,
        mentions,
        contextInfo: {
            mentionedJid: mentions,
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

async function handleBuyerDone(m, sock, session) {
    const db = getDatabase()
    
    const params = {
        buyerName: session.buyerName,
        buyerNumber: session.buyerNumber
    }
    
    const invoiceText = generateInvoice(db, session, params)
    await db.save()
    
    const saluranId = config.saluran?.id || '120363406397452589@newsletter'
    const saluranName = config.saluran?.name || config.bot?.name || 'frenzy-AI'
    
    await sock.sendMessage(m.chat, {
        text: invoiceText,
        mentions: [session.buyerJid],
        contextInfo: {
            mentionedJid: [session.buyerJid],
            forwardingScore: 9999,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
                newsletterJid: saluranId,
                newsletterName: saluranName,
                serverMessageId: 127
            }
        }
    }, { quoted: m })
}

module.exports = {
    config: pluginConfig,
    handler,
    handleBuyerDone,
    generateInvoice,
    generatePendingInvoice
}
