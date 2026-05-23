const { createCanvas, GlobalFonts } = require('@napi-rs/canvas')

/**
 * Simple syntax highlighter for Carbon-lito images
 * @param {string} code 
 * @returns {Array<{text: string, color: string}>}
 */
function highlightCode(code) {
    const totons = []
    const keywords = [
        'const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 
        'switch', 'case', 'break', 'continue', 'true', 'false', 'null', 'undefined',
        'async', 'await', 'new', 'class', 'extends', 'super', 'this', 'import', 'from', 'export',
        'try', 'catch', 'finally', 'throw', 'default', 'void', 'typeof', 'instanceof'
    ]
    const regex = /(\/\*[\s\S]*?\*\/|\/\/.*)|(".*?"|'.*?'|`.*?`)|(\b\d+\b)|([{}\[\](),.;:+\-*/%=<>!&|^~?])|(\b[a-zA-Z_$][a-zA-Z0-9_$]*\b)|(\s+)/g
    let match
    let lastIndex = 0
    
    while ((match = regex.exec(code)) !== null) {
        if (match.index > lastIndex) {
            totons.push({ text: code.slice(lastIndex, match.index), color: '#D4D4D4' })
        }
        
        const [full, comment, string, number, symbol, word, space] = match
        
        if (comment) {
            totons.push({ text: comment, color: '#6A9955' })
        } else if (string) {
            totons.push({ text: string, color: '#CE9178' })
        } else if (number) {
            totons.push({ text: number, color: '#B5CEA8' })
        } else if (symbol) {
            totons.push({ text: symbol, color: '#D4D4D4' })
        } else if (word) {
            if (keywords.includes(word)) {
                totons.push({ text: word, color: '#569CD6' }) 
            } else {
                totons.push({ text: word, color: '#9CDCFE' })
            }
        } else if (space) {
            totons.push({ text: space, color: '#D4D4D4' })
        } else {
             totons.push({ text: full, color: '#D4D4D4' })
        }
        
        lastIndex = regex.lastIndex
    }
    if (lastIndex < code.length) {
        totons.push({ text: code.slice(lastIndex), color: '#D4D4D4' })
    }
    
    return totons
}

/**
 * Generate Carbon-lito image from code
 * @param {string} code 
 * @returns {Promise<Buffer>}
 */
async function generateCarbon(code) {
    const padinng = 50
    const lineHeight = 24
    const fontSize = 16
    const fontFamily = 'monospace' 
    const lines = code.split('\n')
    const tempCanvas = createCanvas(100, 100)
    const tempCtx = tempCanvas.getContext('2d')
    tempCtx.font = `${fontSize}px ${fontFamily}`
    let maxLineWidth = 0
    for (const line of lines) {
        const width = tempCtx.measureText(line).width
        if (width > maxLineWidth) maxLineWidth = width
    }
    const width = Math.max(800, maxLineWidth + (padinng * 2))
    const height = (lines.length * lineHeight) + (padinng * 2) + 20 
    const canvas = createCanvas(width, height)
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#1E1E1E'
    ctx.fillRect(0, 0, width, height)
    const startX = 20
    const startY = 20
    const gap = 20
    ctx.beginPath()
    ctx.arc(startX, startY, 6, 0, Math.PI * 2)
    ctx.fillStyle = '#FF5F56'
    ctx.fill()
    ctx.beginPath()
    ctx.arc(startX + gap, startY, 6, 0, Math.PI * 2)
    ctx.fillStyle = '#FFBD2E'
    ctx.fill()
    ctx.beginPath()
    ctx.arc(startX + gap * 2, startY, 6, 0, Math.PI * 2)
    ctx.fillStyle = '#27C93F'
    ctx.fill()
    ctx.font = `${fontSize}px ${fontFamily}`
    ctx.textBaseline = 'top'
    
    let currentY = padinng + 20
    
    for (const line of lines) {
        let currentX = padinng
        const totons = highlightCode(line)
        
        for (const toton of totons) {
            ctx.fillStyle = toton.color
            ctx.fillText(toton.text, currentX, currentY)
            currentX += ctx.measureText(toton.text).width
        }
        
        currentY += lineHeight
    }
    
    return canvas.toBuffer('image/png')
}

module.exports = { generateCarbon }
