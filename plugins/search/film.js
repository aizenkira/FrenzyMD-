const axios = require('axios')
const config = require('../../config')
const path = require('path')
const fs = require('fs')
const te = require('../../src/lib/frenzy-error')

const NEOXR_APIKEY = config.APIkey?.neoxr || 'Milik-Bot-OurinMD'

const pluginConfig = {
    name: 'film',
    alias: ['movie', 'nonton', 'lk21'],
    category: 'search',
    description: 'Cari film and nonton online',
    usage: '.film <judul>',
    example: '.film civil war',
    cooldown: 10,
    energy: 1,
    isEnabled: true
}

const filmSessions = new Map()

let thumbFilm = null
try {
    const p = path.join(process.cwd(), 'assets/images/frenzy-film.jpg')
    if (fs.existsSync(p)) thumbFilm = fs.readFileSync(p)
} catch {}

function getContextInfo(title, body, thumbnail) {
    const saluranId = config.saluran?.id || '120363406397452589@newsletter'
    const saluranName = config.saluran?.name || config.bot?.name || 'Frenzy-AI'

    const ctx = {
        forwardingScore: 9999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
            newsletterJid: saluranId,
            newsletterName: saluranName,
            serverMessageId: 127
        }
    }

    const thumb = thumbnail || thumbFilm
    if (thumb) {
        ctx.externalAdReply = {
            title,
            body,
            thumbnail: thumb,
            contentType: 1,
            renderLargerThumbnail: true,
            sourceUrl: config.saluran?.link || ''
        }
    }

    return ctx
}

async function handler(m, { sock }) {
    const args = m.args || []
    const query = args.join(' ').trim()
    
    if (!query) {
        return m.reply(
            `🎬 *ꜰɪʟᴍ sᴇᴀʀᴄʜ*\n\n` +
            `> Cari and nonton film online\n\n` +
            `*Format:*\n` +
            `> \`${m.prefix}film <judul>\`\n\n` +
            `*Example:*\n` +
            `> \`${m.prefix}film civil war\``
        )
    }
    
    m.react('🎬')
    
    try {
        const apiUrl = `https://api.neoxr.eu/api/film?q=${encodeURIComponent(query)}&apikey=${NEOXR_APIKEY}`
        const { data } = await axios.get(apiUrl, { timeout: 30000 })
        
        if (!data?.status || !data?.data?.length) {
            m.react('❌')
            return m.reply(`❌ *ᴛɪᴅᴀᴋ ᴅɪᴛᴇᴍᴜᴋᴀɴ*\n\n> Film "${query}" not found`)
        }
        
        const films = data.data.slice(0, 10)
        
        filmSessions.set(m.sender, {
            films,
            timestamp: Date.now()
        })
        
        setTimeout(() => {
            filmSessions.delete(m.sender)
        }, 300000)
        
        let text = `🎬 *ʜᴀsɪʟ ᴘᴇɴᴄᴀʀɪᴀɴ*\n\n`
        text += `> Intemukan *${films.length}* film for "${query}"\n\n`
        
        films.forEach((f, i) => {
            text += `*${i + 1}. ${f.title}*\n`
            text += `> ⭐ ${f.rating} | 📺 ${f.quality} | 📅 ${f.release}\n\n`
        })
        
        text += `> _Choose film from list below_`
        
        const listItems = films.map((f, i) => ({
            header: '',
            title: f.title,
            description: `⭐ ${f.rating} | ${f.quality} | ${f.release}`,
            id: `${m.prefix}filmget ${f.url}`
        }))
        
        await sock.sendButton(m.chat, require('fs').readFileSync('./assets/images/frenzy.jpg'), text, m, {
            buttons: [{
                name: 'single_select',
                buttonParamsJson: JSON.stringify({
                    title: '🎬 Choose Film',
                    sections: [
                        {
                            title: 'Hasil Pensearch foran',
                            rows: listItems
                        }
                    ]
                })
            }],
            footer: '🎬 Film Search'
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
