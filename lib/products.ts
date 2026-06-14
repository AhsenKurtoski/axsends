// Modello prodotto condiviso e motore di punteggio. Nessun dato demo.

export type BaseProduct = {
  id: string
  name: string
  image: string
  cost: number
  category: string
  popularity: number
}

export const MARKUP = 2.8

export function scoreProduct(cost: number, popularity: number): { score: number; label: string } {
  const suggested = cost * MARKUP
  const profit = suggested - cost
  const marginScore = Math.min(40, profit / 1.5)
  let priceScore = 6
  if (suggested >= 15 && suggested <= 60) priceScore = 30
  else if (suggested >= 8 && suggested < 15) priceScore = 18
  else if (suggested > 60 && suggested <= 90) priceScore = 15
  const popScore = Math.min(30, Math.log10(popularity + 1) * 12)
  const total = Math.round(Math.max(0, Math.min(100, marginScore + priceScore + popScore)))
  let label = 'Da valutare'
  if (total >= 75) label = 'Winning 🔥'
  else if (total >= 55) label = 'Buon potenziale'
  else if (total >= 35) label = 'Medio'
  return { score: total, label }
}
