// Controlli ripetibili sulle regole dei sottotitoli.
//
// Eseguono i moduli veri (compilati da tsconfig.checks.json) e bloccano il
// rilascio se una di queste regole si rompe:
//   1. nessuna riga supera SUBTITLE_LINE_CHARS caratteri;
//   2. il numero di righe non supera maxLines (default 2);
//   3. il testo del file SRT e le righe disegnate nel video sono identiche.
//
// Uso: npm run check:subtitles

const test = require('node:test')
const assert = require('node:assert/strict')

const {
  subtitleLines,
  subtitleBlock,
  cleanCaption,
  SUBTITLE_LINE_CHARS,
  SUBTITLE_MAX_LINES,
  SUBTITLE_MAX_CHARS,
} = require('../.checks-build/subtitles.js')
const { buildSubtitles, srtFromCues } = require('../.checks-build/adkit.js')
const { captionLines } = require('../.checks-build/adRender.js')

const CASES = [
  'Acquista ora',
  'Stanco del rumore che ti distrae?',
  'Stanco del rumore che ti distrae? Prova la cancellazione attiva.',
  'Materiale eco-friendly che asciuga in 30 secondi e offre un comfort davvero totale',
  'Concentrazione totale senza distrazioni. Comfort per ore e ore durante ogni allenamento e ogni sessione di studio',
  'Testo molto lungo che serve a verificare che il parametro maxLines venga davvero rispettato quando si chiedono quattro righe invece delle due predefinite.',
  'SupercalifragilistichespiralidosoPneumoUltraMicroscopicoSilicovulcanicoEsagerato',
  'Spazi    multipli     e     tabulazioni\tdentro lo stesso testo',
  'Corto, ma con punteggiatura!',
]

// Le righe del file SRT: indice, timing, poi il testo su una o piu' righe.
function parseSrt(srt) {
  return srt
    .trim()
    .split(/\r?\n\r?\n/)
    .filter(Boolean)
    .map((block) => {
      const lines = block.split(/\r?\n/)
      const timingIndex = lines.findIndex((line) => line.includes('-->'))
      assert.ok(timingIndex > 0, 'blocco SRT senza timing valido: ' + block)
      return {
        index: Number(lines[0]),
        text: lines.slice(timingIndex + 1),
      }
    })
}

test('nessuna riga supera il limite di caratteri', () => {
  const configs = [
    [SUBTITLE_LINE_CHARS, SUBTITLE_MAX_LINES],
    [SUBTITLE_LINE_CHARS, 1],
    [SUBTITLE_LINE_CHARS, 3],
    [SUBTITLE_LINE_CHARS, 4],
  ]
  for (const text of CASES) {
    for (const [maxChars, maxLines] of configs) {
      const lines = subtitleLines(text, maxChars, maxLines)
      for (const line of lines) {
        assert.ok(
          line.length <= maxChars,
          'riga di ' + line.length + ' caratteri (max ' + maxChars + '): ' + JSON.stringify(line)
        )
      }
    }
  }
})

test('il numero di righe rispetta maxLines', () => {
  for (const text of CASES) {
    for (const maxLines of [1, 2, 3, 4]) {
      const lines = subtitleLines(text, SUBTITLE_LINE_CHARS, maxLines)
      assert.ok(
        lines.length <= maxLines,
        JSON.stringify(text) + ' ha prodotto ' + lines.length + ' righe con maxLines=' + maxLines
      )
      assert.ok(lines.length >= 1, 'nessuna riga prodotta per ' + JSON.stringify(text))
    }
  }
})

test('maxLines oltre 2 viene davvero usato', () => {
  const long = CASES[4]
  const three = subtitleLines(long, SUBTITLE_LINE_CHARS, 3)
  const four = subtitleLines(long, SUBTITLE_LINE_CHARS, 4)
  assert.equal(three.length, 3, 'con maxLines=3 mi aspettavo 3 righe: ' + JSON.stringify(three))
  assert.ok(four.length >= 3, 'con maxLines=4 mi aspettavo almeno 3 righe')
  assert.ok(four.length <= 4)
})

test('un testo che entra su una riga non viene spezzato', () => {
  assert.deepEqual(subtitleLines('Acquista ora'), ['Acquista ora'])
  const short = 'Ecco il Tappetino Yoga.'
  assert.deepEqual(subtitleLines(short), [short])
})

test('gli spazi anomali vengono normalizzati senza perdere parole', () => {
  const messy = '  Luce    LED   regolabile   per ogni   attivita  '
  const lines = subtitleLines(messy)
  assert.deepEqual(lines.join(' '), cleanCaption(messy))
})

test('un testo che entra nella capacita non perde parole', () => {
  const capacity = SUBTITLE_LINE_CHARS * SUBTITLE_MAX_LINES
  for (const text of CASES) {
    const clean = cleanCaption(text)
    if (clean.length > capacity) continue // oltre la capacita: vedi test dedicato
    if (clean.split(' ').some((word) => word.length > SUBTITLE_LINE_CHARS)) continue // parola singola troppo lunga: vedi test dedicato
    const lines = subtitleLines(text)
    const joined = lines.join(' ')
    assert.equal(joined, clean, 'righe e testo originale devono coincidere')
    assert.ok(lines.length <= SUBTITLE_MAX_LINES)
    for (const line of lines) assert.ok(line.length <= SUBTITLE_LINE_CHARS)
  }
})

