const pluginConfig = {
    name: 'kwhatn',
    alias: ['when'],
    category: 'fun',
    description: 'Tanya bot kwhatn something',
    usage: '.kwhatn <question>',
    example: '.kwhatn I nikah?',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 3,
    energy: 0,
    isEnabled: true
};

const answers = [
    'Tomorrow maybe?',
    'Next year it seems.',
    '3 day again!',
    'Hmm, still old sih.',
    'Sebelater again kok!',
    'Kalau already timenya, for sure come to pass.',
    'Next month!',
    'Entah kwhatn, that penting patient.',
    'In time dekat!',
    '10 year again maybe?',
    'Ngdon't old again!',
    'Kalau match/soulmate, for sure totemu.',
    'Hmm, hard to predict.',
    'Next week!',
    'Kalau usaonly lebih toras, lebih fast!',
    'Pas timenya right.',
    'Sefastnya, tenang aja.',
    'When you are ready.',
    'In hthatngan day!',
    'Saat you already ready to accept it.'
];

async function handler(m) {
    const text = m.text?.trim();
    
    if (!text) {
        return m.reply(`⏰ *ᴋᴀᴘᴀɴ*\n\n> Enter your question!\n\n*Example:*\n> .kwhatn I nikah?`);
    }
    
    const answer = answers[Math.floor(Math.random() * answers.length)];
    
    await m.reply(`${m.body.slice(1)}?\n*${answer}*`);
}

module.exports = {
    config: pluginConfig,
    handler
};
