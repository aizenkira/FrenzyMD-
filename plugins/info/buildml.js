const config = require('../../config')
const axios = require("axios")
const te = require('../../src/lib/frenzy-error')

const pluginConfig = {
  name: 'buildml',
  alias: [],
  category: 'info',
  description: 'Build hero Mobile Legends',
  usage: '.buildml <hero>',
  example: '.buildml gusion',
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 3,
  energy: 1,
  isEnabled: true
}

async function handler(m, { sock }) {
  let text = m.args?.join(" ")
  if (!text) {
    return m.reply(
      `📚 *BUILD ML*\n\n> Enter a character name\n\nExample: ${m.prefix}buildml gusion`
    )
  }

  m.react("🕕")

  try {
    const { data } = await axios.get(
      `https://api.apocalypse.web.id/search/buildml?hero=${encodeURIComponent(text)}`
    )

    const heroes = data.builds
    if (!heroes || !heroes.length) {
      return m.reply("❌ Build not found")
    }

    const pickRandom = heroes[Math.floor(Math.random() * heroes.length)]
    const title = pickRandom.title

    const itemnya = pickRandom.items?.map(v => {
      return `*ITEM*
🌿 \`Name\`: ${v.name}
🔮 \`Type\`: ${v.type}
💵 \`Price\`: ${v.price}

*STATS*
🚧 \`Magic Power\`: ${v.stats?.magic_power || "-"}
👻 \`Movement Speed\`: ${v.stats?.movement_speed || "-"}
🎗️ \`Magic Penetration\`: ${v.stats?.magic_penetration || "-"}

*PASSIVE*
${v.passive_description || "-"}`
    }).join("\n\n")

    m.reply(`*BUILD ${text.toUpperCase()}*

🍯 *Title*
${title}

${itemnya}`)

  } catch (error) {
    console.error('BuildML Error:', error)
    m.reply(te(m.prefix, m.command, m.pushName))
  }
}

module.exports = {
  config: pluginConfig,
  handler
}