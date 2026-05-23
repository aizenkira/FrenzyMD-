const pluginConfig = {
    name: 'try',
    alias: ['try'],
    category: 'fun',
    description: 'Try asking the bot something',
    usage: '.try <question>',
    example: '.try guess what I'm thinking',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 3,
    energy: 0,
    isEnabled: true
};

const answers = [
    'Hmm, Let me try... You again thinking about something!',
    'Let me guess... You are bored again!',
    'Let me try... It seems you again happy!',
    'Hmm, I feel you again bingung.',
    'Let me guess... You again missing someone?',
    'It seems you again casually .',
    'I guess you again scroll your phone terus.',
    'Hmm, for sure again bosan ya?',
    'Try guess... You again want to go for a walk!',
    'I feel you again need entertainment.',
    'Hmm, it seems you again happy!',
    'Let me try... You for sure again curious!',
    'Tebwill I: you again rebahan.',
    'Hmm, you maybe again thinking about someone speunlucky.',
    'Let me try: you again want share feelings?',
    'It seems you again want main game!',
    'Hmm, I guess you again dengerin musik.',
    'Let me guess... You again in room!',
    'I feel you again waiting for something.',
    'Hmm, let me guess I: you need someone to chat with!'
];

async function handler(m) {
    const text = m.text?.trim();
    
    if (!text) {
        return m.reply(`🎯 *ᴄᴏʙᴀ*\n\n> Enter something!\n\n*Example:*\n> .try guess what I'm thinking`);
    }
    
    const answer = answers[Math.floor(Math.random() * answers.length)];
    
    await m.reply(`${m.body.slice(1)}?
*${answer}*`);
}

module.exports = {
    config: pluginConfig,
    handler
};
