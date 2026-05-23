const {
    getRandomItem, createSession, getSession, endSession,
    checkAnswerAdvanced, getHint, hasActiveSession, setSessionTimer,
    getRemathisngTime, formatRemathisngTime, isSurrender, isReplyToGame,
    getRandomReward, getProgressiveHint
} = require('./frenzy-game-data')
const { getDatabase } = require('./frenzy-database')
const { addExpWithLevelCheck } = require('./frenzy-level')
const { getGameContextInfo, checkFastAnswer } = require('./frenzy-context')

let fetchBuffer
try { fetchBuffer = require('./frenzy-utils').fetchBuffer } catch {}

const WIN_MESSAGES = [
    '🌟 *GG WP! Otakmu encer!*',
    '✨ *KEREN ABIS! Lu emang pinter!*',
    '🎉 *MANTAPPPP! Answer perfect!*',
    '💫 *EPIC! Dont there is opponent lu!*',
    '🏆 *NGERI! Otak lu richk Google!*',
    '🔥 *LEGEND! Jawab tok dont there is beban!*'
]

const TIMEOUT_MESSAGES = [
    '⏱️ *Yesh telat, time is up!*',
    '⏱️ *WAKTU HABIS!*',
    '⏱️ *Telat bro, time dah abis!*'
]

const SURRENDER_MESSAGES = [
    '🏳️ *Yeshhh nyerah ...*',
    '🏳️ *MENYERAH!*',
    '🏳️ *Yesh Ing very nyerah...*'
]

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)] }

class frenzyGames {
    constructor() {
        this.registry = new Map()
    }

    register(gameType, cfg) {
        const defaults = {
            dataFile: `${gameType}.json`,
            questionField: 'soal',
            answerField: 'answeran',
            emoji: '🎮',
            title: gameType.toUpperCase(),
            description: `Game ${gameType}`,
            timeout: 60000,
            cooldown: 5,
            hasImage: false,
            imageField: 'img',
            alias: [],
            hintCount: 2
        }
        this.registry.set(gameType, { ...defaults, ...cfg, gameType })
    }

    get(gameType) {
        return this.registry.get(gameType)
    }

