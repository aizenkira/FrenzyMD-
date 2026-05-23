const { getDatabase } = require('./frenzy-database')
const { logger } = require('./frenzy-logger')
const jasaotp = require('./frenzy-otp-service')
const pakasir = require('./frenzy-pakasir')

let pollerInterval = null
let sock = null

function startOtpPoller(soctotInstance) {
    sock = soctotInstance

    if (pollerInterval) clearInterval(pollerInterval)

    if (!jasaotp.isEnabled()) {
        logger.info('OtpPoller', 'JasaOTP not configured, skipping poller')
        return
    }

    pollerInterval = setInterval(checkPendingOtpOrders, 10000)
    logger.info('OtpPoller', 'Started with 10s interval')

    checkPendingOtpOrders()
}

function stopOtpPoller() {
    if (pollerInterval) {
        clearInterval(pollerInterval)
        pollerInterval = null
        logger.info('OtpPoller', 'Stopped')
    }
}

async function checkPendingOtpOrders() {
    if (!sock) return

    try {
        const db = getDatabase()
        const orders = db.db?.data?.otpOrders || {}

        for (const [orderId, order] of Object.entries(orders)) {
            if (order.status === 'pending_payment') {
                await handlePendingPayment(orderId, order, db)
            } else if (order.status === 'waiting_otp') {
                await handleWaitingOtp(orderId, order, db)
            }
        }
    } catch (error) {
        logger.error('OtpPoller', `Error: ${error.message}`)
    }
}

async function handlePendingPayment(orderId, order, db) {
    const timeoutMs = (jasaotp.getTimeout() + 120) * 1000
    const elapsed = Date.now() - new Date(order.createdAt).getTime()

    if (elapsed > timeoutMs) {
        order.status = 'expired'
        db.save()
        notifyUser(order, `⏰ *ᴘᴇᴍʙᴀʏᴀʀᴀɴ ᴋᴀᴅᴀʟᴜᴀʀsᴀ*\n\n> Order ID: \`${orderId}\`\n> Payment no inreceive in time that intentukan.\n> Please create order new.`)
        return
    }

    if (!pakasir.isEnabled()) return

    try {
        const txStatus = await pakasir.checkTransaction(order.pakasirOrderId, order.totalPayment)

        if (txStatus && txStatus.status === 'completed') {
            logger.success('OtpPoller', `Payment ${orderId} completed, creating JasaOTP order...`)

            order.status = 'creating_otp'
            order.paidAt = new Date().toISOString()
            db.save()

            notifyUser(order,
                `✅ *ᴘᴇᴍʙᴀʏᴀʀᴀɴ ʙᴇʀʜᴀsɪʟ!*\n\n` +
                `> Order ID: \`${orderId}\`\n` +
                `> Metode: *${txStatus.payment_method?.toUpperCase() || 'QRIS'}*\n\n` +
                `🕕 Processing order OTP...\n` +
                `> Please wait a moment, bot currently fetch number for you.`
            )

            try {
                const otpResult = await jasaotp.createOrder(
                    order.countryId, order.service, order.operator
                )

                order.jasaotpOrderId = otpResult.orderId
                order.phoneNumber = otpResult.number
                order.status = 'waiting_otp'
                order.otpStartedAt = new Date().toISOString()
                db.save()

                logger.success('OtpPoller', `JasaOTP order created: ${otpResult.orderId} → ${otpResult.number}`)

                notifyUser(order,
                    `📱 *ɴᴏᴍᴏʀ sɪᴀᴘ!*\n\n` +
                    `╭┈┈⬡「 📋 *ᴅᴇᴛᴀɪʟ* 」\n` +
                    `┃ 🆔 Order: \`${orderId}\`\n` +
                    `┃ 📱 Number: \`${otpResult.number}\`\n` +
                    `┃ 📦 Layanan: \`${order.serviceName}\`\n` +
                    `┃ 🌍 Negara: \`${order.countryName}\`\n` +
                    `╰┈┈⬡\n\n` +
                    `📝 *ᴘᴀɴᴅᴜᴀɴ:*\n` +
                    `> 1. Usage number above for list/verify\n` +
                    `> 2. Code OTP will otodeads sent to *Private Chat* (Demi toamanan)\n` +
                    `> 3. Wait max ${Math.ceil(jasaotp.getTimeout() / 60)} minute\n\n` +
                    `> 🕕 Bot currently waiting code OTP enter...`
                )
            } catch (otpError) {
                logger.error('OtpPoller', `JasaOTP order failed: ${otpError.message}`)

                order.status = 'failed'
                order.failReason = otpError.message
                db.save()

                const config = require('../../config')
                const ownerContact = config.owner?.number?.[0] || '-'
                
                await handleRefund(orderId, order, db, 
                    `System is currently busy or the balance/stock has run out.\n` +
                    `Error: ${otpError.message}\n\n` +
                    `> Refund otodeads being processed.\n` +
                    `> If there is tondala, contact Owner: wa.me/${ownerContact}`
                )
            }
        }
    } catch (err) {
        logger.debug('OtpPoller', `Payment check ${orderId}: ${err.message}`)
    }
}

