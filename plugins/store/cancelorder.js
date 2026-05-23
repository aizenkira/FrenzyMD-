const { getDatabase } = require('../../src/lib/frenzy-database')
const orderPoller = require('../../src/lib/frenzy-order-poller')
const pakasir = require('../../src/lib/frenzy-pakasir')
const te = require('../../src/lib/frenzy-error')

const pluginConfig = {
    name: 'cancelorder',
    alias: ['cancelorder', 'cancelorder'],
    category: 'store',
    description: 'Cancel order',
    usage: '.cancelorder <order_id>',
    example: '.cancelorder ORD20260111ABC123',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 5,
    energy: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    const db = getDatabase()
    const groupData = db.getGroup(m.chat) || {}
    
    if (groupData.botMode !== 'store') {
        return m.reply(`❌ Feature this only terseina in mode *STORE*!`)
    }
    
    const orderId = m.text?.trim().toUpperCase()
    
    if (!orderId) {
        return m.reply(
            `⚠️ *ᴄᴀʀᴀ ᴘᴀᴋᴀɪ*\n\n` +
            `> \`${m.prefix}cancelorder <order_id>\`\n\n` +
            `> View order: \`${m.prefix}myorder\``
        )
    }
    
    const order = orderPoller.getOrder(orderId)
    
    if (!order) {
        return m.reply(`❌ Order not found: \`${orderId}\``)
    }
    
    if (order.groupId !== m.chat) {
        return m.reply(`❌ Order this not from this group!`)
    }
    
    const isAdmin = m.isAdmin || m.isOwner
    const isOrderOwner = order.buyerJid === m.sender
    
    if (!isAdmin && !isOrderOwner) {
        return m.reply(`❌ You only can memcancel order milikmu yourself!`)
    }
    
    if (order.status === 'completed') {
        return m.reply(`❌ Order that already done cannot cancelled!`)
    }
    
    if (order.status === 'cancelled') {
        return m.reply(`❌ Order already cancelled beforenya!`)
    }
    
    if (order.status === 'paid' && !isAdmin) {
        return m.reply(`❌ Order that already inpay only can cancelled by admin!`)
    }
    
    try {
        if (pakasir.isEnabled() && order.status === 'pending') {
            try {
                await pakasir.cancelTransaction(orderId, order.total)
            } catch (e) {}
        }
        
        orderPoller.updateOrder(orderId, {
            status: 'cancelled',
            cancelledAt: new Date().toISOString(),
            cancelledBy: m.sender
        })
        
        const products = groupData.storeConfig?.products || []
        for (const item of (order.items || [])) {
            const product = products.find(p => p.id === item.id)
            if (product && product.stock !== -1) {
                product.stock += item.qty
            }
        }
        db.setGroup(m.chat, groupData)
        db.save()
        
        m.react('✅')
        
        const items = order.items?.map(it => `${it.name} x${it.qty}`).join(', ') || '-'
        
        return m.reply(
            `❌ *ᴏʀᴅᴇʀ ᴅɪʙᴀᴛᴀʟᴋᴀɴ*\n\n` +
            `> Order ID: \`${orderId}\`\n` +
            `> Item: ${items}\n` +
            `> Total: Rp ${order.total.toLocaleString('id-ID')}\n\n` +
            `> Stock product has intombackan.`
        )
        
    } catch (err) {
        return m.reply(te(m.prefix, m.command, m.pushName))
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
