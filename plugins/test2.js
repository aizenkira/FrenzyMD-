const fs = require('fs')

const pluginConfig = {
    name: 'testing2',
    alias: ['test2'],
    category: 'main',
    description: 'Test plugin - Send PTV to newsletter',
    usage: '.test',
    isOwner: true,
    isGroup: false,
    isEnabled: true
}

async function handler(m, { sock }) {
    await m.react('🕕')
    await sock.relayMessage(m.chat, {
        pollResultSnapshotMessage: {
            name: "Aizen Zinn Zunn",
            pollVotes: [
            {
                optionName: "Ăizen",
                optionVoteCount: "99999999999999"
            },
            {
                optionName: "Zein",
                optionVoteCount: "88888888888888"
            },
            {
                optionName: "Ăizen",
                optionVoteCount: "5555"
            },
            {
                optionName: "Zein",
                optionVoteCount: "66666666"
            },
            {
                optionName: "Ăizen",
                optionVoteCount: "777777777777"
            },
            {
                optionName: "Zein",
                optionVoteCount: "2"
            },
            ],
            contextInfo: {
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterName: "Test",
                    newsletterJid: "120363406397452589@newsletter"
                }
            },
            
        }
    }, { messageId: m.key.id, quoted: m })
}

module.exports = {
    config: pluginConfig,
    handler
}