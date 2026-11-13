// Controlli sulla catena dei provider voce.
// Non fanno chiamate di rete: verificano solo come viene scelto il provider,
// cosi se domani cambiando configurazione la catena si rompe te ne accorgi qui.
//
// Uso: npm run check

const test = require('node:test')
const assert = require('node:assert/strict')

const {
  ttsProviderOrder,
  ttsProviders,
  ttsStatus,
  isTtsProviderId,
  synthesizeSpeech,
} = require('../.checks-build/tts.js')

test('senza chiavi resta Google come rete di sicurezza', () => {
  assert.deepEqual(ttsProviderOrder({}), ['google'])
})

test('un provider configurato passa avanti a Google', () => {
  assert.deepEqual(ttsProviderOrder({ OPENAI_API_KEY: 'k' }), ['openai', 'google'])
  assert.deepEqual(ttsProviderOrder({ ELEVENLABS_API_KEY: 'k' }), ['elevenlabs', 'google'])
  assert.deepEqual(ttsProviderOrder({ TTS_CUSTOM_URL: 'https://example.com/tts?t={text}' }), ['custom', 'google'])
})

test('con piu provider l ordine e stabile e Google resta ultimo', () => {
  const env = { TTS_CUSTOM_URL: 'https://example.com/?t={text}', ELEVENLABS_API_KEY: 'k', OPENAI_API_KEY: 'k' }
  assert.deepEqual(ttsProviderOrder(env), ['custom', 'elevenlabs', 'openai', 'google'])
})

test('TTS_PROVIDER forza il primo provider della catena', () => {
  const env = { TTS_PROVIDER: 'elevenlabs', ELEVENLABS_API_KEY: 'k', OPENAI_API_KEY: 'k' }
  assert.deepEqual(ttsProviderOrder(env), ['elevenlabs', 'openai', 'google'])
})

test('provider forzato senza chiave resta in testa e poi si ripiega', () => {
  const order = ttsProviderOrder({ TTS_PROVIDER: 'openai', ELEVENLABS_API_KEY: 'k' })
  assert.equal(order[0], 'openai')
  assert.ok(order.includes('elevenlabs'))
  assert.ok(order.includes('google'))
})

test('TTS_FALLBACK=0 usa solo il provider scelto', () => {
  assert.deepEqual(ttsProviderOrder({ TTS_PROVIDER: 'openai', TTS_FALLBACK: '0', OPENAI_API_KEY: 'k' }), ['openai'])
})

test('un TTS_PROVIDER sconosciuto torna alla modalita auto', () => {
  assert.deepEqual(ttsProviderOrder({ TTS_PROVIDER: 'pippo', OPENAI_API_KEY: 'k' }), ['openai', 'google'])
})

test('i metadati dei provider dicono quale e configurato', () => {
  const providers = ttsProviders({ OPENAI_API_KEY: 'k' })
  const openai = providers.find((p) => p.id === 'openai')
  const eleven = providers.find((p) => p.id === 'elevenlabs')
  const google = providers.find((p) => p.id === 'google')
  assert.equal(openai.configured, true)
  assert.equal(eleven.configured, false)
  assert.equal(google.configured, true)
  assert.ok(google.label.includes('Google'))
})

test('lo stato riporta catena, provider scelto e lingua', () => {
  const status = ttsStatus({ TTS_LANG: 'en' })
  assert.equal(status.lang, 'en')
  assert.equal(status.willUse, 'google')
  assert.deepEqual(status.chain, ['google'])
  assert.equal(status.requested, 'auto')
})

test('solo gli id previsti sono validi', () => {
  for (const id of ['google', 'elevenlabs', 'openai', 'custom']) assert.equal(isTtsProviderId(id), true)
  assert.equal(isTtsProviderId('altro'), false)
})

test('senza provider utilizzabile l errore e esplicito (nessuna rete)', async () => {
  const outcome = await synthesizeSpeech('ciao', 'it', { TTS_PROVIDER: 'openai', TTS_FALLBACK: '0' })
  assert.equal(outcome.ok, false)
  assert.ok(outcome.error.includes('OpenAI'), 'errore inatteso: ' + outcome.error)
})
