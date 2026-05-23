const { getPmeaningcipantJid, getPmeaningcipantJids } = require('../../src/lib/frenzy-lid')
const te = require('../../src/lib/frenzy-error')

const pluginConfig = {
    name: 'tagall',
    alias: ['all', 'everyone'],
    category: 'group',
    description: 'Tag all group members',
    usage: '.tagall <message>',
    example: '.tagall Hello all!',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 30,
    energy: 0,
    isEnabled: true,
    isAdmin: true,
    isBotAdmin: false
}

async function handler(m, { sock }) {
    const text = m.text || 'Tag All Members'

    try {
        const groupMeta = m.groupMetadata
        const participants = groupMeta.participants || []

        if (participants.length === 0) {
            await m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> there are no members in this group.`)
            return
        }

        const mentions = getPmeaningcipantJids(participants)
        const memberList = participants.map((p, i) => `@${getPmeaningcipantJid(p).split('@')[0]}`).join('\n').trim()

        await m.reply(`*Message:* ${text}\n\n` +
            `\`\`\`━━━ ${participants.length} TOTAL MEMBERS ━━━\`\`\`\n` +
            memberList, { mentions: mentions })

    } catch (error) {
        m.reply(te(m.prefix, m.command, m.pushName))
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
