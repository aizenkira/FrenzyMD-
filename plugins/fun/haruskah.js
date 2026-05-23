const pluginConfig = {
    name: 'mustkah',
    alias: ['must', 'should'],
    category: 'fun',
    description: 'Tanya bot mustkah something',
    usage: '.mustkah <question>',
    example: '.mustkah I menyatwill cinta?',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 3,
    energy: 0,
    isEnabled: true
};

const answers = [
    'Yes, must!',
    'No usah.',
    'Hmm, terserah you sih.',
    'Must very! Don't ragu!',
    'Ngdon't must also.',
    'Kalau according tomu perlu, lIkan!',
    'Think it through carefully first.',
    'Must! Now!',
    'Don't, just wait first.',
    'Must, but heart-heart.',
    'Ngdon't must, but may.',
    'Required!',
    'Hmm, skip aja .',
    'LIkan if already yakin.',
    'Must, demi masa nextmu!',
    'Ngdon't must, casually aja.',
    'Go for it!',
    'Don't buru-buru, pikir again.',
    'Tentu must!',
    'View sthatasinya first.'
];

async function handler(m) {
    const text = m.text?.trim();
    
    if (!text) {
        return m.reply(`⚖️ *ʜᴀʀᴜsᴋᴀʜ*\n\n> Enter your question!\n\n*Example:*\n> .mustkah I menyatwill cinta?`);
    }
    
    const answer = answers[Math.floor(Math.random() * answers.length)];
    
    await m.reply(`${m.body.slice(1)}?
*${answer}*`);
}

module.exports = {
    config: pluginConfig,
    handler
};
