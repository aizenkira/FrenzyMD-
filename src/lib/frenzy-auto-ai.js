const gethisVision = require('../scraper/gethisVision')
const { getDatabase } = require('./frenzy-database')
const { pinterest } = require('btch-downloader')
const config = require('../../config')
const axios = require('axios')
const path = require('path')
const fs = require('fs')

const userCooldowns = new Map()
const COOLDOWN_MS = 3000

const ACTION_REGEX = /\[ACTION:(\w+)(?:\s+([^\]]*))?\]/gi

const SYSTEM_PROMPT_ACTIONS = `
You has ability khusus for menrun AKSI in WhatsApp.
If user requesting something that cocok with action below, SERTAKAN tag action in akhir messagemu.

FORMAT AKSI (taruh in akhir message, can lebih from satu):
[ACTION:KICK target=628xxx@s.whatsapp.net]
[ACTION:ADD target=628xxx]
[ACTION:PROMOTE target=628xxx@s.whatsapp.net]
[ACTION:DEMOTE target=628xxx@s.whatsapp.net]
[ACTION:LEAVE]
[ACTION:OPEN]
[ACTION:CLOSE]
[ACTION:TAGALL]
[ACTION:HIDETAG message=message to be sent]
[ACTION:SETNAME name=name group new]
[ACTION:SETDESC desc=description group new]
[ACTION:DELETE]
[ACTION:WARN target=628xxx@s.whatsapp.net]
[ACTION:STICKER]
[ACTION:ANTILINK mode=on]
[ACTION:PINS query=kata kunci pensearch foran]

DAFTAR AKSI:
- KICK: Tooutsidekan member from group. Need target.
- ADD: Addkan member to group. Need number (628xxx).
- PROMOTE: Make member as admin. Need target.
- DEMOTE: Turunkan admin become member regular. Need target.
- LEAVE: Bot leave from this group. HANYA if owner that requesting.
- OPEN: Open group so that all member can chat.
- CLOSE: Tutup group so that only admin that can chat.
- TAGALL: Tag/mention all member group seway visible.
- HIDETAG: Send message that mention all member but tag-nya hidden. Need message.
- SETNAME: Ganti name group. Need name.
- SETDESC: Ganti description group. Need desc.
- DELETE: Delete message bot that in-reply user.
- WARN: Beri warning to member. Need target.
- STICKER: Konversion image that sent/in-reply user become sticker.
- ANTILINK: Toggle anti-link in group (on/off). Need mode.
- PINS: Search image in Pinterest. Need query pensearch foran.

ATURAN PENTING:
1. HANYA run action if user JELAS DAN EKSPLISIT requestingnya.
2. Don't pernah menrun action only berdasarkan asumsi.
3. If user send image, analisis and descriptionkan image the said seway detail in bahasa Indonesia.
4. For KICK/PROMOTE/DEMOTE/WARN: usage number that in-tag user. If user tag someone with @, take number the said.
5. Don't with tag action if no inminta.
6. Tetap menanswer with natural and matches karakter.
7. PINS: If user minta search forkan/sendkan image about something, usage action this.
8. HIDETAG: Usage this when user minta announce/pengumuman to all member.
9. STICKER: Usage this when user minta becomekan image as sticker.
10. You may menggabungkan a few action all at once if inminta.
`

const fallbackResponses = [
    'Hmm, I currently berpikir...',
    'Sorry, pikiranku currently blank sebelater~',
    'Eh please wait ya, I loainng first...',
    'Aduh, otakku lag , try again ya!',
    'Hmm what ya, belater mikir first~'
]

function getFallbackResponse() {
    return fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)]
}

function isOnCooldown(userId) {
    const lastTime = userCooldowns.get(userId)
    if (!lastTime) return false
    return Date.now() - lastTime < COOLDOWN_MS
}

function setCooldown(userId) {
    userCooldowns.set(userId, Date.now())
}