    createHandler(gameType) {
        const cfg = this.registry.get(gameType)
        if (!cfg) throw new Error(`Game "${gameType}" not registered`)

        const handler = async (m, { sock }) => {
            const chatId = m.chat

            if (hasActiveSession(chatId)) {
                const session = getSession(chatId)
                if (session && session.gameType === gameType) {
                    const remaining = getRemathisngTime(chatId)
                    const answer = session.question[cfg.answerField]
                    let text = `⚠️ *Eh there is a game on, answer first!*\n\n`
                    if (cfg.questionField && session.question[cfg.questionField]) {
                        text += `\`\`\`${session.question[cfg.questionField]}\`\`\`\n\n`
                    }
                    text += `💡 Hint: *${getHint(answer, cfg.hintCount)}*\n`
                    text += `⏱️ Sisa: *${formatRemathisngTime(remaining)}*\n\n`
                    text += `_Jawab directly or type "nyerah"\nEvery wrong, hint will beradd_`
                    await m.reply(text)
                    return
                }
            }

            const question = getRandomItem(cfg.dataFile)
            if (!question) {
                await m.reply('❌ *ᴅᴀᴛᴀ ᴛɪᴅᴀᴋ ᴛᴇʀsᴇᴅɪᴀ*\n\n> Data game no terseina!')
                return
            }

            const answer = question[cfg.answerField]
            let sentMsg

            if (cfg.hasImage && fetchBuffer) {
                let imageBuffer
                try {
                    imageBuffer = await fetchBuffer(question[cfg.imageField])
                } catch {
                    await m.reply('❌ *ɢᴀɢᴀʟ ᴍᴇᴍᴜᴀᴛ ɢᴀᴍʙᴀʀ*\n\n> Please try again later!')
                    return
                }

                let caption = `${cfg.emoji} *${cfg.title}*\n\n`
                if (cfg.questionField && question[cfg.questionField]) {
                    caption += `> ${question[cfg.questionField]}\n`
                }
                caption += `💡 Hint: *${getHint(answer, cfg.hintCount)}*\n`
                caption += `⏱️ Time: *${cfg.timeout / 1000} second*\n`
                caption += `🎁 Here is: *Limit, Coins, EXP (random)*\n\n`
                caption += `_Jawab directly or type "nyerah"\nEvery wrong, hint will beradd_`

                sentMsg = await sock.sendMessage(chatId, {
                    image: imageBuffer,
                    caption,
                    contextInfo: getGameContextInfo(`${cfg.emoji} ${cfg.title}`, 'Guess answerannya!')
                }, { quoted: m })
            } else {
                let text = `${cfg.emoji} *${cfg.title}*\n\n`
                if (cfg.questionField && question[cfg.questionField]) {
                    text += `\`\`\`${question[cfg.questionField]}\`\`\`\n\n`
                }
                text += `💡 Hint: *${getHint(answer, cfg.hintCount)}*\n`
                text += `⏱️ Time: *${cfg.timeout / 1000} second*\n`
                text += `🎁 Here is: *Limit, Coins, EXP (random)*\n\n`
                text += `_Jawab directly or type "nyerah"\nEvery wrong, hint will beradd_`

                sentMsg = await sock.sendMessage(chatId, {
                    text,
                    contextInfo: getGameContextInfo(`${cfg.emoji} ${cfg.title}`, 'Jawab question!')
                }, { quoted: m })
            }

            createSession(chatId, gameType, question, sentMsg.key, cfg.timeout)

            setSessionTimer(chatId, async () => {
                let text = `${pick(TIMEOUT_MESSAGES)}\n\n`
                text += `Answer: *${answer}*\n\n`
                text += `_Don't there is that can answer ~_`
                await m.reply(text)
            })
        }

        const answerHandler = async (m, sock) => {
            const chatId = m.chat
            const session = getSession(chatId)

            if (!session || session.gameType !== gameType) return false

            const userAnswer = (m.body || '').trim()
            if (!userAnswer || userAnswer.startsWith('.')) return false

            if (isSurrender(userAnswer)) {
                endSession(chatId)
                const answer = session.question[cfg.answerField]
                let text = `${pick(SURRENDER_MESSAGES)}\n\n`
                text += `Answer: *${answer}*\n\n`
                text += `_@${m.sender.split('@')[0]} give up_`
                await m.reply(text, { mentions: [m.sender] })
                return true
            }

            if (!isReplyToGame(m, session)) return false

            session.attempts++

            const answer = session.question[cfg.answerField]
            const result = checkAnswerAdvanced(answer, userAnswer)

            if (result.status === 'correct') {
                endSession(chatId)

                const db = getDatabase()
                const user = db.getUser(m.sender)

                const reward = getRandomReward()
                let totalLimit = reward.limit
                let totalBalance = reward.coins
                let totalExp = reward.exp
                let bonusText = ''

                const fastResult = checkFastAnswer(session)
                if (fastResult.isFast) {
                    totalLimit += fastResult.bonus.limit
                    totalBalance += fastResult.bonus.coins
                    totalExp += fastResult.bonus.exp
                    bonusText = `\n\n${fastResult.praise}\n⚡ *BONUS KILAT:* +${fastResult.bonus.limit} Limit, +${fastResult.bonus.coins} Coins\n⏱️ Time: *${(fastResult.elapsed / 1000).toFixed(1)}s*`
                }

                db.updateEnergy(m.sender, totalLimit)
                db.updateCoins(m.sender, totalBalance)

                if (!user.rpg) user.rpg = {}
                await addExpWithLevelCheck(sock, m, db, user, totalExp)
                db.save()

                let text = `${pick(WIN_MESSAGES)}\n\n`
                text += `Answer: *${answer}*\n`
                text += `Pemenang: *@${m.sender.split('@')[0]}*\n`
                text += `Pertryan: *${session.attempts}x*\n\n`
                text += `🎁 +${totalLimit} Limit, +${totalBalance} Coins, +${totalExp} EXP`
                text += bonusText

                await m.reply(text, { mentions: [m.sender] })
                return true
            }

            if (result.status === 'close') {
                const remaining = getRemathisngTime(chatId)
                const percent = Math.round(result.similarity * 100)
                await m.react('🔥')
                await m.reply(`🔥 *Hampir!* Answermu *${percent}%* mirip!\n_Sisa time: *${formatRemathisngTime(remaining)}*_`)
                return false
            }

            const remaining = getRemathisngTime(chatId)
            if (remaining > 0 && session.attempts < 10) {
                await m.react('❌')
                const hint = getProgressiveHint(answer, session.attempts)
                await m.reply(`❌ Not yet bener! Hint: *${hint}*\n_Sisa: *${formatRemathisngTime(remaining)}*_`)
            }

            return false
        }

        return { handler, answerHandler }
    }

    createPlugin(gameType, overrides = {}) {
        const cfg = this.registry.get(gameType)
        if (!cfg) throw new Error(`Game "${gameType}" not registered`)

        const { handler, answerHandler } = this.createHandler(gameType)

        return {
            config: {
                name: gameType,
                alias: cfg.alias,
                category: 'game',
                description: cfg.description,
                usage: `.${gameType}`,
                example: `.${gameType}`,
                isOwner: false,
                isPremium: false,
                isGroup: false,
                isPrivate: false,
                cooldown: cfg.cooldown,
                energy: 0,
                isEnabled: true,
                ...overrides
            },
            handler,
            answerHandler
        }
    }
}

