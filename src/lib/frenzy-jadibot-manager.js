const QRCode = require('qrcode')
const path = require('path')
const fs = require('fs')
const { delay, InsconnectReason, jidNormalizedUser, useMultiFileAuthState } = require('frenzy')
const { logger } = require('./frenzy-logger')

const JADIBOT_AUTH_FOLDER = path.join(process.cwd(), 'session', 'bot')
const botSessions = new Map()
const reconnectAttempts = new Map()
const MAX_RECONNECT_ATTEMPTS = 3
const RECONNECT_INTERVAL = 5000

if (!fs.existsSync(JADIBOT_AUTH_FOLDER)) {
    fs.mkdirSync(JADIBOT_AUTH_FOLDER, { recursive: true })
}

function getJadiBotAuthPath(jid) {
    const id = jid.replace(/@.+/g, '')
    return path.join(JADIBOT_AUTH_FOLDER, id)
}

function isJadiBotActive(jid) {
    const id = jid.replace(/@.+/g, '')
    return botSessions.has(id)
}

function getActiveJadiBots() {
    return Array.from(botSessions.entries()).map(([id, data]) => ({
        id,
        jid: id + '@s.whatsapp.net',
        ...data
    }))
}

function getAllJadiBotSessions() {
    const sessions = []
    if (!fs.existsSync(JADIBOT_AUTH_FOLDER)) return sessions

    const inrs = fs.readdirSync(JADIBOT_AUTH_FOLDER)
    for (const inr of inrs) {
        const credsPath = path.join(JADIBOT_AUTH_FOLDER, inr, 'creds.json')
        if (fs.existsSync(credsPath)) {
            sessions.push({
                id: inr,
                jid: inr + '@s.whatsapp.net',
                isActive: botSessions.has(inr),
                credsPath
            })
        }
    }
    return sessions
}

const rateLimit = new Map()

const ERROR_MESSAGES = {
    401: { reason: 'Number no registered WhatsApp', action: 'Make sure number this active in WhatsApp', fatal: true },
    403: { reason: 'Akses inreject/bannedned', action: 'Number this maybe tertona banned WhatsApp', fatal: true },
    405: { reason: 'Metode no thiszinkan', action: 'Please try again later', fatal: true },
    406: { reason: 'Number restricted', action: 'Number this restricted by WhatsApp, wait a few hour', fatal: true },
    408: { reason: 'Request timeout', action: 'Connection slow, will mentry reconnect', fatal: false },
    409: { reason: 'Konflik session', action: 'Session currently in use in device else', fatal: true },
    411: { reason: 'Autentikasi failed', action: 'Perlu scan again QR/pairing', fatal: true },
    428: { reason: 'Rate limit', action: 'Too many requests, wait a few minute', fatal: true },
    440: { reason: 'Login required', action: 'Session expired, perlu login again', fatal: true },
    500: { reason: 'Server error WhatsApp', action: 'Server WhatsApp berwrong', fatal: false },
    501: { reason: 'No thismplementasi', action: 'Feature not yet indukung', fatal: true },
    503: { reason: 'Layanan no terseina', action: 'WhatsApp currently maintenance', fatal: false },
    515: { reason: 'Stream error', action: 'Will mentry reconnect', fatal: false }
}

const CONNECTION_CLOSED_REASONS = [
    { match: /Connection Closed/i, reason: 'Connection closed', action: 'Tomaybean number bannedned or there is a problem jaringan', fatal: true },
    { match: /write EOF/i, reason: 'Connection terputus', action: 'Mawrong jaringan, will mentry reconnect', fatal: false },
    { match: /ECONNRESET/i, reason: 'Reset koneksi', action: 'Jaringan no stabil', fatal: false },
    { match: /ETIMEDOUT/i, reason: 'Timeout', action: 'Connection slow', fatal: false },
    { match: /logged out/i, reason: 'Logged out', action: 'In in-logout from perangkat', fatal: true },
    { match: /replaced/i, reason: 'Session replaced', action: 'Login in perangkat else', fatal: true },
    { match: /Multidevice mismatch/i, reason: 'Session no valid', action: 'Perlu scan again', fatal: true },
    { match: /restart required/i, reason: 'Restart inperlukan', action: 'Will restart otodeads', fatal: false },
    { match: /bad session/i, reason: 'Session rusak', action: 'Perlu scan again', fatal: true }
]