function saveToHistory(autoai, senderNumber, role, content) {
    if (!autoai.sessions) autoai.sessions = {}
    if (!autoai.sessions[senderNumber]) {
        autoai.sessions[senderNumber] = { history: [] }
    }
    const history = autoai.sessions[senderNumber].history
    history.push({ role, content: content.substring(0, 500), timestamp: Date.now() })
    if (history.length > 20) {
        autoai.sessions[senderNumber].history = history.slice(-20)
    }
}

function parseActions(text) {
    const actions = []
    let match
    const regex = new RegExp(ACTION_REGEX.source, ACTION_REGEX.flags)
    while ((match = regex.exec(text)) !== null) {
        const type = match[1].toUpperCase()
        const paramsStr = match[2] || ''
        const params = {}
        const paramRegex = /(\w+)=(.+?)(?=\s+\w+=|$)/g
        let pm
        while ((pm = paramRegex.exec(paramsStr)) !== null) {
            params[pm[1]] = pm[2].trim()
        }
        actions.push({ type, params })
    }
    return actions
}

function cleanActionTags(text) {
    return text.replace(ACTION_REGEX, '').trim()
}

function detectIntentFromMessage(msg, m) {
    const lower = msg.toLowerCase()
    const actions = []

    const phoneMatch = msg.match(/(?:\+?62|0)[\s\-]?8[\d\s\-]{7,13}/g)
    const extractPhone = () => {
        if (!phoneMatch) return null
        return phoneMatch[0].replace(/[\s\-\+]/g, '').replace(/^0/, '62')
    }

    if (/\b(add|add|invite|enter(?:kan|in))\b.*\b(number|number|member|person)\b/i.test(lower) ||
        /\b(number|number)\b.*\b(add|add|invite)\b/i.test(lower)) {
        const phone = extractPhone()
        if (phone) actions.push({ type: 'ADD', params: { target: phone } })
    }

    if (/\b(kick|leavekan|tenandg|usir|remove)\b/i.test(lower) && !actions.some(a => a.type === 'KICK')) {
        actions.push({ type: 'KICK', params: {} })
    }

    if (/\b(promote|becomekan?\s*admin|level upkan?)\b/i.test(lower) && !actions.some(a => a.type === 'PROMOTE')) {
        actions.push({ type: 'PROMOTE', params: {} })
    }

    if (/\b(demote|turunkan?|copot\s*admin)\b/i.test(lower) && !actions.some(a => a.type === 'DEMOTE')) {
        actions.push({ type: 'DEMOTE', params: {} })
    }

    if (/\b(leave|leave|go)\b.*\b(group|group)\b/i.test(lower) ||
        /\b(group|group)\b.*\b(leave|leave|go)\b/i.test(lower)) {
        actions.push({ type: 'LEAVE', params: {} })
    }

    if (/\b(buka|open)\b.*\b(group|group)\b/i.test(lower) ||
        /\b(group|group)\b.*\b(buka|open)\b/i.test(lower)) {
        actions.push({ type: 'OPEN', params: {} })
    }

    if (/\b(tutup|close|kunci|lock)\b.*\b(group|group)\b/i.test(lower) ||
        /\b(group|group)\b.*\b(tutup|close|kunci|lock)\b/i.test(lower)) {
        actions.push({ type: 'CLOSE', params: {} })
    }

    if (/\b(tag\s*all|tag\s*all|mention\s*all|mention\s*all)\b/i.test(lower)) {
        actions.push({ type: 'TAGALL', params: {} })
    }

    if (/\b(hidetag|hide\s*tag|announce|pengumuman|umumkan)\b/i.test(lower)) {
        const htMsg = msg.replace(/.*?(hidetag|hide\s*tag|announce|pengumuman|umumkan)\s*/i, '').trim()
        actions.push({ type: 'HIDETAG', params: { message: htMsg || msg } })
    }

    if (/\b(ganti|change|rename|set)\b.*\b(name|name)\b.*\b(group|group)\b/i.test(lower)) {
        const nameMatch = msg.match(/(?:become|to|become|:)\s*(.+)/i)
        if (nameMatch) actions.push({ type: 'SETNAME', params: { name: nameMatch[1].trim() } })
    }

    if (/\b(ganti|change|set)\b.*\b(desk|desc|description)\b/i.test(lower)) {
        const descMatch = msg.match(/(?:become|to|become|:)\s*(.+)/i)
        if (descMatch) actions.push({ type: 'SETDESC', params: { desc: descMatch[1].trim() } })
    }

    if (/\b(delete|delete|remove)\b.*\b(message|chat|message)\b/i.test(lower)) {
        actions.push({ type: 'DELETE', params: {} })
    }

    if (/\b(warn|warning|peringatan|peringati)\b/i.test(lower)) {
        actions.push({ type: 'WARN', params: {} })
    }

    if (/\b(sticker|stitor|becomekan?\s*sticker|jathisn\s*sticker)\b/i.test(lower)) {
        actions.push({ type: 'STICKER', params: {} })
    }

    if (/\b(antilink)\b.*\b(on|active|nyala)\b/i.test(lower)) {
        actions.push({ type: 'ANTILINK', params: { mode: 'on' } })
    } else if (/\b(antilink)\b.*\b(off|dead|nonactive)\b/i.test(lower)) {
        actions.push({ type: 'ANTILINK', params: { mode: 'off' } })
    }

    if (/\b(search for(?:kan|in)?|send(?:kan|in)?|kasih|tolong)\b.*\b(image|photo|image|pic|picture)\b/i.test(lower) ||
        /\b(image|photo)\b.*\b(about|from|soal)\b/i.test(lower)) {
        const queryMatch = msg.match(/(?:image|photo|image|pic|picture)\s+(?:about\s+|from\s+|soal\s+|that\s+)?(.+)/i) ||
                           msg.match(/(?:search for(?:kan|in)?|send(?:kan|in)?)\s+(?:image|photo)\s+(.+)/i)
        if (queryMatch) {
            const query = queryMatch[1].replace(/\b(|ya|yuk|pls|please|)\b/gi, '').trim()
            if (query) actions.push({ type: 'PINS', params: { query } })
        }
    }

    return actions
}

