const { nightActionHandler } = require('./werewolf')
const te = require('../../src/lib/frenzy-error')

const pluginConfig = {
    name: 'wwprotect',
    alias: ['protect', 'guarinan', 'wpr'],
    category: 'game',
    description: 'Guarinan night action - Protect target',
    usage: '.wwprotect <number>',
    example: '.wwprotect 3',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: true,
    cooldown: 0,
    energy: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    try {
        return await nightActionHandler(m, { sock })
    } catch (error) {
        console.error('[WWPROTECT ERROR]', error)
        m.reply(te(m.prefix, m.command, m.pushName))
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