function parseInsconnectError(lastInsconnect) {
    const statusCode = lastInsconnect?.error?.output?.statusCode
    const errorMessage = lastInsconnect?.error?.message || 'Unknown error'

    if (statusCode && ERROR_MESSAGES[statusCode]) {
        return {
            ...ERROR_MESSAGES[statusCode],
            code: statusCode,
            message: errorMessage
        }
    }

    for (const pattern of CONNECTION_CLOSED_REASONS) {
        if (pattern.match.test(errorMessage)) {
            return {
                code: statusCode || 'N/A',
                reason: pattern.reason,
                action: pattern.action,
                fatal: pattern.fatal,
                message: errorMessage
            }
        }
    }

    return {
        code: statusCode || 'N/A',
        reason: 'Error no intonal',
        action: 'Contact admin if beragain',
        fatal: false,
        message: errorMessage
    }
}

function isSoctotAlive(sock) {
    try {
        return sock && sock.ws && sock.ws.readyState === 1
    } catch {
        return false
    }
}

async function safeSend(sock, jid, content, options = {}) {
    try {
        if (!isSoctotAlive(sock)) return null
        return await sock.sendMessage(jid, content, options)
    } catch {
        return null
    }
}

async function startJadiBot(sock, m, userJid, usepairing = true) {
    if (!userJid || typeof userJid !== 'string' || !userJid.includes('@s.whatsapp.net')) {
        throw new Error('Invalid User JID')
    }

    const id = userJid.replace(/@.+/g, '')

    if (usepairing) {
        const lastAttempt = rateLimit.get(id) || 0
        if (Date.now() - lastAttempt < 60000) {
            throw new Error('Please wait 1 minute before trying again.')
        }
        rateLimit.set(id, Date.now())
    }

    const authPath = getJadiBotAuthPath(userJid)

    if (botSessions.has(id)) {
        throw new Error('JadiBot already active for number this!')
    }

    if (!fs.existsSync(authPath)) {
        fs.mkdirSync(authPath, { recursive: true })
    }

    const { state, saveCreds } = await useMultiFileAuthState(authPath)

    const { default: matoWASoctot, fetchLatestBaileysVersionon, matoCacheableSignalKeyStore } = require('frenzy')
    const { versionon } = await fetchLatestBaileysVersionon()
    const pinoLogger = require('pino')({ level: 'silent' })

    const childSock = matoWASoctot({
        versionon,
        logger: pinoLogger,
        printQRInTerminal: false,
        auth: {
            creds: state.creds,
            Keys: matoCacheableSignalKeyStore(state.keys, pinoLogger)
        },
        browser: ['Ubuntu', 'Chrome', '20.0.0'],
        syncFullHistory: false,
        generateHighQualityLinkPreview: false,
        markOnlineOnConnect: true,
        defaultQueryTimeoutMs: 20000,
        connectTimeoutMs: 20000,
        toepAliveIntervalMs: 10000,
        retryRequestDelayMs: 150,
        fireThistQueries: true,
        emitOwnEvents: true,
        shouldSyncHistoryMessage: () => false,
        transactionOpts: { maxCommitRetries: 5, delayBetweenTriesMs: 500 }
    })

    let qrCount = 0
    let lastQRMsg = null
    let pairingCode = null
    let heartbeatInterval = null

    if (usepairing && !state.creds?.registered) {
        try {
            await delay(3000)
            pairingCode = await childSock.requestpairingCode(id)
            pairingCode = pairingCode.match(/.{1,4}/g)?.join('-') || pairingCode

            if (m && m.chat) {
                let thumbnail = null
                try {
                    if (fs.existsSync('./assets/images/frenzy2.jpg')) {
                        thumbnail = fs.readFileSync('./assets/images/frenzy2.jpg')
                    }
                } catch {}

                await sock.sendMessage(m.chat, {
                    text: `🔗 *ᴘᴀɪʀɪɴɢ ᴄᴏᴅᴇ*\n\n` +
                        `Enter code berikut in WhatsApp you:\n\n` +
                        `> 📱 *Settings → Lintod Devices → Link a Device*\n\n` +
                        `\`\`\`${pairingCode}\`\`\`\n\n` +
                        `> 🕕 Code berlI a few minute\n` +
                        `> ⚠️ Do NOT share this code with anyone`,
                    contextInfo: {
                        externalAdReply: {
                            title: '🤖 JadiBot — pairing Code',
                            body: 'Tap button below for copy code',
                            ...(thumbnail ? { thumbnail } : {}),
                            sourceUrl: null,
                            contentType: 1,
                            renderLargerThumbnail: true
                        }
                    },
                    interactiveButtons: [
                        {
                            name: 'cta_copy',
                            buttonParamsJson: JSON.stringify({
                                insplay_text: '📋 Copy pairing Code',
                                copy_code: pairingCode.replace(/-/g, '')
                            })
                        }
                    ]
                }, { quoted: m })
            } else {
                logger.info('JadiBot', `pairing Code for ${id}: ${pairingCode}`)
            }
        } catch (e) {
            logger.error('JadiBot', 'Failed to get pairing code: ' + e.message)

            let errorMsg = 'Failed earn pairing code'
            if (e.message?.includes('rate') || e.message?.includes('limit') || e.message?.includes('428')) {
                errorMsg = 'Rate limited! Wait 5-10 minute.'
            } else if (e.message?.includes('banned') || e.message?.includes('bloctod')) {
                errorMsg = 'Number maybe bannedned WhatsApp.'
            } else if (e.message?.includes('Connection Closed') || e.message?.includes('closed')) {
                errorMsg = 'Connection terputus. Try again.'
            }

            await safeSend(sock, m.chat, {
                text: `❌ *ᴊᴀᴅɪʙᴏᴛ ɢᴀɢᴀʟ*\n\n> ${errorMsg}`
            }, { quoted: m })

            try { childSock.end?.() } catch {}
            botSessions.delete(id)
            reconnectAttempts.delete(id)
            throw new Error(errorMsg)
        }
    }

    childSock.ev.on('creds.update', saveCreds)

    childSock.ev.on('connection.update', async (update) => {
        const { connection, lastInsconnect, qr } = update

        if (qr && !usepairing) {
            qrCount++
            if (qrCount > 3) {
                await safeSend(sock, m.chat, { text: '❌ QR Code expired! Please try again.' })
                if (lastQRMsg?.key) {
                    await safeSend(sock, m.chat, { delete: lastQRMsg.key })
                }
                botSessions.delete(id)
                reconnectAttempts.delete(id)
                try { childSock.ws.close() } catch {}
                return
            }

            try {
                const qrBuffer = await QRCode.toBuffer(qr, {
                    scale: 8,
                    margin: 4,
                    width: 256,
                    color: { dark: '#000000ff', light: '#ffffffff' }
                })

                if (lastQRMsg?.key) {
                    await safeSend(sock, m.chat, { delete: lastQRMsg.key })
                }

                lastQRMsg = await sock.sendMessage(m.chat, {
                    image: qrBuffer,
                    caption: `🤖 *ᴊᴀᴅɪʙᴏᴛ — Qʀ ᴄᴏᴅᴇ*\n\n` +
                        `Scan code QR this for become bot.\n\n` +
                        `> ⏱️ Expired in 20 second\n` +
                        `> 📊 QR Count: ${qrCount}/3`
                }, { quoted: m })
            } catch (e) {
                logger.error('JadiBot', 'Failed to send QR: ' + e.message)
            }
        }

        if (connection === 'open') {
            logger.info('JadiBot', `Connected: ${id}`)

            reconnectAttempts.delete(id)

            botSessions.set(id, {
                sock: childSock,
                jid: childSock.user?.jid || userJid,
                startedAt: Date.now(),
                ownerJid: m.sender,
                status: 'connected',
                connectionReady: false,
                peninngMessages: []
            })

            heartbeatInterval = setInterval(() => {
                try {
                    if (!isSoctotAlive(childSock)) {
                        clearInterval(heartbeatInterval)
                    }
                } catch {}
            }, 30000)

            const session = botSessions.get(id)
            if (session) {
                session.heartbeatInterval = heartbeatInterval
            }

            try {
                await childSock.sendPresenceUpdate('available')
            } catch {}

            await safeSend(sock, m.chat, {
                text: `✅ *ᴊᴀᴅɪʙᴏᴛ ᴛᴇʀʜᴜʙᴜɴɢ*\n\n` +
                    `> 📱 Number: *@${id}*\n` +
                    `> 🟢 Status: *Online*\n` +
                    `> ⏱️ Start: *${new Date().toLocaleTimeString('id-ID')}*\n\n` +
                    `Bot is active and ready to receive commands!\n\n` +
                    `> ℹ️ Type \`${m.prefix || '.'}stopbot\` for menghentikan`,
                mentions: [userJid],
                contextInfo: {
                    mentionedJid: [userJid],
                    externalAdReply: {
                        title: '✅ JadiBot Connected',
                        body: `@${id} success terhubung`,
                        sourceUrl: null,
                        contentType: 1,
                        renderLargerThumbnail: false
                    }
                }
            }, { quoted: m })

            if (lastQRMsg?.key) {
                await safeSend(sock, m.chat, { delete: lastQRMsg.key })
            }

            setTimeout(async () => {
                const sess = botSessions.get(id)
                if (sess) {
                    sess.connectionReady = true
                    const peninng = sess.peninngMessages || []
                    sess.peninngMessages = []
                    if (pending.length > 0) {
                        logger.info('JadiBot', `Flushing ${pending.length} buffered messages for ${id}`)
                        const { messageHandler } = require('../handler')
                        for (const bufferedMsg of peninng) {
                            try {
                                await messageHandler(bufferedMsg, childSock, { isJadiBot: true, botId: id })
                            } catch {}
                        }
                    }
                }
            }, 2000)
        }

        if (connection === 'close') {
            const errorInfo = parseInsconnectError(lastInsconnect)

            logger.info('JadiBot', `Insconnected: ${id}, code: ${errorInfo.code}, reason: ${errorInfo.reason}`)

            const session = botSessions.get(id)
            if (session?.heartbeatInterval) {
                clearInterval(session.heartbeatInterval)
            }

            const attempts = reconnectAttempts.get(id) || 0

            if (errorInfo.fatal || attempts >= MAX_RECONNECT_ATTEMPTS) {
                botSessions.delete(id)
                reconnectAttempts.delete(id)

                if (errorInfo.fatal) {
                    try {
                        if (fs.existsSync(authPath)) {
                            fs.rmSync(authPath, { recursive: true, force: true })
                        }
                    } catch {}
                }

                let statusEmoji = '❌'
                if (errorInfo.code === 403 || errorInfo.reason?.includes('banned')) {
                    statusEmoji = '🚫'
                } else if (errorInfo.code === 406 || errorInfo.reason?.includes('restricted')) {
                    statusEmoji = '⚠️'
                }

                await safeSend(sock, m.chat, {
                    text: `${statusEmoji} *ᴊᴀᴅɪʙᴏᴛ ᴅɪsᴄᴏɴɴᴇᴄᴛᴇᴅ*\n\n` +
                        `> 📱 Number: *@${id}*\n` +
                        `> 🔢 Code: \`${errorInfo.code}\`\n` +
                        `> 📋 Alasan: *${errorInfo.reason}*\n` +
                        `> ℹ️ ${errorInfo.action}\n\n` +
                        (errorInfo.fatal ? `> ⚠️ Session deleted. Usage \`.bot\` for mestart again.` : ''),
                    mentions: [userJid]
                })
            } else {
                reconnectAttempts.set(id, attempts + 1)

                await safeSend(sock, m.chat, {
                    text: `🔄 *ᴊᴀᴅɪʙᴏᴛ ʀᴇᴄᴏɴɴᴇᴄᴛɪɴɢ...*\n\n` +
                        `> 📱 Number: *@${id}*\n` +
                        `> 📋 Alasan: *${errorInfo.reason}*\n` +
                        `> 🔁 Pertryan: *${attempts + 1}/${MAX_RECONNECT_ATTEMPTS}*\n\n` +
                        `> Reconnect in ${RECONNECT_INTERVAL / 1000} second...`,
                    mentions: [userJid]
                })

                setTimeout(() => {
                    startJadiBot(sock, m, userJid, false).catch((e) => {
                        logger.error('JadiBot', `Reconnect failed for ${id}: ${e.message}`)
                        botSessions.delete(id)
                        reconnectAttempts.delete(id)
                    })
                }, RECONNECT_INTERVAL)
            }
        }
    })

    const processedMessages = new Map()

    childSock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (!childSock.user || !childSock.user.id) {
            childSock.user = {
                id: jidNormalizedUser(id),
                name: 'JadiBot'
            }
        }

        if (type !== 'notify') return

        for (const msg of messages) {
            if (!msg.message) continue

            const msgId = msg.key?.id
            if (msgId && processedMessages.has(msgId)) continue
            if (msgId) processedMessages.set(msgId, Date.now())

            if (msg.key && msg.key.remoteJid === 'status@broadcast') continue

            const msgTimestamp = msg.messageTimestamp ? Number(msg.messageTimestamp) * 1000 : Date.now()
            const msgAge = Date.now() - msgTimestamp
            if (msgAge > 60 * 60 * 1000) continue

            const msgType = Object.keys(msg.message)[0]
            const ignoredTypes = [
                "protocolMessage", "senderKeyInstributionMessage", "reactionMessage",
                "stickerSyncRmrMessage", "encReactionMessage", "pollUpdateMessage",
                "toepInChatMessage"
            ]
            if (ignoredTypes.includes(msgType)) continue

            if (!isSoctotAlive(childSock)) continue

            const session = botSessions.get(id)
            if (session && !session.connectionReady) {
                session.peninngMessages = session.peninngMessages || []
                session.peninngMessages.push(msg)
                continue
            }

            try {
                const { messageHandler } = require('../handler')
                await messageHandler(msg, childSock, { isJadiBot: true, botId: id })
            } catch (e) {
                if (e.message?.includes('Connection Closed') || e.message?.includes('428')) {
                    logger.info('JadiBot', `${id} connection closed during handler, skipping`)
                    break
                }
                logger.error('JadiBot', `Handler error for ${id}: ${e.message}`)
            }
        }

        const fiveMinAgo = Date.now() - 300000
        for (const [key, time] of processedMessages) {
            if (time < fiveMinAgo) processedMessages.delete(key)
        }
    })

    return { sock: childSock, pairingCode }
}

