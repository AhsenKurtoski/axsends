// Logger minimale: livelli, timestamp e prefisso modulo.
// In sviluppo stampa tutto; in produzione stampa info/warn/error.

const LEVELS = { debug: 10, info: 20, warn: 30, error: 40 }
const isDev = process.env.NODE_ENV !== 'production'
const threshold = isDev ? LEVELS.debug : LEVELS.info

function write(level: keyof typeof LEVELS, module: string, message: string, extra?: unknown) {
  if (LEVELS[level] < threshold) return
  const time = new Date().toISOString()
  const line = time + ' [' + level.toUpperCase() + '] [' + module + '] ' + message
  if (level === 'error') {
    console.error(line, extra !== undefined ? extra : '')
  } else if (level === 'warn') {
    console.warn(line, extra !== undefined ? extra : '')
  } else {
    console.log(line, extra !== undefined ? extra : '')
  }
}

export function createLogger(module: string) {
  return {
    debug: (msg: string, extra?: unknown) => write('debug', module, msg, extra),
    info: (msg: string, extra?: unknown) => write('info', module, msg, extra),
    warn: (msg: string, extra?: unknown) => write('warn', module, msg, extra),
    error: (msg: string, extra?: unknown) => write('error', module, msg, extra),
  }
}

export type Logger = ReturnType<typeof createLogger>
