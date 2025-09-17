export interface WhatsAppMessage {
  to: string
  templateName: string
  templateParams?: Record<string, string>
  body?: string
}

export interface WhatsAppWebhookNormalized {
  from: string
  message: string
  timestamp: string
  raw?: any
}

export interface WhatsAppAdapter {
  sendTemplate(message: WhatsAppMessage): Promise<{ messageId: string; status: string }>
  sendMessage(to: string, body: string): Promise<{ messageId: string; status: string }>
  normalizeWebhook(request: Request): Promise<WhatsAppWebhookNormalized | null>
}
