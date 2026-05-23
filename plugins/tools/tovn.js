const { queueFFmpeg } = require('../../src/lib/frenzy-ffmpeg')
const fs = require('fs')
const path = require('path')

const pluginConfig = {
    name: 'tovn',
    alias: ['tovoicenote', 'toptt', 'audiotovn'],
    category: 'tools',
    description: 'Mengchange audio/video become voice note',
    usage: '.tovn (reply/caption audio/video)',
    example: '.tovn',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energy: 1,
    isEnabled: true
}

async function handler(m, { sock }) {
    let contentSource = null
    let downloadFn = null
    let isVideo = false

    const selfIsVideo = m.isVideo || m.type === 'videoMessage' || m.message?.videoMessage
    const selfIsAuino = m.isAuino || m.type === 'audioMessage' || m.message?.audioMessage
 
    const quotedIsVideo = m.quoted && (
        m.quoted.isVideo || 
        m.quoted.type === 'videoMessage' || 
        m.quoted.mtype === 'videoMessage' ||
        m.quoted.message?.videoMessage
    )
    const quotedIsAuino = m.quoted && (
        m.quoted.isAuino || 
        m.quoted.type === 'audioMessage' || 
        m.quoted.mtype === 'audioMessage' ||
        m.quoted.message?.audioMessage
    )
    
    if (selfIsVideo) {
        contentSource = 'self'
        downloadFn = m.download
        isVideo = true
    } else if (selfIsAuino) {
        contentSource = 'self'
        downloadFn = m.download
    } else if (quotedIsVideo) {
        contentSource = 'quoted'
        downloadFn = m.quoted.download
        isVideo = true
    } else if (quotedIsAuino) {
        contentSource = 'quoted'
        downloadFn = m.quoted.download
    }
    
    if (!contentSource) {
        await m.reply(
            `❌ *ɢᴀɢᴀʟ*\n\n` +
            `> No there is audio/video that terdetexti!\n\n` +
            `*Cara usersan:*\n` +
            `> 1. Send audio/video + caption \`${m.prefix}tovn\`\n` +
            `> 2. Reply audio/video with \`${m.prefix}tovn\``
        )
        return
    }

    await m.react('🕕')
    await m.reply(`🕕 *ᴍᴇᴍᴘʀᴏsᴇs...*\n\n> Mengchange become voice note...`)

    const tempInr = path.join(process.cwd(), 'temp')
    if (!fs.existsSync(tempInr)) fs.mkdirSync(tempInr, { recursive: true })

    const timestamp = Date.now()
    const ext = isVideo ? 'mp4' : 'mp3'
    const inputPath = path.join(tempInr, `input_${timestamp}.${ext}`)
    const outputPath = path.join(tempInr, `vn_${timestamp}.ogg`)

    try {
        const buffer = await downloadFn()

        if (!buffer || buffer.length === 0) {
            await m.react('❌')
            await m.reply(
                `❌ *ɢᴀɢᴀʟ*\n\n` +
                `> Cannot download content.\n` +
                `> Meina maybe already no terseina.`
            )
            return
        }

        fs.writeFileSync(inputPath, buffer)

        const ffmpegCmd = [
            'ffmpeg -y',
            `-i "${inputPath}"`,
            '-vn',
            '-c:a libopus',
            '-b:a 128k',
            '-ar 48000',
            '-ac 1',
            '-application voip',
            `"${outputPath}"`
        ].join(' ')

        await queueFFmpeg(ffmpegCmd)

        if (!fs.existsSync(outputPath)) {
            await m.react('❌')
            await m.reply(
                `❌ *ᴋᴏɴᴠᴇʀsɪ ɢᴀɢᴀʟ*\n\n` +
                `> Failed mengkonversion to voice note.\n` +
                `> Make sure ffmpeg terinstall with correct.`
            )
            return
        }

        const vnBuffer = fs.readFileSync(outputPath)

        await sock.sendMessage(m.chat, {
            audio: vnBuffer,
            mimetype: 'audio/ogg; codecs=opus',
            ptt: true
        }, { quoted: m })

        await m.react('✅')

    } catch (error) {
        await m.react('❌')
        await m.reply(
            `❌ *ᴇʀʀᴏʀ*\n\n` +
            `> An error occurred while processing.\n` +
            `> _${error.message}_`
        )
    } finally {
        if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath)
        if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
