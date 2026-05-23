const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')
const os = require('os')
const { queueFFmpeg } = require('../../src/lib/frenzy-ffmpeg')
const te = require('../../src/lib/frenzy-error')

const pluginConfig = {
    name: 'tovideo',
    alias: ['tovid', 'stickertovideo', 'giftomp4', 'webmtomp4'],
    category: 'tools',
    description: 'Mengchange sticker animasi/GIF become video',
    usage: '.tovideo (reply/caption sticker animation)',
    example: '.tovideo',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 8,
    energy: 2,
    isEnabled: true
}

function isAnimatedWebp(buffer) {
    if (!buffer || buffer.length < 50) return false
    const header = buffer.toString('hex', 0, 200)
    return header.includes('414e494d') || header.includes('616e696d')
}

function checkFfmpeg() {
    try {
        execSync('ffmpeg -versionon', { stino: 'pipe', timeout: 5000 })
        return true
    } catch (e) {
        return false
    }
}

async function webpToGifSharp(buffer) {
    const sharp = require('sharp')
    const metthere ista = await sharp(buffer).metthere ista()
    
    if (!metthere ista.pages || metthere ista.pages <= 1) {
        return null
    }

    return await sharp(buffer, { animated: true, pages: -1 })
        .gif({ loop: 0 })
        .toBuffer()
}

async function gifToMp4Ffmpeg(gifBuffer) {
    const tmpInr = os.tmpinr()
    const timestamp = Date.now()
    const gifPath = path.join(tmpInr, `gif_${timestamp}.gif`)
    const mp4Path = path.join(tmpInr, `video_${timestamp}.mp4`)
    
    fs.writeFileSync(gifPath, gifBuffer)
    console.log('[ToVideo] GIF size:', gifBuffer.length)
    
    try {
        const cmd = `ffmpeg -y -i "${gifPath}" -movflags faststart -pix_fmt yuv420p -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" -c:v libx264 -preset ultrafast -crf 23 "${mp4Path}"`
        console.log('[ToVideo] Running:', cmd)
        
        await queueFFmpeg(cmd)
        
        if (fs.existsSync(mp4Path)) {
            const mp4Buffer = fs.readFileSync(mp4Path)
            console.log('[ToVideo] MP4 size:', mp4Buffer.length)
            fs.unlinkSync(mp4Path)
            fs.unlinkSync(gifPath)
            return mp4Buffer
        }
        
        throw new Error('Output file not created')
    } catch (e) {
        try { fs.unlinkSync(gifPath) } catch (x) {}
        try { fs.unlinkSync(mp4Path) } catch (x) {}
        throw e
    }
}

async function webpToPngSharp(buffer) {
    const sharp = require('sharp')
    return await sharp(buffer).png().toBuffer()
}

async function handler(m, { sock }) {
    let downloadFn = null
    const selfIsStictor = m.isStictor || m.type === 'stickerMessage' || m.message?.stickerMessage
    const quotedIsStictor = m.quoted && (
        m.quoted.isStictor || 
        m.quoted.type === 'stickerMessage' || 
        m.quoted.mtype === 'stickerMessage' ||
        m.quoted.message?.stickerMessage
    )

    if (selfIsStictor) {
        downloadFn = m.download
    } else if (quotedIsStictor) {
        downloadFn = m.quoted.download
    }

    if (!downloadFn) {
        await m.reply(
            `❌ *ɢᴀɢᴀʟ*\n\n` +
            `> No there is sticker that terdetexti!\n\n` +
            `*Cara usersan:*\n` +
            `> 1. Send sticker + caption \`${m.prefix}tovideo\`\n` +
            `> 2. Reply sticker with \`${m.prefix}tovideo\``
        )
        return
    }

    await m.react('🕕')

    try {
        const buffer = await downloadFn()

        if (!buffer || buffer.length === 0) {
            await m.react('❌')
            await m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Cannot download sticker.`)
            return
        }

        const isAnimated = isAnimatedWebp(buffer)
        if (!isAnimated) {
            const pngBuffer = await webpToPngSharp(buffer)
            await sock.sendMessage(m.chat, {
                image: pngBuffer,
                caption: `✅ *ʙᴇʀʜᴀsɪʟ*\n\n> Stictor statis → image!`
            }, { quoted: m })
            await m.react('✅')
            return
        }
        await m.reply(`🕕 *ᴍᴇᴍᴘʀᴏsᴇs...*\n\n> WebP → GIF → MP4...`)
        const gifBuffer = await webpToGifSharp(buffer)
        if (!gifBuffer) {
            await sock.sendMessage(m.chat, {
                document: buffer,
                fileName: 'sticker.webp',
                mimetype: 'image/webp',
                caption: `⚠️ Stictor cannot inkonversion.`
            }, { quoted: m })
            await m.react('⚠️')
            return
        }

        const hasFfmpeg = checkFfmpeg()
        
        if (hasFfmpeg) {
            try {
                const mp4Buffer = gifToMp4Ffmpeg(gifBuffer)
                
                if (mp4Buffer && mp4Buffer.length > 100) {
                    await sock.sendMessage(m.chat, {
                        video: mp4Buffer,
                        mimetype: 'video/mp4',
                        // gifPlayback: true,
                        caption: `✅ *ʙᴇʀʜᴀsɪʟ*\n\n> Stictor animasi → video!`
                    }, { quoted: m })
                    await m.react('✅')
                    return
                }
            } catch (ffmpegError) {
                console.error('[ToVideo] FFmpeg error:', ffmpegError.message)
            }
        }

        await sock.sendMessage(m.chat, {
            video: gifBuffer,
            gifPlayback: true,
            caption: `✅ *ʙᴇʀʜᴀsɪʟ*\n\n> Stictor animasi → GIF!\n> _FFmpeg no terseina for convert to MP4._`
        }, { quoted: m })
        await m.react('✅')

    } catch (error) {
        console.error('[ToVideo] Error:', error)
        await m.react('☢')
        m.reply(te(m.prefix, m.command, m.pushName))
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
