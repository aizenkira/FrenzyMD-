const config = require("../../config")
const { f } = require("../../src/lib/frenzy-http")
const te = require('../../src/lib/frenzy-error')

const pluginConfig = {
    name: 'sfiledl',
    alias: ['sfile', 'sfiledownload'],
    category: 'download',
    description: 'Download file from Sfile.mobi',
    usage: '.sfiledl <url>',
    example: '.sfiledl https://sfile.mobi/xxx',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 15,
    energy: 1,
    isEnabled: true
}

async function handler(m, { sock }) {
    const url = m.text?.trim()

    if (!url) {
        return m.reply(
            `⚠️ *ᴄᴀʀᴀ ᴘᴀᴋᴀɪ*\n\n` +
            `> \`${m.prefix}sfiledl <url_sfile>\`\n\n` +
            `> Example: \`${m.prefix}sfiledl https://sfile.mobi/xxxxx\``
        )
    }

    if (!url.includes('sfile.mobi') && !url.includes('sfile.co')) {
        return m.reply(`❌ URL must from sfile.mobi or sfile.co!`)
    }

    m.react('🕕')

    try {
        const { data } = await f(`https://api.neoxr.eu/api/sfile?url=${encodeURIComponent(url)}&apikey=${config.APItoy.neoxr}`)

        if (!data.url) {
            m.react('❌')
            return m.reply(`❌ Failed earn link download. File maybe no terseina.`)
        }

        await sock.sendMedia(m.chat, data.url, null, m, {
            type: 'document',
            fileName: data.filename,
            mimetype: data.mime,
            contextInfo: {
                forwardingScore: 99,
                isForwarded: true
            }
        })

        m.react('✅')

    } catch (error) {
        m.react('☢')
        m.reply(te(m.prefix, m.command, m.pushName))
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
