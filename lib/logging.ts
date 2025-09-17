import pino from 'pino'

export const logger = pino({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  transport: process.env.NODE_ENV === 'production' ? undefined : {
    target: 'pino-pretty',
    options: {
      colorize: true,
    },
  },
})

export function createCorrelationId(): string {
  return Math.random().toString(36).substring(2, 15)
}

export function withCorrelation(correlationId: string) {
  return logger.child({ correlationId })
}