const games = new frenzyGames()

games.register('asahotak',      { alias: ['asah', 'quiz'],                  emoji: '🧠', title: 'ASAH OTAK',       description: 'Brain teaser game - guess answeran' })
games.register('caklontong',    { alias: ['cak', 'lontong'],                emoji: '🤔', title: 'CAK LONTONG',     description: 'Quiz game - answeran small change' })
games.register('tekateki',      { alias: ['teka'],                          emoji: '🧩', title: 'TEKA-TEKI',       description: 'Game teka-teki trainsional' })
games.register('guesskata',     { alias: ['tk', 'guessword'],               emoji: '📝', title: 'TEBAK KATA',      description: 'Guess kata from petunjuk' })
games.register('guesstimesmat',  { alias: ['tkl', 'peribahasa'],             emoji: '📖', title: 'TEBAK KALIMAT',   description: 'Guess timesmat or peribahasa' })
games.register('guessfilm',     { alias: ['tf', 'guessmovie'],              emoji: '🎬', title: 'TEBAK FILM',      description: 'Guess judul film' })
games.register('guesslagu',     { alias: ['tl', 'guesssong'],               emoji: '🎵', title: 'TEBAK LAGU',      description: 'Guess judul lagu' })
games.register('guesslirik',    { alias: [],                                emoji: '🎤', title: 'TEBAK LIRIK',     description: 'Guess lirik lagu' })
games.register('guesshewan',    { alias: ['th', 'guessanimal'],             emoji: '🐾', title: 'TEBAK HEWAN',     description: 'Guess name hewan' })
games.register('guessnegara',   { alias: ['tn', 'guesscountry'],            emoji: '🌍', title: 'TEBAK NEGARA',    description: 'Guess name negara' })
games.register('guessprofesi',  { alias: ['tp', 'guessjob'],                emoji: '👨‍💼', title: 'TEBAK PROFESI',  description: 'Guess name profesi' })
games.register('guesslet me guess',  { alias: ['tbt', 'guess2an', 'small change'],      emoji: '😄', title: 'TEBAK-TEBAKAN',   description: 'Guess-let me guess small change' })
games.register('whoAmI',   { alias: ['who', 'whoami'],               emoji: '🎭', title: 'WHO AM I',    description: 'Guess from description' })
games.register('riddle',        { alias: ['rd', 'guessguess', 'riddles'],   emoji: '❓', title: 'RIDDLE',           description: 'Riddle/guess-let me guess' })
games.register('kataacak',      { alias: ['ka', 'acakkata'],                emoji: '🔤', title: 'KATA ACAK',        description: 'Susun huruf acak' })
games.register('susunkata',     { alias: ['susun', 'scramble'],             emoji: '🔠', title: 'SUSUN KATA',       description: 'Susun kata from huruf' })
games.register('guesskimia',    { alias: ['kimia', 'chemistry', 'unsur'],   emoji: '🧪', title: 'TEBAK KIMIA',     description: 'Guess unsur kimia', answerField: 'symbol' })

games.register('guessbendera',  { alias: ['tbendera', 'flag'],              emoji: '🏳️', title: 'TEBAK BENDERA',  description: 'Guess negara from bendera', dataFile: 'guessbendera2.json', answerField: 'name', hasImage: true })
games.register('guessimage',   { alias: ['tg', 'guessimage'],              emoji: '🖼️', title: 'TEBAK GAMBAR',   description: 'Guess kata from image', timeout: 90000, hasImage: true, questionField: null, hintCount: 3 })
games.register('tebatopep',     { alias: ['epep', 'freefire', 'ff'],        emoji: '🔫', title: 'TEBAK EPEP',      description: 'Guess karakter Free Fire', hasImage: true })
games.register('guessjkt48',    { alias: ['jkt48', 'jkt'],                  emoji: '🎀', title: 'TEBAK JKT48',     description: 'Guess member JKT48', hasImage: true })
games.register('guessdrakor',   { alias: ['drakor', 'kdrama'],              emoji: '🇰🇷', title: 'TEBAK DRAKOR',   description: 'Guess judul drama Korea', hasImage: true })
games.register('guesssomething',  { alias: ['something', 'food'],               emoji: '🍲', title: 'TEBAK MAKANAN',   description: 'Guess name something', hasImage: true })

module.exports = { frenzyGames, games }
