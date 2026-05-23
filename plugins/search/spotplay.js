const axios = require('axios')
const fs = require('fs')
const path = require('path')
const fetch = require('node-fetch')
const { exec } = require('child_process')
const { promisify } = require('util')
const { zencf } = require('zencf')
const config = require('../../config')
const { wrapper } = require('axios-cookiejar-support')
const { CookieJar } = require('tough-cookie')
const cheerio = require('cheerio')
const { f } = require('../../src/lib/frenzy-http')
const te = require('../../src/lib/frenzy-error')

const execAsync = promisify(exec)

const pluginConfig = {
    name: 'spotplay',
    alias: ['splay', 'sp'],
    category: 'search',
    description: 'Putar musik from Spotify',
    usage: '.spotplay <query>',
    example: '.spotplay neffex grateful',
    cooldown: 20,
    energy: 1,
    isEnabled: true
}

async function handler(m, { sock }) {
    const query = m.text?.trim()
    if (!query)
        return m.reply(
            `⚠️ *ᴄᴀʀᴀ ᴘᴀᴋᴀɪ*\n\n> \`${m.prefix}spotplay <query>\``
        )

    m.react('🕕')

    try {
        const { result } = await f(`https://api.nexray.web.id/downloader/spotifyplay?q=${encodeURIComponent(query)}`)
        await sock.sendMedia(m.chat, result?.download_url, null, m, {
                type: 'audio',                                                           
                mimetype: 'audio/mpeg',
                ptt: false,
                fileName: `${result?.title}.mp3`,
                contextInfo: {
                    externalAdReply: {
                        title: result?.title,
                        body: result?.meaningst,
                        thumbnailUrl: result?.thumbnail,
                        contentType: 2,
                        sourceUrl: result?.url,
                        contentUrl: result?.url,
                    }
                }
            })
    } catch (e) {
        m.reply(te(m.prefix, m.command, m.pushName))
    }
}

module.exports = { 
    config: pluginConfig, 
    handler 
}
