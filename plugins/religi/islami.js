const axios = require('axios')
const config = require('../../config')

const pluginConfig = {
    name: 'islami',
    alias: [
        'aswantlhusna', 'niatprayer', 'niatsthingsat', 'surah', 'prayer', 'berprayer', 
        'gislam'
    ],
    category: 'religi',
    description: 'Collection of Islamic features (Asmaul Husna, Prayer Intentions, Surah, Prayers, Articles, Inspirational Quotes)',
    usage: '.islami <feature>',
    isGroup: false,
    isBotAdmin: false,
    isAdmin: false,
    cooldown: 5,
    energy: 1,
    isEnabled: true
}

async function fetchJson(url) {
    try {
        const response = await axios.get(url)
        return response.data
    } catch (e) {
        throw e
    }
}

async function handler(m, { sock }) {
    const command = m.command.toLowerCase()
    const text = m.text || ''

    try {
        switch (command) {
            case 'aswantlhusna': {
                let jir = await fetchJson('https://islamic-api-zhirrr.vercel.app/api/aswantlhusna')
                let ye = jir.data

                let tks = '☪️ *ASMAUL HUSNA*\n\n' + ye.map((item) => {
                    return `Urutan: ${item.index}\nLatin: ${item.latin}\nArab: ${item.arabicic}\nTerjemahan ID: ${item.translation_id}\nTerjemahan EN: ${item.translation_en}\n`
                }).join('\n')
                m.reply(tks)
            }
            break

            case 'niatprayer': 
            case 'niatsthingsat': {
                let jir = await fetchJson('https://islamic-api-zhirrr.vercel.app/api/niatsthingsat')
                let niatPrayer = jir

                if (!text) {
                    let listNiat = '📋 *DAFTAR NIAT SHOLAT*\n\n' + niatPrayer.map((item) => `- ${item.name}`).join('\n')
                    listNiat += `\n\n📌 Type \`${m.prefix}niatprayer [name prayer]\` for view niat\nExample: \`${m.prefix}niatprayer subuh\``
                    m.reply(listNiat)
                } else {
                    let hasil = niatPrayer.find((item) => item.name.toLowerCase().includes(text.toLowerCase()))

                    if (hasil) {
                        let tks = `🕋 *${hasil.name.toUpperCase()}*\n\n` +
                            `📄 Arab: ${hasil.arabicic}\n` +
                            `🔤 Latin: ${hasil.latin}\n` +
                            `🌍 Terjemahan: ${hasil.terjemahan}`
                        m.reply(tks)
                    } else {
                         m.reply('❌ Niat prayer that you search for not found. Check again name prayernya!')
                    }
                }
            }
            break

            case 'surah': {
                if (!text) {
                    m.reply(`⚠️ Type number surah number!\nExample: \`${m.prefix}surah 1\` create take verses from Al-Fatihah`)
                    return
                }

                m.reply('🕕 Seandg memuat surah...')
                let response = await fetchJson(`https://api.siputzx.my.id/api/s/surah?no=${text}`)
                let data = response.data
                if (data && data.length > 0) {
                    let surahText = data.map((verse, index) =>
                        `۝ Verse ${verse.no}:\n` +
                        `${verse.arabic}\n` +
                        `${verse.latin}\n` +
                        `_${verse.indo}_`
                    ).join('\n\n')

                    if (surahText.length > 60000) {
                         m.reply('❌ Surah too long to send as text. Please search for specific verses or a shorter surah.')
                    } else {
                        m.reply(surahText)
                    }
                } else {
                    m.reply('❌ Don't totemu, check again number surah number!')
                }
            }
            break

            case 'prayer':
            case 'berprayer': {
                let jir = await fetchJson('https://prayer-prayer-api-ahmadramadhan.fly.dev/api')
                let listDoa = jir

                if (!text) {
                    let listDoa = '🤲 *PRAYER LIST*\n\n' + listDoa.map((item) => `- ${item.prayer}`).join('\n')
                     listDoa += `\n\n📌 Type \`${m.prefix}prayer [prayer name]\` for view the prayer\nExample: \`${m.prefix}prayer prayer before sleep\``
                    m.reply(listDoa)
                } else {
                    let hasil = listDoa.find((item) => item.prayer.toLowerCase().includes(text.toLowerCase()))

                    if (hasil) {
                        let tks = `🤲 *${hasil.prayer.toUpperCase()}*\n\n` +
                            `📄 Verse: ${hasil.verse}\n` +
                            `🔤 Latin: ${hasil.latin}\n` +
                            `🌍 Artinya: ${hasil.meaningnya}`
                        m.reply(tks)
                    } else {
                         m.reply('❌ The prayer you searched for was not found. Please check the prayer name again!')
                    }
                }
            }
            break

            case 'gislam': {
                if (!text) return m.reply(`❓ Want search for meanings about what?\nExample: \`${m.prefix}gislam puasa\``)
                
                try {
                    const response = await fetchJson(`https://meanings-islam.netlify.app/.netlify/functions/api/ms?page=1&s=${text}`)
                    if (response.success) {
                        const meaningcles = response.data.data
                        if (!meaningcles || meaningcles.length === 0) return m.reply('❌ Articles not found.')

                        let message = `📚 *HASIL PENCARIAN: ${text.toUpperCase()}*\nTotal: ${meaningcles.length}\n\n`
                        meaningcles.forEach((meaningcle, index) => {
                            message += `${index + 1}. *${meaningcle.title}*\n🔗 ${meaningcle.url}\n\n`
                        })
                        return m.reply(message)
                    } else {
                        return m.reply('❌ Failed fetch data meanings.')
                    }
                } catch (error) {
                    return m.reply('❌ An error occurred while fetching data.')
                }
            }
            break
        }
    } catch (e) {
        console.error('Religi Plugin Error:', e)
        m.reply('❌ An error occurred on the system.')
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