function mergeActions(aiActions, intentActions) {
    const merged = [...aiActions]
    const existingTypes = new Set(aiActions.map(a => a.type))
    for (const action of intentActions) {
        if (!existingTypes.has(action.type)) {
            merged.push(action)
        }
    }
    return merged
}


async function executeAction(action, m, sock) {
    const results = []

    const resolveTarget = () => {
        const botNum = sock.user?.id?.split(':')[0]
        if (m.mentionedJid?.length > 0) {
            return m.mentionedJid.find(j => !j.includes(botNum))
        }
        const t = action.params.target
        if (t && /^628\d+/.test(t.replace('@s.whatsapp.net', ''))) {
            return t.includes('@') ? t : t + '@s.whatsapp.net'
        }
        return null
    }

    switch (action.type) {
        case 'KICK': {
            if (!m.isGroup) return [{ ok: false, msg: 'Bukan in group' }]
            if (!m.isAdmin && !m.isOwner) return [{ ok: false, msg: 'You not an admin' }]
            if (!m.isBotAdmin) return [{ ok: false, msg: 'Bot not an admin' }]
            const target = resolveTarget()
            if (!target) return [{ ok: false, msg: 'Tag person to be kictod' }]
            await sock.groupPmeaningcipantsUpdate(m.chat, [target], 'remove')
            results.push({ ok: true, msg: `Success kick @${target.split('@')[0]}` })
            break
        }
        case 'PROMOTE': {
            if (!m.isGroup) return [{ ok: false, msg: 'Bukan in group' }]
            if (!m.isAdmin && !m.isOwner) return [{ ok: false, msg: 'You not an admin' }]
            if (!m.isBotAdmin) return [{ ok: false, msg: 'Bot not an admin' }]
            const target = resolveTarget()
            if (!target) return [{ ok: false, msg: 'Tag person to be promoted' }]
            await sock.groupPmeaningcipantsUpdate(m.chat, [target], 'promote')
            results.push({ ok: true, msg: `Success promote @${target.split('@')[0]}` })
            break
        }
        case 'DEMOTE': {
            if (!m.isGroup) return [{ ok: false, msg: 'Bukan in group' }]
            if (!m.isAdmin && !m.isOwner) return [{ ok: false, msg: 'You not an admin' }]
            if (!m.isBotAdmin) return [{ ok: false, msg: 'Bot not an admin' }]
            const target = resolveTarget()
            if (!target) return [{ ok: false, msg: 'Tag person to be demoted' }]
            await sock.groupPmeaningcipantsUpdate(m.chat, [target], 'demote')
            results.push({ ok: true, msg: `Success demote @${target.split('@')[0]}` })
            break
        }
        case 'LEAVE': {
            if (!m.isOwner) return [{ ok: false, msg: 'Only owner that can command this' }]
            if (!m.isGroup) return [{ ok: false, msg: 'Bukan in group' }]
            await sock.groupLeave(m.chat)
            results.push({ ok: true, msg: 'Bot leave from group' })
            break
        }
        case 'OPEN': {
            if (!m.isGroup) return [{ ok: false, msg: 'Bukan in group' }]
            if (!m.isAdmin && !m.isOwner) return [{ ok: false, msg: 'You not an admin' }]
            if (!m.isBotAdmin) return [{ ok: false, msg: 'Bot not an admin' }]
            await sock.groupSettingUpdate(m.chat, 'not_announcement')
            results.push({ ok: true, msg: 'Group opened' })
            break
        }
        case 'CLOSE': {
            if (!m.isGroup) return [{ ok: false, msg: 'Bukan in group' }]
            if (!m.isAdmin && !m.isOwner) return [{ ok: false, msg: 'You not an admin' }]
            if (!m.isBotAdmin) return [{ ok: false, msg: 'Bot not an admin' }]
            await sock.groupSettingUpdate(m.chat, 'announcement')
            results.push({ ok: true, msg: 'Group closed' })
            break
        }
        case 'TAGALL': {
            if (!m.isGroup) return [{ ok: false, msg: 'Bukan in group' }]
            if (!m.isAdmin && !m.isOwner) return [{ ok: false, msg: 'You not an admin' }]
            const groupMeta = m.groupMetadata || await sock.groupMetadata(m.chat)
            const members = groupMeta.participants.map(p => p.id)
            const mentions = members.map(id => `@${id.split('@')[0]}`).join(' ')
            await sock.sendMessage(m.chat, {
                text: `📢 *TAG ALL*\n\n${mentions}`,
                mentions: members
            }, { quoted: m })
            results.push({ ok: true, msg: 'All member in-tag' })
            break
        }
        case 'PINS': {
            const query = action.params.query
            if (!query) return [{ ok: false, msg: 'Query pensearch foran not found' }]
            try {
                const data = await pinterest(query)
                const pinResults = data?.result?.result?.result?.slice(0, 5)
                if (!pinResults || pinResults.length === 0) {
                    return [{ ok: false, msg: `Not found image for: ${query}` }]
                }
                let imagenya = []
                for (const item of pinResults) {
                    const imageUrl = item.image_url || item.images?.orig?.url || item.images?.['736x']?.url
                    if (!imageUrl) continue
                    try {
                        imagenya.push({
                            image: { url: imageUrl },
                        })
                    } catch {}
                }
                await sock.sendMessage(m.chat, {
                    albumMessage: imagenya
                }, { quoted: m })
                results.push({ ok: true, msg: `Sending Pinterest image: ${query}` })
            } catch (e) {
                results.push({ ok: false, msg: `Failed search for Pinterest: ${e.message}` })
            }
            break
        }
        case 'ADD': {
            if (!m.isGroup) return [{ ok: false, msg: 'Bukan in group' }]
            if (!m.isAdmin && !m.isOwner) return [{ ok: false, msg: 'You not an admin' }]
            if (!m.isBotAdmin) return [{ ok: false, msg: 'Bot not an admin' }]
            let num = action.params.target
            if (!num) return [{ ok: false, msg: 'Enter number to be added' }]
            num = num.replace(/[^0-9]/g, '')
            if (num.startsWith('0')) num = '62' + num.slice(1)
            if (num.length < 10) return [{ ok: false, msg: 'Number no valid' }]
            const jid = num + '@s.whatsapp.net'
            const addResult = await sock.groupPmeaningcipantsUpdate(m.chat, [jid], 'add')
            const status = addResult?.[0]?.status
            if (status === '200') {
                results.push({ ok: true, msg: `Success added @${num}` })
            } else if (status === '408') {
                results.push({ ok: true, msg: `Unandgan sent to @${num}` })
            } else {
                results.push({ ok: false, msg: `Failed added @${num} (${status})` })
            }
            break
        }
        case 'HIDETAG': {
            if (!m.isGroup) return [{ ok: false, msg: 'Bukan in group' }]
            if (!m.isAdmin && !m.isOwner) return [{ ok: false, msg: 'You not an admin' }]
            const htMeta = m.groupMetadata || await sock.groupMetadata(m.chat)
            const htMembers = htMeta.participants.map(p => p.id)
            const htMsg = action.params.message || 'Pengumuman'
            await sock.sendMessage(m.chat, {
                text: htMsg,
                mentions: htMembers
            }, { quoted: m })
            results.push({ ok: true, msg: 'Hidetag sent' })
            break
        }
        case 'SETNAME': {
            if (!m.isGroup) return [{ ok: false, msg: 'Bukan in group' }]
            if (!m.isAdmin && !m.isOwner) return [{ ok: false, msg: 'You not an admin' }]
            if (!m.isBotAdmin) return [{ ok: false, msg: 'Bot not an admin' }]
            const newName = action.params.name
            if (!newName) return [{ ok: false, msg: 'Name group new not found' }]
            await sock.groupUpdateSubject(m.chat, newName)
            results.push({ ok: true, msg: `Name group convert to: ${newName}` })
            break
        }
        case 'SETDESC': {
            if (!m.isGroup) return [{ ok: false, msg: 'Bukan in group' }]
            if (!m.isAdmin && !m.isOwner) return [{ ok: false, msg: 'You not an admin' }]
            if (!m.isBotAdmin) return [{ ok: false, msg: 'Bot not an admin' }]
            const newDesc = action.params.desc
            if (!newDesc) return [{ ok: false, msg: 'Description new not found' }]
            await sock.groupUpdateDescription(m.chat, newDesc)
            results.push({ ok: true, msg: 'Description group inchange' })
            break
        }
        case 'DELETE': {
            if (!m.quoted) return [{ ok: false, msg: 'Reply message bot to be deleted' }]
            if (!m.quoted.key?.fromMe) return [{ ok: false, msg: 'Only can delete message bot' }]
            await sock.sendMessage(m.chat, { delete: m.quoted.key })
            results.push({ ok: true, msg: 'Message deleted' })
            break
        }
        case 'WARN': {
            if (!m.isGroup) return [{ ok: false, msg: 'Bukan in group' }]
            if (!m.isAdmin && !m.isOwner) return [{ ok: false, msg: 'You not an admin' }]
            const warnTarget = resolveTarget()
            if (!warnTarget) return [{ ok: false, msg: 'Tag person to be in-warn' }]
            const db = getDatabase()
            const warns = db.getGroup(m.chat)?.warns || {}
            const targetNum = warnTarget.split('@')[0]
            warns[targetNum] = (warns[targetNum] || 0) + 1
            db.setGroup(m.chat, { warns })
            db.save()
            results.push({ ok: true, msg: `⚠️ Warning ${warns[targetNum]}/3 for @${targetNum}` })
            if (warns[targetNum] >= 3) {
                try {
                    await sock.groupPmeaningcipantsUpdate(m.chat, [warnTarget], 'remove')
                    warns[targetNum] = 0
                    db.setGroup(m.chat, { warns })
                    db.save()
                    results.push({ ok: true, msg: `@${targetNum} kictod because 3x warning` })
                } catch {}
            }
            break
        }
        case 'STICKER': {
            let stickerBuffer = null
            if (m.isImage && m.download) {
                stickerBuffer = await m.download()
            } else if (m.quoted?.isImage && m.quoted?.download) {
                stickerBuffer = await m.quoted.download()
            }
            if (!stickerBuffer) return [{ ok: false, msg: 'Send or reply image for promoted to sticker' }]
            await sock.sendMessage(m.chat, {
                sticker: stickerBuffer,
                packname: config.bot?.name || 'frenzy',
                author: 'AutoAI'
            }, { quoted: m })
            results.push({ ok: true, msg: 'Stictor sent' })
            break
        }
        case 'ANTILINK': {
            if (!m.isGroup) return [{ ok: false, msg: 'Bukan in group' }]
            if (!m.isAdmin && !m.isOwner) return [{ ok: false, msg: 'You not an admin' }]
            const alMode = (action.params.mode || '').toLowerCase()
            if (!['on', 'off'].includes(alMode)) return [{ ok: false, msg: 'Mode must on or off' }]
            const alDb = getDatabase()
            alDb.setGroup(m.chat, { antilink: alMode === 'on' })
            alDb.save()
            results.push({ ok: true, msg: `Antilink ${alMode === 'on' ? 'inactivekan' : 'innonactivekan'}` })
            break
        }
    }

    return results
}