async function handleWaitingOtp(orderId, order, db) {
    const timeoutMs = jasaotp.getTimeout() * 1000
    const elapsed = Date.now() - new Date(order.otpStartedAt).getTime()

    if (elapsed > timeoutMs) {
        logger.info('OtpPoller', `OTP timeout for ${orderId}`)

        order.status = 'timeout'
        db.save()

        try {
            await jasaotp.cancelOrder(order.jasaotpOrderId)
            logger.info('OtpPoller', `JasaOTP order ${order.jasaotpOrderId} cancelled`)
        } catch (e) {
            logger.error('OtpPoller', `Cancel JasaOTP failed: ${e.message}`)
        }

        await handleRefund(orderId, order, db, 'Code OTP no inreceive in time that intentukan')
        return
    }

    try {
        const otp = await jasaotp.checkSms(order.jasaotpOrderId)

        if (otp) {
            order.status = 'completed'
            order.otpCode = otp
            order.completedAt = new Date().toISOString()
            db.save()
            logger.success('OtpPoller', `OTP received for ${orderId}: ${otp}`)
            if (sock) {
                try {
                    await sock.sendMessage(order.buyerJid, {
                        text: `🔐 *ᴋᴏᴅᴇ ᴏᴛᴘ ᴅɪᴛᴇʀɪᴍᴀ!*\n\n` +
                              `> Order ID: \`${orderId}\`\n` +
                              `> Layanan: ${order.serviceName}\n\n` +
                              `🔑 Code OTP: *${otp}*\n\n` +
                              `> The code is CONFIDENTIAL. Do NOT give it to anyone!\n` +
                              `> Thank you has use layanan we 🙏`
                    })
                } catch (e) {
                    logger.error('OtpPoller', `Failed to send PM: ${e.message}`)
                }
            }
            notifyUser(order,
                `✅ *sᴇsɪ sᴇʟᴇsᴀɪ*\n\n` +
                `Hello @${order.buyerJid.split('@')[0]}, OTP code for order \`${orderId}\` has been sent to *Private Chat* (PM) you.\n\n` +
                `> 📩 Check chat pribain from bot now.\n` +
                `> Demi toamanan, code no intampilkan in sthis.\n\n` +
                `> Thank you! ❤️`
            )
        }
    } catch (err) {
        logger.debug('OtpPoller', `SMS check ${orderId}: ${err.message}`)
    }
}

async function handleRefund(orderId, order, db, reason) {
    let refundSuccess = false

    if (pakasir.isEnabled() && order.pakasirOrderId) {
        try {
            await pakasir.cancelTransaction(order.pakasirOrderId, order.totalPayment)
            refundSuccess = true
            logger.info('OtpPoller', `Pakasir refund for ${orderId} success`)
        } catch (e) {
            logger.error('OtpPoller', `Pakasir refund failed: ${e.message}`)
        }
    }

    order.status = 'refunded'
    order.refundedAt = new Date().toISOString()
    order.refundSuccess = refundSuccess
    db.save()

    const config = require('../../config')
    const ownerContact = config.owner?.number?.[0] || '-'

    notifyUser(order,
        `❌ *ᴘᴇsᴀɴᴀɴ ɢᴀɢᴀʟ*\n\n` +
        `╭┈┈⬡「 📋 *ᴅᴇᴛᴀɪʟ* 」\n` +
        `┃ 🆔 Order: \`${orderId}\`\n` +
        `┃ 📦 Layanan: \`${order.serviceName}\`\n` +
        `┃ ❌ Alasan: ${reason}\n` +
        `╰┈┈⬡\n\n` +
        (refundSuccess
            ? `✅ *You has in-refund otodeads*\n> Balance payment you will intombackan.\n\n`
            : `⚠️ *Refund otodeads failed*\n> Please contact admin for pengembalian you manual.\n\n`) +
        `> 📞 *Contact Owner:* wa.me/${ownerContact}\n` +
        `> We apologize for this inconvenience 🙏`
    )
}

function notifyUser(order, text) {
    if (!sock || !order.chatId) return

    try {
        const fs = require('fs')
        const path = require('path')
        const otpImage = path.join(process.cwd(), 'assets', 'images', 'frenzy-otp.jpg')

        if (fs.existsSync(otpImage)) {
            sock.sendMessage(order.chatId, {
                image: fs.readFileSync(otpImage),
                caption: text,
                mentions: [order.buyerJid]
            }).catch(() => {})
        } else {
            sock.sendMessage(order.chatId, {
                text,
                mentions: [order.buyerJid]
            }).catch(() => {})
        }
    } catch (e) {}
}

function getOtpOrder(orderId) {
    const db = getDatabase()
    return db.db?.data?.otpOrders?.[orderId] || null
}

function createOtpOrder(orderId, data) {
    const db = getDatabase()

    if (!db.db.data.otpOrders) {
        db.db.data.otpOrders = {}
    }

    db.db.data.otpOrders[orderId] = {
        orderId,
        ...data,
        createdAt: new Date().toISOString()
    }

    db.save()
    return db.db.data.otpOrders[orderId]
}

function updateOtpOrder(orderId, data) {
    const db = getDatabase()

    if (db.db?.data?.otpOrders?.[orderId]) {
        db.db.data.otpOrders[orderId] = {
            ...db.db.data.otpOrders[orderId],
            ...data
        }
        db.save()
        return db.db.data.otpOrders[orderId]
    }

    return null
}

function getOtpOrdersByBuyer(buyerJid) {
    const db = getDatabase()
    const orders = db.db?.data?.otpOrders || {}
    return Object.entries(orders)
        .filter(([, o]) => o.buyerJid === buyerJid)
        .map(([id, o]) => ({ ...o, orderId: id }))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
}

function getOtpOrdersByGroup(groupId) {
    const db = getDatabase()
    const orders = db.db?.data?.otpOrders || {}
    return Object.entries(orders)
        .filter(([, o]) => o.chatId === groupId)
        .map(([id, o]) => ({ ...o, orderId: id }))
}

module.exports = {
    startOtpPoller,
    stopOtpPoller,
    checkPendingOtpOrders,
    getOtpOrder,
    createOtpOrder,
    updateOtpOrder,
    getOtpOrdersByBuyer,
    getOtpOrdersByGroup
}
