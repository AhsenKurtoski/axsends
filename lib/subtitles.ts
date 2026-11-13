// Formattazione unica dei sottotitoli.
//
// Questa e' l'unica funzione che decide come una caption va a capo: la usano il
// file .srt/.vtt, l'anteprima in pagina e il video esportato, cosi le tre cose
// mostrano esattamente le stesse righe.
//
// Garanzie:
//  - nessuna riga supera maxChars caratteri (se il testo non entra, l'ultima
//    riga viene chiusa con "…" invece di sbordare fuori video);
//  - il numero di righe non supera maxLines;
//  - le righe sono bilanciate (minima "raggedness"), senza spezzare parole.

export const SUBTITLE_LINE_CHARS = 42
export const SUBTITLE_MAX_LINES = 2
// Una caption intera non supera le righe disponibili: e' il limite usato anche
// quando si dividono i voiceover in cue.
export const SUBTITLE_MAX_CHARS = SUBTITLE_LINE_CHARS * SUBTITLE_MAX_LINES

const ELLIPSIS = '\u2026'

export function cleanCaption(text: string): string {
  return String(text || '').replace(/\s+/g, ' ').trim()
}

// Chiude una riga troppo lunga all'ultimo spazio utile, senza superare maxChars.
function clampLine(line: string, maxChars: number): string {
  const clean = cleanCaption(line)
  if (clean.length <= maxChars) return clean
  const hardLimit = Math.max(1, maxChars - ELLIPSIS.length)
  const head = clean.slice(0, hardLimit)
  const lastSpace = head.lastIndexOf(' ')
  const cut = lastSpace > hardLimit * 0.5 ? head.slice(0, lastSpace) : head
  return cut.trimEnd() + ELLIPSIS
}

// Divide le parole in `count` righe minimizzando lo sbilanciamento, rispettando
// maxChars per riga. Ritorna null se non esiste una divisione valida.
function balancedSplit(words: string[], count: number, maxChars: number): string[] | null {
  const total = words.length
  if (count < 1 || count > total) return null

  const prefix: number[] = [0]
  for (const word of words) prefix.push(prefix[prefix.length - 1] + word.length)
  // lunghezza della riga che contiene le parole [from, to)
  const lineLength = (from: number, to: number) => prefix[to] - prefix[from] + (to - from - 1)

  const INF = Number.POSITIVE_INFINITY
  const cost: number[][] = []
  const cut: number[][] = []
  for (let line = 0; line <= count; line += 1) {
    cost.push(new Array(total + 1).fill(INF))
    cut.push(new Array(total + 1).fill(-1))
  }
  cost[0][0] = 0

  for (let line = 1; line <= count; line += 1) {
    for (let to = 1; to <= total; to += 1) {
      for (let from = 0; from < to; from += 1) {
        if (cost[line - 1][from] === INF) continue
        const length = lineLength(from, to)
        if (length > maxChars) continue
        const slack = maxChars - length
        const candidate = cost[line - 1][from] + slack * slack
        if (candidate < cost[line][to]) {
          cost[line][to] = candidate
          cut[line][to] = from
        }
      }
    }
  }

  if (cost[count][total] === INF) return null

  const lines: string[] = []
  let to = total
  for (let line = count; line >= 1; line -= 1) {
    const from = cut[line][to]
    lines.unshift(words.slice(from, to).join(' '))
    to = from
  }
  return lines
}

// Ultima risorsa: riempie le righe fino al limite e chiude l'ultima con "…".
function hardWrap(text: string, maxChars: number, maxLines: number): string[] {
  const words = cleanCaption(text).split(' ')
  const lines: string[] = []
  let current = ''

  for (let i = 0; i < words.length; i += 1) {
    const word = words[i]
    const candidate = current ? current + ' ' + word : word
    if (candidate.length <= maxChars) {
      current = candidate
      continue
    }
    if (lines.length === maxLines - 1) {
      // Ultima riga disponibile: ci va tutto il resto, chiuso con "…".
      current = (current ? current + ' ' : '') + words.slice(i).join(' ')
      break
    }
    if (current) {
      lines.push(current)
      current = ''
      i -= 1
      continue
    }
    // Parola singola piu' lunga del limite: la taglio da sola.
    lines.push(word)
  }
  if (current) lines.push(current)

  return lines.slice(0, maxLines).map((line) => clampLine(line, maxChars))
}

// Divide una caption nelle righe da mostrare.
export function subtitleLines(
  text: string,
  maxChars = SUBTITLE_LINE_CHARS,
  maxLines = SUBTITLE_MAX_LINES
): string[] {
  const clean = cleanCaption(text)
  if (!clean) return []

  const lineChars = Math.max(8, Math.floor(maxChars))
  const allowed = Math.max(1, Math.min(6, Math.floor(maxLines) || 1))

  if (allowed === 1) return [clampLine(clean, lineChars)]
  if (clean.length <= lineChars) return [clean]

  const words = clean.split(' ').filter(Boolean)
  if (words.length === 1) return [clampLine(clean, lineChars)]

  // Provo il minor numero di righe possibile, dalla piu' compatta in su:
  // una caption di 60 caratteri resta su due righe, una di 120 ne usa tre
  // solo se l'utente ha chiesto piu' di due righe.
  const maxUseful = Math.min(allowed, words.length)
  for (let count = 2; count <= maxUseful; count += 1) {
    const split = balancedSplit(words, count, lineChars)
    if (split) return split
  }

  return hardWrap(clean, lineChars, allowed)
}

// Testo pronto per SRT/VTT: le righe sono quelle mostrate a schermo.
export function subtitleBlock(text: string): string {
  return subtitleLines(text).join('\n')
}
