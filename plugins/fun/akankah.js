const pluginConfig = {
    name: 'willkah',
    alias: ['will', 'will'],
    category: 'fun',
    description: 'Tanya bot willkah something come to pass',
    usage: '.willkah <question>',
    example: '.willkah I succeed?',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 3,
    energy: 0,
    isEnabled: true
};

const answers = [
    'Yes, for sure will come to pass!',
    'No, likenya no will.',
    'Maybe will, maybe no.',
    'InsyaAllah will come to pass!',
    'Hmm, sulit predict.',
    'Pasti! Yeskin saja!',
    'It seems maybe not.',
    'Will come to pass if you want berusaha.',
    'Suatu when later, for sure.',
    'Ngdon't will, sorry.',
    'Tentu will! Wait saja!',
    'Hmm, I ragu.',
    'Will! Percaya the same as process!',
    'Tomaybeannya toddler.',
    'Pasti will, I yakin!',
    'Ngdon't will, search for another one aja.',
    'Will, but need time.',
    'InsyaAllah!',
    'Kalau match/soulmate, for sure will.',
    'Will come to pass in when that right!'
];

async function handler(m) {
    const text = m.text?.trim();
    
    if (!text) {
        return m.reply(`🔮 *ᴀᴋᴀɴᴋᴀʜ*\n\n> Enter your question!\n\n*Example:*\n> .willkah I succeed?`);
    }
    
    const answer = answers[Math.floor(Math.random() * answers.length)];
    
    await m.reply(`${m.body.slice(1)}?
*${answer}*`);
}

module.exports = {
    config: pluginConfig,
    handler
};
