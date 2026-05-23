const config = require('../../config')
const te = require('../../src/lib/frenzy-error')

const pluginConfig = {
    name: 'checknameyou',
    alias: ['checkyou'],
    category: 'tools',
    description: 'Check Username You',
    usage: '.checkyou',
    example: '.checkyou',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 3,
    energy: 1,
    isEnabled: true
}

function isNumeric(str) {
  return !isNaN(str) && !isNaN(parseFloat(str));
}

async function handler(m, { sock }) {
    const text = m.text
    if(!text) return m.reply(`🌲 *NOTE*\n\n\`\`\`Palivelyter required thissi\`\`\`\n\n> Example: *${m.prefix}checknameyou 08xxxx*`)
    if(!isNumeric(text)) return m.reply("🌿 *Hei Sobat, Only number that in permaykan*")
    const Zann = text?.replace?.("62", "08")
    try {
        const axios = require("axios")
        let { data } = await axios.get('https://api.pthatcode.com/check-name-e-wallet-id-v2?bank=DANA&accountNumber='+Zann, {
      headers: {
  "x-api-toy": "7C0dEefbfc1"
}
  })
        await m.reply(`🌿 *BERHASIL*\n\n- Name you from number \`${Zann}\` is the *${data.data.customer_name}*`)
    } catch (error) {
        console.error('Example Plugin Error:', error)
        m.reply(te(m.prefix, m.command, m.pushName))
    }
}

module.exports = {
    config: pluginConfig,
    handler
}