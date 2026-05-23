const config = require('../../config');

const pluginConfig = {
    name: 'gay',
    alias: ['howgay'],
    category: 'fun',
    description: 'Mepoints member most gay in group',
    usage: '.gay',
    isGroup: true,
    isBotAdmin: false,
    isAdmin: false,
    cooldown: 10,
    energy: 2,
    isEnabled: true
};

async function handler(m, { sock }) {
    if (!m.isGroup) return m.reply(config.messages.groupOnly);
    const groupMetadata = m.groupMetadata;
    const participants = groupMetadata.participants;
    const member = participants.map(u => u.jid);
    const person1 = member[Math.floor(Math.random() * member.length)];
    const person2 = member[Math.floor(Math.random() * member.length)];
    const text = `@${person1.split('@')[0]} *Nge gay the same as* @${person2.split('@')[0]}`;
    await m.reply(text, { mentions: [person1, person2] })
}

module.exports = {
    config: pluginConfig,
    handler
};
