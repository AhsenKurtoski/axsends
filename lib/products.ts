// Modello prodotto condiviso e motore di punteggio. Nessun dato demo.

export type BaseProduct = {
  id: string
  name: string
  image: string
  cost: number
  category: string
  popularity: number
}

// Margine basso: ricarico del +25% sul costo (profitto reale 15-30%).
// Cosi i prezzi restano competitivi e si vende di piu.
export const MARKUP = 1.25

export function scoreProduct(cost: number, popularity: number): { score: number; label: string } {
  const suggested = cost * MARKUP
  const marginPct = suggested > 0 ? ((suggested - cost) / suggested) * 100 : 0
  // Con margine basso pesiamo di piu domanda e fascia di prezzo.
  const marginScore = Math.min(30, marginPct * 1.4)
  let priceScore = 8
  if (suggested >= 12 && suggested <= 45) priceScore = 35
  else if (suggested >= 6 && suggested < 12) priceScore = 24
  else if (suggested > 45 && suggested <= 80) priceScore = 18
  const popScore = Math.min(35, Math.log10(popularity + 1) * 14)
  const total = Math.round(Math.max(0, Math.min(100, marginScore + priceScore + popScore)))
  let label = 'Da valutare'
  if (total >= 75) label = 'Winning 🔥'
  else if (total >= 55) label = 'Buon potenziale'
  else if (total >= 35) label = 'Medio'
  return { score: total, label }
}