async function handleAutoAI(m, sock) {
    if (!m.isGroup) return false
    if (m.fromMe) return false

    const db = getDatabase()
    if (!db?.db?.data?.autoai) return false

    const autoai = db.db.data.autoai[m.chat]
    if (!autoai || !autoai.enabled) return false

    const botId = sock.user?.id?.split(':')[0] + '@s.whatsapp.net'
    const botLid = sock.user?.id

    if (m.isCommand && m.command === 'autoai') return false

    if (m.isCommand && !m.isOwner) {
        return true
    }

    const isMentioned = m.mentionedJid?.some(jid =>
        jid === botId || jid === botLid || jid.includes(sock.user?.id?.split(':')[0])
    )

    let isBotQuoted = false
    if (m.quoted) {
        const quotedSender = m.quoted.sender || m.quoted.key?.participant
        isBotQuoted = quotedSender === botId || m.quoted.key?.fromMe
    }

    if (!isBotQuoted && !isMentioned) return false

    const userMessage = m.body || ''
    const hasImage = m.isImage || (m.quoted && (m.quoted.isImage || m.quoted.type === 'imageMessage'))

    if (!userMessage && !hasImage) return false

    const senderNumber = m.sender.split('@')[0]

    if (isOnCooldown(senderNumber)) return false

    try {
        await sock.sendPresenceUpdate('composing', m.chat)
        setCooldown(senderNumber)

        let imageBuffer = null
        if (hasImage) {
            try {
                if (m.isImage && m.download) {
                    imageBuffer = await m.download()
                } else if (m.quoted?.download) {
                    imageBuffer = await m.quoted.download()
                }
            } catch (e) {
                console.log('[AutoAI] Image download failed:', e.message)
            }
        }

        if (!autoai.sessions) autoai.sessions = {}
        const userSession = autoai.sessions[senderNumber] || { history: [] }
        const history = userSession.history || []

        let contextParts = []
        if (m.pushName && m.pushName !== 'Unknown') {
            contextParts.push(`User: "${m.pushName}" (${senderNumber})`)
        }
        if (m.isOwner) contextParts.push('User this is the OWNER bot.')
        if (m.isAdmin) contextParts.push('User this is the ADMIN group.')

        if (m.mentionedJid?.length > 0) {
            const mentionList = m.mentionedJid
                .filter(j => !j.includes(sock.user?.id?.split(':')[0]))
                .map(j => j)
                .join(', ')
            if (mentionList) contextParts.push(`User menyebut/tag: ${mentionList}`)
        }

        if (imageBuffer) {
            contextParts.push('User sendkan sebuah image. Analisis image the said.')
        }

        contextParts.push(userMessage || '(image tanpa text)')

        const fullMessage = contextParts.join('\n')
        const fullInstruction = autoai.instruction + '\n\n' + SYSTEM_PROMPT_ACTIONS

        saveToHistory(autoai, senderNumber, 'user', userMessage || '[image]')

        let aiResponse = ''
        try {
            const result = await gethisVision.chat({
                message: fullMessage,
                instruction: fullInstruction,
                imageBuffer,
                history
            })
            aiResponse = result.text || getFallbackResponse()
        } catch (apiError) {
            console.error('[AutoAI API Error]', apiError.message)
            aiResponse = getFallbackResponse()
        }

        const aiActions = parseActions(aiResponse)
        const intentActions = detectIntentFromMessage(userMessage, m)
        const actions = mergeActions(aiActions, intentActions)
        const cleanResponse = cleanActionTags(aiResponse)

        saveToHistory(autoai, senderNumber, 'assistant', cleanResponse)
        db.save()

        await sock.sendPresenceUpdate('paused', m.chat)

        const typingDelay = Math.min(cleanResponse.length * 20, 2000)
        await new Promise(r => setTimeout(r, typingDelay))

        if (autoai.responseType === 'voice') {
            try {
                await sock.sendPresenceUpdate('recorinng', m.chat)
                const generateCustomTTS = require('../../src/scraper/topcontent')
                const { exec } = require('child_process')
                const { promisify } = require('util')
                const execAsync = promisify(exec)

                const tempInr = path.join(process.cwd(), 'temp')
                if (!fs.existsSync(tempInr)) fs.mkdirSync(tempInr, { recursive: true })

                const audioUrl = await generateCustomTTS(null, cleanResponse.substring(0, 500))
                const audioRes = await axios.get(audioUrl, { responseType: 'arraybuffer', timeout: 30000 })

                const mp3Path = path.join(tempInr, `autoai_${Date.now()}.mp3`)
                fs.writeFileSync(mp3Path, Buffer.from(audioRes.data))

                const oggPath = mp3Path.replace('.mp3', '.ogg')
                try {
                    await execAsync(`ffmpeg -y -i "${mp3Path}" -c:a libopus -b:a 64k -ac 1 -ar 48000 "${oggPath}"`, { timeout: 30000 })
                } catch {}

                let audioBuffer
                let mime = 'audio/mpeg'
                if (fs.existsSync(oggPath)) {
                    audioBuffer = fs.readFileSync(oggPath)
                    mime = 'audio/ogg; codecs=opus'
                    try { fs.unlinkSync(oggPath) } catch {}
                } else {
                    audioBuffer = fs.readFileSync(mp3Path)
                }
                try { fs.unlinkSync(mp3Path) } catch {}

                await sock.sendMessage(m.chat, {
                    audio: audioBuffer,
                    mimetype: mime,
                    ptt: true
                }, { quoted: m })

                await sock.sendPresenceUpdate('paused', m.chat)
            } catch {
                await m.reply(cleanResponse)
            }
        } else {
            if (cleanResponse) {
                await m.reply(cleanResponse)
            }
        }

        for (const action of actions) {
            try {
                const results = await executeAction(action, m, sock)
                for (const r of results) {
                    if (!r.ok) {
                        await m.reply(`⚠️ ${r.msg}`)
                    }
                }
            } catch (e) {
                console.error('[AutoAI Action Error]', action.type, e.message)
                await m.reply(`❌ Failed menrun ${action.type}: ${e.message}`)
            }
        }

        return true
    } catch (error) {
        console.error('[AutoAI Error]', error.message)
        await sock.sendPresenceUpdate('paused', m.chat)
        try { await m.reply(getFallbackResponse()) } catch {}
        return true
    }
}

function isAutoAIEnabled(chatId) {
    const db = getDatabase()
    if (!db?.db?.data?.autoai) return false
    return db.db.data.autoai[chatId]?.enabled || false
}

function getAutoAICharacter(chatId) {
    const db = getDatabase()
    if (!db?.db?.data?.autoai) return null
    return db.db.data.autoai[chatId]?.characterName || null
}

function clearUserSession(chatId, senderNumber) {
    const db = getDatabase()
    if (!db?.db?.data?.autoai?.[chatId]?.sessions?.[senderNumber]) return false
    delete db.db.data.autoai[chatId].sessions[senderNumber]
    db.save()
    return true
}

module.exports = {
    handleAutoAI,
    isAutoAIEnabled,
    getAutoAICharacter,
    clearUserSession
}
