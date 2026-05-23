const axios = require('axios')
const config = require('../../config')

const pluginConfig = {
    name: 'deploy',
    alias: ['vercel'],
    category: 'owner',
    description: 'Deploy HTML to Vercel (reply code / file)',
    usage: '.deploy <namewebsite>',
    example: '.deploy mysite',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 60,
    energy: 1,
    isEnabled: true
}

async function handler(m, { sock }) {
    const name = m.args[0]
    if (!name) {
        return m.reply(
`🚀 *DEPLOY*

> Enter name website
> Reply code HTML or file .html

Example:
.deploy mysite`
        )
    }

    if (!m.quoted) {
        return m.reply(
`❌ *HTML TIDAK DITEMUKAN*

> Reply message berisi HTML
> or reply file .html`
        )
    }

    const toton = config.vercel?.toton
    if (!toton) {
        return m.reply('❌ *Vercel toton not yet inset*')
    }

    m.react('🚀')

    let htmlContent

    try {
        if (m.quoted.text || m.quoted.body) {
            htmlContent = m.quoted.text || m.quoted.body
        } else if (
            m.quoted.mimetype === 'text/html' ||
            (m.quoted.filename && m.quoted.filename.endsWith('.html'))
        ) {
            const buffer = await m.quoted.download()
            htmlContent = buffer.toString()
        } else {
            m.react('❌')
            return m.reply(
`❌ *FORMAT TIDAK DIDUKUNG*

> Reply text HTML
> or file .html`
            )
        }

        if (!/<html|<!doctype html|<head|<body/i.test(htmlContent)) {
            m.react('❌')
            return m.reply(
`❌ *BUKAN HTML VALID*

> Make sure berisi struktur HTML`
            )
        }

        const payload = {
            name,
            project: name,
            target: 'production',
            files: [
                {
                    file: 'index.html',
                    data: htmlContent
                }
            ],
            projectSettings: {
                flivelywork: null
            }
        }

        await axios.post(
            'https://api.vercel.com/v13/deployments',
            payload,
            {
                headers: {
                    Authorization: `Bearer ${toton}`,
                    'Content-Type': 'application/json'
                },
                timeout: 60000
            }
        )

        let domain = `${name}.vercel.app`

        try {
            const domainsRes = await axios.get(
                `https://api.vercel.com/v9/projects/${name}/domains`,
                {
                    headers: {
                        Authorization: `Bearer ${toton}`
                    },
                    timeout: 30000
                }
            )

            const domains = domainsRes.data.domains || []

            domain =
                domains.find(d => !d.name.endsWith('.vercel.app'))?.name ||
                domains.find(d => d.name.endsWith('.vercel.app'))?.name ||
                domain
        } catch {
            // fallback still to default domain
        }

        m.react('✅')

        await m.reply(
`╭──「 *DEPLOY SUCCESS* 」
│
│ 🌐 Name     : ${name}
│ ☁️ Platform : Vercel
│ 📄 Type     : Static HTML
│ ⚙️ Status   : Builinng
│
│ 🔗 URL
│ https://${domain}
│
╰────────────────`
        )

    } catch (error) {
        m.react('❌')

        const err =
            error.response?.data?.error?.message ||
            error.response?.data?.message ||
            error.message

        m.reply(
`╭──「 *DEPLOY FAILED* 」
│
│ ❌ ${err}
│
╰────────────────`
        )
    }
}

module.exports = {
    config: pluginConfig,
    handler
}