test('una parola piu lunga del limite viene chiusa con …', () => {
  const word = CASES[6]
  assert.ok(word.length > SUBTITLE_LINE_CHARS)
  const lines = subtitleLines(word)
  assert.equal(lines.length, 1, 'una parola sola resta su una riga: ' + JSON.stringify(lines))
  assert.ok(lines[0].length <= SUBTITLE_LINE_CHARS)
  assert.ok(lines[0].endsWith('\u2026'))
})

test('un testo oltre la capacita viene chiuso con … invece di sbordare', () => {
  const capacity = SUBTITLE_LINE_CHARS * SUBTITLE_MAX_LINES
  const tooLong = cleanCaption(CASES[4])
  assert.ok(tooLong.length > capacity, 'il caso di prova deve superare la capacita')

  const lines = subtitleLines(tooLong)
  assert.equal(lines.length, SUBTITLE_MAX_LINES)
  for (const line of lines) assert.ok(line.length <= SUBTITLE_LINE_CHARS)
  assert.ok(lines[lines.length - 1].endsWith('\u2026'), 'manca il segnale di troncamento: ' + JSON.stringify(lines))

  // Con spazio a sufficienza lo stesso testo entra intero, senza troncamenti.
  const roomy = subtitleLines(tooLong, SUBTITLE_LINE_CHARS, 4)
  for (const line of roomy) assert.ok(line.length <= SUBTITLE_LINE_CHARS)
  assert.ok(!roomy.some((line) => line.endsWith('\u2026')), 'troncato senza motivo: ' + JSON.stringify(roomy))
  assert.equal(roomy.join(' '), tooLong)
})

test('subtitleBlock corrisponde alle righe mostrate', () => {
  for (const text of CASES) {
    assert.equal(subtitleBlock(text), subtitleLines(text).join('\n'))
  }
})

test('il testo SRT e identico alle righe disegnate nel video', () => {
  const storyboard = [
    { time: '0-5s', visual: 'a', voiceover: 'Questo e un voiceover decisamente lungo che dovrebbe essere spezzato in piu cue leggibili dal sistema automatico dei sottotitoli.', text: '' },
    { time: '5-10s', visual: 'b', voiceover: 'Corto.', text: '' },
    { time: '10-16s', visual: 'c', voiceover: 'Materiale eco-friendly che asciuga in 30 secondi e offre un comfort davvero totale', text: '' },
    { time: '16-20s', visual: 'd', voiceover: '', text: 'Acquista ora' },
  ]
  const subtitles = buildSubtitles(storyboard)
  assert.ok(subtitles.cues.length >= 4, 'mi aspettavo almeno 4 cue')

  const blocks = parseSrt(subtitles.srt)
  assert.equal(blocks.length, subtitles.cues.length, 'numero di blocchi SRT diverso dai cue')

  subtitles.cues.forEach((cue, i) => {
    // Il video disegna captionLines(): stesso numero di righe e stesso testo.
    // Il maiuscolo e solo stile del video, quindi il confronto ignora il caso.
    const video = captionLines(cue.text)
    assert.equal(blocks[i].text.length, video.length, 'cue ' + (i + 1) + ': numero di righe diverso')
    assert.deepEqual(
      blocks[i].text.map((line) => line.toLowerCase()),
      video.map((line) => line.toLowerCase()),
      'cue ' + (i + 1) + ' diverge tra SRT e video'
    )
    assert.equal(blocks[i].index, cue.index)
  })
})

test('ogni cue generato entra nelle righe disponibili', () => {
  const storyboard = CASES.map((voiceover, i) => ({
    time: i * 4 + '-' + (i + 1) * 4 + 's',
    visual: 'scena ' + i,
    voiceover,
    text: '',
  }))
  const subtitles = buildSubtitles(storyboard)
  for (const cue of subtitles.cues) {
    assert.ok(
      cue.text.length <= SUBTITLE_MAX_CHARS,
      'cue di ' + cue.text.length + ' caratteri (max ' + SUBTITLE_MAX_CHARS + '): ' + JSON.stringify(cue.text)
    )
    const lines = subtitleLines(cue.text)
    assert.ok(lines.length <= SUBTITLE_MAX_LINES)
    for (const line of lines) assert.ok(line.length <= SUBTITLE_LINE_CHARS)
  }
  // e il file generato resta coerente
  assert.equal(parseSrt(srtFromCues(subtitles.cues)).length, subtitles.cues.length)
})

test('testo vuoto non produce righe', () => {
  assert.deepEqual(subtitleLines(''), [])
  assert.deepEqual(subtitleLines('   '), [])
  assert.deepEqual(captionLines(''), [])
})
