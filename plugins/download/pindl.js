const { pinterestdl } = require('../../src/lib/frenzy-pinterest')
const path = require('path')
const { queueFFmpeg } = require('./../../src/lib/frenzy-ffmpeg')
const { f } = require('../../src/lib/frenzy-http')
const te = require('../../src/lib/frenzy-error')
const pluginConfig = {
    name: 'pindl',
    alias: ['pinterestdl', 'pindownload', 'pintdl'],
    category: 'download',
    description: 'Download image/video from Pinterest',
    usage: '.pindl <url>',
    example: '.pindl https://pin.it/xxx',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energy: 1,
    isEnabled: true
}

async function handler(m, { sock }) {
    const url = m.text?.trim()

    if (!url) {
        return m.reply(
            `📌 *ᴘɪɴᴛᴇʀᴇsᴛ ᴅᴏᴡɴʟᴏᴀᴅ*\n\n` +
            `> Download image/video from Pinterest\n\n` +
            `*ᴄᴏɴᴛᴏʜ:*\n` +
            `> \`${m.prefix}pindl https://pin.it/xxx\`\n` +
            `> \`${m.prefix}pindl https://pinterest.com/pin/xxx\``
        )
    }

    if (!url.match(/pinterest|pin\.it/i)) {
        return m.reply('❌ URL no valid. Usage link Pinterest.')
    }

    m.react('🕕')

    try {
        const result = await pinterestdl(url)

        if (!result || !result.content || result.content.length === 0) {
            throw new Error('No there is content intemukan')
        }

        for (const content of result.content) {
            if (content.type === 'video') {
                await sock.sendMedia(m.chat, content.url, null, m, {
                    type: 'video',
                    contextInfo: {
                        forwardingScore: 99,
                        isForwarded: true
                    }
                })
            } else if (content.type === 'image') {
                if(content.url.includes('gif')) {
                    const fs = require('fs')
                    const tempPath = path.join(process.cwd(), 'temp')
                    if (!fs.existsSync(tempPath)) fs.mkdirSync(tempPath, { recursive: true })
                    const id = Date.now()
                    const gifPath = path.join(tempPath, `pin-${id}.gif`)
                    const mp4Path = path.join(tempPath, `pin-${id}.mp4`)
                    try {
                    const raw = await f(content.url, 'buffer')
                    if (!raw) throw new Error('Failed download GIF')
                    fs.writeFileSync(gifPath, raw)

                    await queueFFmpeg(
                        `ffmpeg -y -ignore_loop 0 -i "${gifPath}" -t 30 -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" -c:v libx264 -pix_fmt yuv420p -movflags faststart -preset ultrafast -an "${mp4Path}"`
                    )

                    if (!fs.existsSync(mp4Path)) throw new Error('Failed convert GIF')

                    await sock.sendMedia(
                        m.chat,
                        fs.readFileSync(mp4Path),
                        null,
                        m,
                        {
                        type: 'video',
                        gifPlayback: true,
                        contextInfo: {
                            forwardingScore: 99,
                            isForwarded: true
                        }
                        }
                    )
                    } catch (gifErr) {
                    console.error('[PinDL] GIF convert error:', gifErr.message)
                    await sock.sendMedia(m.chat, content.url, null, m, {
                        type: 'image',
                        contextInfo: { forwardingScore: 99, isForwarded: true }
                    })
                    } finally {
                    const fs = require('fs')
                    if (fs.existsSync(gifPath)) fs.unlinkSync(gifPath)
                    if (fs.existsSync(mp4Path)) fs.unlinkSync(mp4Path)
                    }
                } else {
                    await sock.sendMedia(m.chat, content.url, null, m, {
                        type: 'image',
                        contextInfo: {
                            forwardingScore: 99,
                            isForwarded: true
                        }
                    })
                }
            }
        }

        m.react('✅')

    } catch (error) {
        console.error('[PinDL] Error:', error)
        m.react('☢')
        m.reply(te(m.prefix, m.command, m.pushName))
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
