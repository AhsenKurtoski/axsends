// Modello prodotto condiviso, motore di punteggio e dataset demo.

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

export const demoProducts: BaseProduct[] = [
  { id: 'd1', name: 'Anello smart per il monitoraggio del sonno', image: '💍', cost: 11.2, category: 'Wearable', popularity: 8400 },
  { id: 'd2', name: 'Massaggiatore cervicale EMS', image: '💆', cost: 7.9, category: 'Benessere', popularity: 15200 },
  { id: 'd3', name: 'Mini aspirapolvere portatile USB', image: '🧹', cost: 9.1, category: 'Casa', popularity: 22000 },
  { id: 'd4', name: 'Proiettore galassia LED', image: '🌌', cost: 8.7, category: 'Casa', popularity: 31000 },
  { id: 'd5', name: 'Spazzola lisciante ionica', image: '💇', cost: 12.5, category: 'Beauty', popularity: 9800 },
  { id: 'd6', name: 'Supporto laptop pieghevole in alluminio', image: '💻', cost: 5.6, category: 'Ufficio', popularity: 4300 },
  { id: 'd7', name: 'Collare GPS per animali', image: '🐾', cost: 14.2, category: 'Pet', popularity: 5400 },
  { id: 'd8', name: 'Borraccia termica smart con display', image: '🍶', cost: 6.4, category: 'Lifestyle', popularity: 6100 },
  { id: 'd9', name: 'Luce LED da cucina ricaricabile', image: '💡', cost: 4.8, category: 'Casa', popularity: 12500 },
  { id: 'd10', name: 'Organizer cavi magnetico da scrivania', image: '🔌', cost: 3.9, category: 'Ufficio', popularity: 7700 },
  { id: 'd11', name: 'Tappetino yoga antiscivolo premium', image: '🧘', cost: 13.4, category: 'Fitness', popularity: 18900 },
  { id: 'd12', name: 'Custodia AirPods di design', image: '🎧', cost: 4.2, category: 'Accessori', popularity: 26000 },
]
