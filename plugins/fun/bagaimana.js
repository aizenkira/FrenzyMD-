const pluginConfig = {
    name: 'bagaimana',
    alias: ['gimana', 'how'],
    category: 'fun',
    description: 'Tanya bot bagaimana something',
    usage: '.bagaimana <question>',
    example: '.bagaimana how to become successful?',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 3,
    energy: 0,
    isEnabled: true
};

const answers = [
    'Caranya gampang, ya tinggal inlIin aja!',
    'Hmm, it's hard to expelse. Just try it!',
    'With usaha and prayer for surenya.',
    'Yes begthatlah waynya.',
    'I'm not really sure, try finding another reference.',
    'Pelan-pelan aja, later also can.',
    'With torja toras and pantang give up!',
    'First, be confident in yourself.',
    'Hmm, tiap person beda-beda sih waynya.',
    'Ikutin kata your heart aja.',
    'Belajar from that already berpengaoldn.',
    'Step by step, don't terburu-buru.',
    'With tekad that strong!',
    'Start from that toddler first.',
    'Konsisten aja, later also can.',
    'Don't overthinking, directly action!',
    'Gampang! Tinggal start aja!',
    'Caranya? Yes try first!',
    'With strategi that right.',
    'Hmm, I also still belajar sih.'
];

async function handler(m) {
    const text = m.text?.trim();
    
    if (!text) {
        return m.reply(`📋 *ʙᴀɢᴀɪᴍᴀɴᴀ*\n\n> Enter your question!\n\n*Example:*\n> .bagaimana how to become successful?`);
    }
    
    const answer = answers[Math.floor(Math.random() * answers.length)];
    
    await m.reply(`${m.body.slice(1)}?
*${answer}*`);
}

module.exports = {
    config: pluginConfig,
    handler
};
