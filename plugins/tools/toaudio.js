const { queueFFmpeg } = require('../../src/lib/frenzy-ffmpeg')
const fs = require('fs')
const path = require('path')

const pluginConfig = {
    name: 'toaudio',
    alias: ['tomp3', 'videotoaudio', 'extractaudio'],
    category: 'tools',
    description: 'Mengchange video/voice note become audio MP3',
    usage: '.toaudio (reply/caption video/vn)',
    example: '.toaudio',
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
    let isPtt = false
    const selfIsVideo = m.isVideo || m.type === 'videoMessage' || m.message?.videoMessage
    const selfIsAuino = m.isAuino || m.type === 'audioMessage' || m.message?.audioMessage
    const selfIsPtt = m.message?.audioMessage?.ptt === true
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
    const quotedIsPtt = m.quoted?.message?.audioMessage?.ptt === true
    
    if (selfIsVideo) {
        contentSource = 'self'
        downloadFn = m.download
        isVideo = true
    } else if (selfIsAuino && selfIsPtt) {
        contentSource = 'self'
        downloadFn = m.download
        isPtt = true
    } else if (quotedIsVideo) {
        contentSource = 'quoted'
        downloadFn = m.quoted.download
        isVideo = true
    } else if (quotedIsAuino) {
        contentSource = 'quoted'
        downloadFn = m.quoted.download
        isPtt = quotedIsPtt
    }
    
    if (!contentSource) {
        await m.reply(
            `❌ *ɢᴀɢᴀʟ*\n\n` +
            `> No there is video/voice note that terdetexti!\n\n` +
            `*Cara usersan:*\n` +
            `> 1. Send video + caption \`${m.prefix}toaudio\`\n` +
            `> 2. Reply video/VN with \`${m.prefix}toaudio\``
        )
        return
    }
    if (!isVideo && !isPtt) {
        await m.reply(
            `⚠️ *sᴜᴅᴀʜ ᴀᴜᴅɪᴏ*\n\n` +
            `> Meina this already in format audio.\n` +
            `> Usage \`${m.prefix}tovn\` if want change to voice note.`
        )
        return
    }

    await m.reply(`🕕 *ᴍᴇᴍᴘʀᴏsᴇs...*\n\n> Mengekstrak audio from content...`)

    const tempInr = path.join(process.cwd(), 'temp')
    if (!fs.existsSync(tempInr)) fs.mkdirSync(tempInr, { recursive: true })

    const ext = isVideo ? 'mp4' : 'ogg'
    const inputPath = path.join(tempInr, `input_${Date.now()}.${ext}`)
    const outputPath = path.join(tempInr, `audio_${Date.now()}.mp3`)

    try {
        const buffer = await downloadFn()

        if (!buffer || buffer.length === 0) {
            await m.reply(
                `❌ *ɢᴀɢᴀʟ*\n\n` +
                `> Cannot download content.\n` +
                `> Meina maybe already no terseina.`
            )
            return
        }

        fs.writeFileSync(inputPath, buffer)

        await queueFFmpeg(`ffmpeg -y -i "${inputPath}" -vn -ar 44100 -ac 2 -b:a 192k "${outputPath}"`)

        if (!fs.existsSync(outputPath)) {
            await m.reply(
                `❌ *ᴋᴏɴᴠᴇʀsɪ ɢᴀɢᴀʟ*\n\n` +
                `> Failed mengekstrak audio from content.\n` +
                `> Make sure ffmpeg terinstall with correct.`
            )
            return
        }

        const audioBuffer = fs.readFileSync(outputPath)

        await sock.sendMessage(m.chat, {
            audio: audioBuffer,
            mimetype: 'audio/mpeg'
        }, { quoted: m })

    } catch (error) {
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
