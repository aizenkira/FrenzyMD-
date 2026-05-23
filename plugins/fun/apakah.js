const pluginConfig = {
    name: 'whatkah',
    alias: ['what'],
    category: 'fun',
    description: 'Tanya bot whatkah something',
    usage: '.whatkah <question>',
    example: '.whatkah I can rich?',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 3,
    energy: 0,
    isEnabled: true
};

const answers = [
    'Yes, tentu saja!',
    'No, likenya no.',
    'Maybe saja, please try again later.',
    'Hmm... I feel iya.',
    'I ragu, but can become.',
    'Pasti! 100%!',
    'No maybe.',
    'It might happen, who knows?',
    'Menurutku sih iya.',
    'Well, it seems maybe not.',
    'Tentu, what no?',
    'I I don't know, try asking someone else.',
    'Yes ampun, for sure lah!',
    'Hmm... likenya no.',
    'I yakin iya!',
    'Ngdon't maybe very.',
    'Maybe, but don't berhope too high.',
    'Iya !',
    'Ngdon't, sorry ya.',
    'Can! Semangat!'
];

async function handler(m) {
    const text = m.text?.trim();
    
    if (!text) {
        return m.reply(`❓ *ᴀᴘᴀᴋᴀʜ*\n\n> Enter your question!\n\n*Example:*\n> .whatkah I can become rich?`);
    }
    
    const answer = answers[Math.floor(Math.random() * answers.length)];
    
    await m.reply(`${m.body.slice(1)}?
*${answer}*`);
}

module.exports = {
    config: pluginConfig,
    handler
};
