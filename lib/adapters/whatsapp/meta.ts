import type { WhatsAppAdapter, WhatsAppMessage, WhatsAppWebhookNormalized } from './types'
import { logger } from '@/lib/logging'

// Minimal Meta WhatsApp adapter (skeleton). Actual sending would call Graph API.
export class MetaWhatsAppAdapter implements WhatsAppAdapter {
  private baseUrl: string
  private token: string | undefined
  private phoneId: string | undefined

  constructor() {
    this.baseUrl = 'https://graph.facebook.com/v19.0'
    this.token = process.env.META_WABA_TOKEN
    this.phoneId = process.env.META_WABA_PHONE_ID
  }

  async sendTemplate(message: WhatsAppMessage): Promise<{ messageId: string; status: string }> {
    // Placeholder implementation; in production call Meta Messages API
    logger.info('Meta WA: sendTemplate (placeholder)', { to: message.to, template: message.templateName })
    return { messageId: `meta_${Date.now()}`, status: 'queued' }
  }

  async sendMessage(to: string, body: string): Promise<{ messageId: string; status: string }> {
    // Placeholder implementation; in production call Meta Messages API
    logger.info('Meta WA: sendMessage (placeholder)', { to, body })
    return { messageId: `meta_${Date.now()}`, status: 'queued' }
  }

  async normalizeWebhook(request: Request): Promise<WhatsAppWebhookNormalized | null> {
    try {
      const payload = await request.json()
      // Try to map common fields from Meta webhook
      const entry = payload?.entry?.[0]
      const change = entry?.changes?.[0]
      const value = change?.value
      const messages = value?.messages
      const msg = messages?.[0]
      if (!msg) return null
      const from = msg.from
      const text = msg.text?.body || msg.button?.text || msg.interactive?.nfm_reply?.response_json || ''
      return {
        from,
        message: String(text || ''),
        timestamp: String(msg.timestamp || new Date().toISOString()),
        raw: payload,
      }
    } catch (e) {
      logger.error('Meta WA: normalizeWebhook failed', { error: e })
      return null
    }
  }
}
