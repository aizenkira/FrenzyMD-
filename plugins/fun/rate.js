const pluginConfig = {
    name: 'rate',
    alias: ['nilai', 'rating'],
    category: 'fun',
    description: 'Minta bot memberi rating something',
    usage: '.rate <something>',
    example: '.rate faceku',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 3,
    energy: 0,
    isEnabled: true
};

const ratings = [
    { score: '10/10', comment: 'Sempurna! Ngdon't there is duanya!' },
    { score: '9/10', comment: 'Hampir perfect! Toren very!' },
    { score: '8/10', comment: 'Excellent! Impressive!' },
    { score: '7/10', comment: 'Pretty good, above average!' },
    { score: '6/10', comment: 'Pretty, can better again.' },
    { score: '5/10', comment: 'Just average, though.' },
    { score: '4/10', comment: 'Hmm, reduce slightly.' },
    { score: '3/10', comment: 'Perlu many pergoodan.' },
    { score: '2/10', comment: 'Aduh, still afar from good.' },
    { score: '1/10', comment: 'Sorry, but this seriously.' },
    { score: '100/10', comment: 'LEGEND! Beyond perfect!' },
    { score: '11/10', comment: 'Melebihi ekspektasi!' },
    { score: '69/100', comment: 'Nice...' },
    { score: '420/10', comment: 'BLAZING!' },
    { score: '∞/10', comment: 'Gacor kang' },
    { score: '7.5/10', comment: 'Solid! Good job!' },
    { score: '8.5/10', comment: 'Impressive!' },
    { score: '9.5/10', comment: 'Near perfection!' },
    { score: '-1/10', comment: 'I I don't know must ngomong what...' },
    { score: '???/10', comment: 'Error 404: Rating not found.' }
];

async function handler(m) {
    const text = m.text?.trim();
    
    if (!text) {
        return m.reply(`⭐ *ʀᴀᴛᴇ*\n\n> Enter something for innilai!\n\n*Example:*\n> .rate faceku`);
    }
    
    const rating = ratings[Math.floor(Math.random() * ratings.length)];
    
    await m.reply(`Rating from I: *${rating.score}*
${rating.comment}`);
}

module.exports = {
    config: pluginConfig,
    handler
};
