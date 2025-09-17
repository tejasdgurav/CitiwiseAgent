import type { WhatsAppAdapter } from './types'
import { WhatsAppStubAdapter } from './stub'
import { MetaWhatsAppAdapter } from './meta'

export function getWhatsAppAdapter(): WhatsAppAdapter {
  const provider = (process.env.WHATSAPP_PROVIDER || 'stub').toLowerCase()
  switch (provider) {
    case 'meta':
      return new MetaWhatsAppAdapter()
    case 'stub':
    default:
      return new WhatsAppStubAdapter(process.env.NEXTAUTH_URL || 'http://localhost:3000')
  }
}
