const pluginConfig = {
    name: 'inmana',
    alias: ['where', 'mana'],
    category: 'fun',
    description: 'Tanya bot inmana something',
    usage: '.inmana <question>',
    example: '.inmana match/soulmateku berthere is?',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 3,
    energy: 0,
    isEnabled: true
};

const answers = [
    'In dekatmu!',
    'Jauh in there.',
    'In place that no you duga.',
    'In your heart.',
    'In sekitar sthis.',
    'Hmm, try looking in your room.',
    'In outside there, waitingmu.',
    'In place that the same as withmu.',
    'In some beautiful place.',
    'In back pintu.',
    'In sebelah sendu.',
    'In in front of you!',
    'Jauh very, in outside negeri maybe?',
    'In place that full tonangan.',
    'In mana-mana!',
    'In dunia maya.',
    'In alam mimpi.',
    'In place confidential.',
    'Hmm, hard to explain the location.',
    'In place that will createmu bahagia.'
];

async function handler(m) {
    const text = m.text?.trim();
    
    if (!text) {
        return m.reply(`📍 *ᴅɪᴍᴀɴᴀ*\n\n> Enter your question!\n\n*Example:*\n> .inmana match/soulmateku berthere is?`);
    }
    
    const answer = answers[Math.floor(Math.random() * answers.length)];
    
    await m.reply(`${m.body.slice(1)}?
*${answer}*`);
}

module.exports = {
    config: pluginConfig,
    handler
};
