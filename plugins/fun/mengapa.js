const pluginConfig = {
    name: 'mengwhat',
    alias: ['what', 'why'],
    category: 'fun',
    description: 'Tanya bot mengwhat something',
    usage: '.mengwhat <question>',
    example: '.mengwhat langit biru?',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 3,
    energy: 0,
    isEnabled: true
};

const answers = [
    'Because memang already takinrnya begthat.',
    'Hmm, question good! I also bingung.',
    'Because thatlah way torjanya.',
    'Because Tuhan bertohendak demikian.',
    'I I don't know, search for in Google aja.',
    'Because ya gthat aja.',
    'Maybe because tobetulan?',
    'Because dunia memang full misteri.',
    'Hmm, sulit explain sih.',
    'Because the universe works in mysterious ways.',
    'I also curious, what ya?',
    'Because things the said memang semustnya come to pass.',
    'Good question! Unfortunately I I don't have the answer.',
    'Because thatlah touniquean hidup.',
    'Because every things punya alasannya masing-masing.',
    'Hmm... I need time for think about it.',
    'Because begthatlah logikanya.',
    'I feel because memang must begthat.',
    'Because segala something saling berhubungan.',
    'Nah that I also mikir!'
];

async function handler(m) {
    const text = m.text?.trim();
    
    if (!text) {
        return m.reply(`🤔 *ᴍᴇɴɢᴀᴘᴀ*\n\n> Enter your question!\n\n*Example:*\n> .mengwhat langit biru?`);
    }
    
    const answer = answers[Math.floor(Math.random() * answers.length)];
    
    await m.reply(`${m.body.slice(1)}?\n*${answer}*`);
}

module.exports = {
    config: pluginConfig,
    handler
};
