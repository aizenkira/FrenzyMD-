const pluginConfig = {
    name: 'benefitpartner',
    alias: ['partnerbenefits', 'tountunganpartner'],
    category: 'info',
    description: 'View tountungan become partner bot',
    usage: '.benefitpartner',
    example: '.benefitpartner',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energy: 0,
    isEnabled: true
}

async function handler(m) {
    const config = require('../../config')
    const prefix = m.prefix || '.'

    let txt = `🤝 *BENEFIT PARTNER*\n\n`
    txt += `Tountungan become partner ${config.bot?.name || 'Bot'}:\n\n`

    txt += `🔓 *Akses Feature*\n`
    txt += `├ All feature premium open\n`
    txt += `├ Energy & coins unlimited\n`
    txt += `├ Akses command owner specific\n`
    txt += `└ Prioritas support\n\n`

    txt += `📦 *Panel Pterodactyl*\n`
    txt += `├ Can create server yourself\n`
    txt += `├ Can tolola server (start/stop/restart)\n`
    txt += `├ Akses panel management\n`
    txt += `└ Can sellan panel (reseller)\n\n`

    txt += `💎 *Bonus*\n`
    txt += `├ +200.000 EXP when activation\n`
    txt += `├ +20.000 Coins when activation\n`
    txt += `├ Badge partner in profil\n`
    txt += `└ Akses early feature\n\n`

    txt += `💰 *Cara Jain Partner*\n`
    txt += `├ Contact owner: ${config.owner?.name || 'Owner'}\n`
    txt += `├ Durasi: 30/60/90 day\n`
    txt += `└ Command: \`${prefix}addpartner\` (owner only)\n\n`

    txt += `📋 *Command Partner*\n`
    txt += `├ \`${prefix}checkpartner\` — Check status partner\n`
    txt += `├ \`${prefix}checkprem\` — Check status premium\n`
    txt += `├ \`${prefix}checkowner\` — Check role user\n`
    txt += `└ \`${prefix}listpartner\` — Partner list\n\n`

    txt += `> _Contact owner for info lebih continue_`

    await m.reply(txt)
}

module.exports = {
    config: pluginConfig,
    handler
}