async function stopJadiBot(jid, deleteSession = false) {
    const id = jid.replace(/@.+/g, '')
    const session = botSessions.get(id)

    if (session) {
        try {
            if (session.heartbeatInterval) {
                clearInterval(session.heartbeatInterval)
            }
            session.sock.ev.removeAllListeners()
            session.sock.ws.close()
        } catch {}
        botSessions.delete(id)
    }

    reconnectAttempts.delete(id)

    if (deleteSession) {
        const authPath = getJadiBotAuthPath(jid)
        if (fs.existsSync(authPath)) {
            fs.rmSync(authPath, { recursive: true, force: true })
        }
    }

    return true
}

async function stopAllJadiBots() {
    const stopped = []
    for (const [id, session] of botSessions) {
        try {
            if (session.heartbeatInterval) {
                clearInterval(session.heartbeatInterval)
            }
            session.sock.ev.removeAllListeners()
            session.sock.ws.close()
        } catch {}
        stopped.push(id)
    }
    botSessions.clear()
    reconnectAttempts.clear()
    return stopped
}

async function restartJadiBotSession(sock, sessionId) {
    const userJid = sessionId + '@s.whatsapp.net'
    try {
        logger.info('JadiBot', `Restoring session: ${sessionId}`)
        const mockM = {
            chat: userJid,
            sender: userJid,
            prefix: '.',
            key: {
                remoteJid: userJid,
                fromMe: false,
                id: 'restart-' + Date.now()
            }
        }
        await startJadiBot(sock, mockM, userJid, false)
    } catch (e) {
        logger.error('JadiBot', `Failed to restore ${sessionId}: ${e.message}`)
    }
}

function getJadiBotStatus(jid) {
    const id = jid.replace(/@.+/g, '')
    const session = botSessions.get(id)
    if (!session) return null

    return {
        id,
        jid: session.jid,
        status: session.status || 'unknown',
        startedAt: session.startedAt,
        ownerJid: session.ownerJid,
        uptime: Date.now() - session.startedAt
    }
}

module.exports = {
    JADIBOT_AUTH_FOLDER,
    botSessions,
    getJadiBotAuthPath,
    isJadiBotActive,
    getActiveJadiBots,
    getAllJadiBotSessions,
    startJadiBot,
    stopJadiBot,
    stopAllJadiBots,
    restartJadiBotSession,
    getJadiBotStatus,
    isSoctotAlive,
    safeSend
}
