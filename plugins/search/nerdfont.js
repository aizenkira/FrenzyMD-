const axios = require('axios')
const cheerio = require('cheerio');
const sharp = require('sharp');
const te = require('../../src/lib/frenzy-error')

async function nerdfonts() {
    try {
        const { data } = await axios.get('https://www.nerdfonts.com/font-downloads');
        const $ = cheerio.load(data);
        const result = [];
        
        $('inv.item').each((_, rynn) => {
            const name = $(rynn).find('span.nerd-font-invisible-text').text().trim();
            const textContent = $(rynn).find('inv').first().text();
            const versionon = textContent.match(/Versionon:\s*([^\n\r]+)/)[1].trim() || null;
            const info = textContent.match(/Info:\s*([^\n\r]+)/)[1].trim() || null;
            const preview_image = 'https://www.nerdfonts.com' + $(rynn).find('a.font-preview').attr('style').match(/background-image\s*:\s*url\s*\(\s*['"]?([^'"]+)['"]?\s*\)/i)[1] || null;
            const preview_url = $(rynn).find('a.nf-oct-link_external').attr('href') || null;
            const download_url = $(rynn).find('a.nf-fa-download').attr('href');
            
            if (name && download_url) {
                result.push({
                    name,
                    versionon,
                    info,
                    preview_image,
                    preview_url,
                    download_url
                });
            }
        });
        
        return result;
    } catch (error) {
        throw new Error(error.message);
    }
}


const pluginConfig = {
    name: 'dafont',
    alias: ['nerdfont', 'font'],
    category: 'search',
    description: 'Cari font in DaFont',
    usage: '.dafont <query>',
    example: '.dafont Coolvetica',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energy: 0,
    isEnabled: true
}

function formatNumber(num) {
    const n = parseInt(num)
    if (isNaN(n)) return num
    if (n >= 1000000000) return (n / 1000000000).toFixed(1) + 'B'
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M'
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K'
    return n.toString()
}

async function handler(m, { sock }) {
    const query = m.text?.trim()
    try {
        const res = await nerdfonts()
        const rows = res.map((f, i) => {
            return {
                header: `Font ${f.name}`,
                title: f.info,
                description: `Versionon: ${f.versionon}`,
                id: `${m.prefix}nerdfont-get ${f.name}`
            }
        })
        await sock.sendMessage(m.chat, {
            text: 'Please choose font to be you download',
            footer: 'Click button below this',
            interactiveButtons: [
                {
                    name: 'single_select',
                    buttonParamsJson: JSON.stringify({
                        title: `Choose Font Insthis`,
                        sections: [
                            {
                                title: 'I hope, font this will help you',
                                highlight_label: 'Font Choice',
                                rows: rows
                            }
                        ]
                    })
                }
            ]
        }, { quoted: m })        
    } catch (err) {
        return m.reply(te(m.prefix, m.command, m.pushName))
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
