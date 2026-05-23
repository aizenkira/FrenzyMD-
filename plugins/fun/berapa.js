const pluginConfig = {
    name: 'berwhat',
    alias: ['howmuch', 'howmany'],
    category: 'fun',
    description: 'Tanya bot berwhat something',
    usage: '.berwhat <question>',
    example: '.berwhat umur match/soulmateku?',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 3,
    energy: 0,
    isEnabled: true
};

const answers = [
    '1',
    '7',
    '12',
    '21',
    '99',
    '69',
    '100',
    '50',
    '25',
    '1000',
    '5',
    '17',
    '88',
    '33',
    'nothing (answerannya always nothing)',
    'Many very!',
    'Cuma slightly.',
    'Tak terhthatng!',
    'Hmm, sekitar 10-an.',
    'Lebih from that you kira!',
    'No idea ah, males'
];

async function handler(m) {
    const text = m.text?.trim();
    
    if (!text) {
        return m.reply(`🔢 *ʙᴇʀᴀᴘᴀ*\n\n> Enter your question!\n\n*Example:*\n> .berwhat umur match/soulmateku?`);
    }
    
    const answer = answers[Math.floor(Math.random() * answers.length)];
    
    await m.reply(`${m.body.slice(1)}?
*${answer}*`);
}

module.exports = {
    config: pluginConfig,
    handler
};
