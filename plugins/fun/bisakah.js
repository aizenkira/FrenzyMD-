const pluginConfig = {
    name: 'cankah',
    alias: ['can'],
    category: 'fun',
    description: 'Tanya bot cankah something',
    usage: '.cankah <question>',
    example: '.cankah I lulus ujian?',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 3,
    energy: 0,
    isEnabled: true
};

const answers = [
    'Can very! Percaya self aja!',
    'Hmm, it seems difficult.',
    'Tentu can! Semangat!',
    'Can't do it, sorry.',
    'Maybe can, if usaha toras.',
    'Pasti can! Don't give up!',
    'It's not that hard, but give it a try.',
    'Can kok! Yeskin !',
    'It seems maybe not.',
    'Can! Ayo buktikan!',
    'Hmm... I ragu.',
    'Can very! Gas terus!',
    'Can't do it, try another one.',
    'Can! Percaya the same as self yourself!',
    'It's hard, but doesn't mean impossible.',
    'Absolutely! You for sure can!',
    'It seems perlu usaha ekstra .',
    'Can! Don't ragukan selfmu!',
    'Hmm, please try again later .',
    'Can! I confident you!'
];

async function handler(m) {
    const text = m.text?.trim();
    
    if (!text) {
        return m.reply(`💪 *ʙɪsᴀᴋᴀʜ*\n\n> Enter your question!\n\n*Example:*\n> .cankah I lulus ujian?`);
    }
    
    const answer = answers[Math.floor(Math.random() * answers.length)];
    
    await m.reply(`${m.body.slice(1)}?
*${answer}*`);
}

module.exports = {
    config: pluginConfig,
    handler
};
