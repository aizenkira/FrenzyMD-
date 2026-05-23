const { nightActionHandler } = require('./werewolf')
const te = require('../../src/lib/frenzy-error')

const pluginConfig = {
    name: 'wwsee',
    alias: ['seer', 'vision', 'wse'],
    category: 'game',
    description: 'Seer night action - See target role',
    usage: '.wwsee <number>',
    example: '.wwsee 1',
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
        console.error('[WWSEE ERROR]', error)
        m.reply(te(m.prefix, m.command, m.pushName))
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
