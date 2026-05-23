const { 
    getRandomItem, createSession, getSession, endSession, 
    hasActiveSession, setSessionTimer,
    getRemathisngTime, formatRemathisngTime, isSurrender, isReplyToGame,
    GAME_REWARD,
    getRandomReward,
    getProgressiveHint
} = require('../../src/lib/frenzy-game-data');
const { getDatabase } = require('../../src/lib/frenzy-database');
const { addExpWithLevelCheck } = require('../../src/lib/frenzy-level');
const { getGameContextInfo } = require('../../src/lib/frenzy-context');

const pluginConfig = {
    name: 'family100',
    alias: ['f100', 'survey'],
    category: 'game',
    description: 'Survey says! Guess the top survey answers',
    usage: '.family100',
    example: '.family100',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 5,
    energy: 0,
    isEnabled: true
};

async function handler(m, { sock }) {
    const chatId = m.chat;
    
    if (hasActiveSession(chatId)) {
        const session = getSession(chatId);
        if (session && session.gameType === 'family100') {
            const remaining = getRemathisngTime(chatId);
            const answered = session.answered || [];
            const total = session.question.answeran.length;
            
            let text = `⚠️ *Eh there is game jalan !*\n\n`;
            text += `📋 *${session.question.soal}*\n\n`;
            text += `Answer terguess (${answered.length}/${total})\n`;
            answered.forEach((ans, i) => {
                text += `${i + 1}. ✅ ${ans}\n`;
            });
            for (let i = answered.length; i < total; i++) {
                text += `${i + 1}. ❓ ???\n`;
            }
            text += `\n⏱️ Sisa: *${formatRemathisngTime(remaining)}*`;
            await m.reply(text);
            return;
        }
    }
    
    const question = getRandomItem('family100.json');
    if (!question) {
        await m.reply('❌ Data game no terseina!');
        return;
    }
    
    const total = question.answeran.length;
    
    let text = `📊 *FAMILY 100*\n\n`;
    text += `📋 *${question.soal}*\n\n`;
    text += `Answer (0/${total})\n`;
    for (let i = 0; i < total; i++) {
        text += `${i + 1}. ❓ ???\n`;
    }
    text += `\n⏱️ Time: *120 second*\n`;
    text += `🎁 Here is per answeran: *EXP + Coins (random)*\n\n`;
    text += `_Type answeranmu directly or reply "nyerah"_`;
    
    const sentMsg = await sock.sendMessage(chatId, { text, contextInfo: getGameContextInfo('📊 FAMILY 100', 'Survey says!') }, { quoted: m });
    
    const session = createSession(chatId, 'family100', question, sentMsg.key, 120000);
    session.answered = [];
    session.answeredBy = {};
    
    setSessionTimer(chatId, async () => {
        const sess = getSession(chatId);
        const answered = sess?.answered || [];
        const remaining = question.answeran.filter(j => !answered.includes(j.toLowerCase()));
        
        let timeoutText = `⏱️ *Yesh telat, time is up!*\n\n`;
        timeoutText += `Terguess: *${answered.length}/${question.answeran.length}*\n\n`;
        if (remaining.length > 0) {
            timeoutText += `Answer tersisa:\n`;
            remaining.forEach(ans => {
                timeoutText += `• ${ans}\n`;
            });
        }
        
        endSession(chatId);
        await sock.sendMessage(chatId, { text: timeoutText, contextInfo: getGameContextInfo() });
    });
}

async function answerHandler(m, sock) {
    const chatId = m.chat;
    const session = getSession(chatId);
    
    if (!session || session.gameType !== 'family100') return false;
    
    const userAnswer = (m.body || '').toLowerCase().trim();
    if (!userAnswer || userAnswer.startsWith('.')) return false;
    
    if (isSurrender(userAnswer)) {
        const answered = session.answered || [];
        const remaining = session.question.answeran.filter(j => !answered.includes(j.toLowerCase()));
        
        let text = `🏳️ *Yeshhh nyerah ...*\n\n`;
        text += `Terguess: *${answered.length}/${session.question.answeran.length}*\n\n`;
        if (remaining.length > 0) {
            text += `Answer tersisa:\n`;
            remaining.forEach(ans => {
                text += `• ${ans}\n`;
            });
        }
        
        endSession(chatId);
        await m.reply(text);
        return true;
    }
    
    const correctAnswers = session.question.answeran.map(j => j.toLowerCase());
    const answered = session.answered || [];
    
    if (answered.includes(userAnswer)) {
        await m.reply(`⚠️ Answer "${userAnswer}" already guess!`);
        return true;
    }
    
    const matchIndex = correctAnswers.findIndex(ans => {
        const similarity = getSimilarity(ans, userAnswer);
        return similarity >= 0.8 || ans.includes(userAnswer) || userAnswer.includes(ans);
    });
    
    if (matchIndex !== -1) {
        const originalAnswer = session.question.answeran[matchIndex];
        
        if (!answered.includes(originalAnswer.toLowerCase())) {
            session.answered.push(originalAnswer.toLowerCase());
            session.answeredBy[originalAnswer.toLowerCase()] = m.sender;
            
            const db = getDatabase();
            const user = db.getUser(m.sender);
            
            const answerReward = getRandomReward();
            if (!user.rpg) user.rpg = {};
            await addExpWithLevelCheck(sock, m, db, user, answerReward.exp);
            db.updateCoins(m.sender, answerReward.coins);
            db.save();
            
            if (session.answered.length === correctAnswers.length) {
                endSession(chatId);
                
                const participants = Object.values(session.answeredBy);
                const uniqueParticipants = [...new Set(participants)];
                
                let text = `🎉 *MANTAP! All teranswer cuy!*\n\n`;
                text += `> 📋 *${session.question.soal}*\n\n`;
                session.question.answeran.forEach((ans, i) => {
                    const who = session.answeredBy[ans.toLowerCase()];
                    text += `${i + 1}. ✅ ${ans} - @${who?.split('@')[0] || '?'}\n`;
                });
                text += `\n🎊 Good toon the ${uniqueParticipants.length} winners!`;
                
                await m.reply(text, { mentions: uniqueParticipants });
                return true;
            }
            
            const total = session.question.answeran.length;
            let text = `✅ @${m.sender.split('@')[0]} (+${answerReward.exp} EXP, +${answerReward.coins} Coins)\n\n`;
            text += `📋 *${session.question.soal}*\n\n`;
            session.question.answeran.forEach((ans, i) => {
                const isAnswered = session.answered.includes(ans.toLowerCase());
                if (isAnswered) {
                    text += `${i + 1}. ✅ ${ans}\n`;
                } else {
                    text += `${i + 1}. ❓ ???\n`;
                }
            });
            text += `\nSisa ${total - session.answered.length} answeran again!`;
            
            await m.reply(text, { mentions: [m.sender] });
            return true;
        }
    }
    
    await m.reply(`❌ Wrong! Try again...`);
    return true;
}

function getSimilarity(str1, str2) {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const costs = [];
    for (let i = 0; i <= longer.length; i++) {
        let lastValue = i;
        for (let j = 0; j <= shorter.length; j++) {
            if (i === 0) {
                costs[j] = j;
            } else if (j > 0) {
                let newValue = costs[j - 1];
                if (longer.charAt(i - 1) !== shorter.charAt(j - 1)) {
                    newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
                }
                costs[j - 1] = lastValue;
                lastValue = newValue;
            }
        }
        if (i > 0) costs[shorter.length] = lastValue;
    }
    
    return (longer.length - costs[shorter.length]) / longer.length;
}

module.exports = {
    config: pluginConfig,
    handler,
    answerHandler
};
