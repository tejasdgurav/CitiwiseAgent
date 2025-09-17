import { logger } from '@/lib/logging'

export interface WhatsAppMessage {
  to: string
  templateName: string
  templateParams?: Record<string, string>
  body?: string
}

export interface WhatsAppWebhookPayload {
  from: string
  to: string
  message: string
  timestamp: string
  messageId: string
}

export class WhatsAppStubAdapter {
  private baseUrl: string

  constructor(baseUrl: string = 'http://localhost:3000') {
    this.baseUrl = baseUrl
  }

  async sendTemplate(message: WhatsAppMessage): Promise<{ messageId: string; status: string }> {
    logger.info('WhatsApp Stub: Sending template message', { message })
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 100))
    
    const messageId = `wa_${Date.now()}_${Math.random().toString(36).substring(7)}`
    
    // In stub mode, we just log the message
    logger.info('WhatsApp Template Sent', {
      messageId,
      to: message.to,
      template: message.templateName,
      params: message.templateParams,
    })

    return {
      messageId,
      status: 'sent',
    }
  }

  async sendMessage(to: string, body: string): Promise<{ messageId: string; status: string }> {
    logger.info('WhatsApp Stub: Sending message', { to, body })
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 100))
    
    const messageId = `wa_${Date.now()}_${Math.random().toString(36).substring(7)}`
    
    logger.info('WhatsApp Message Sent', {
      messageId,
      to,
      body,
    })

    return {
      messageId,
      status: 'sent',
    }
  }

  // Simulate incoming webhook payload for testing
  generateIncomingMessage(from: string, message: string): WhatsAppWebhookPayload {
    return {
      from,
      to: 'business_number',
      message,
      timestamp: new Date().toISOString(),
      messageId: `wa_in_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    }
  }
}

// Template definitions for common messages
export const WhatsAppTemplates = {
  DEAL_PAGE_SHARE: {
    name: 'deal_page_share',
    params: ['customer_name', 'deal_link', 'expiry_date'],
  },
  PAYMENT_REMINDER: {
    name: 'payment_reminder',
    params: ['customer_name', 'amount', 'due_date'],
  },
  SITE_VISIT_CONFIRMATION: {
    name: 'site_visit_confirmation',
    params: ['customer_name', 'date', 'time', 'location'],
  },
  DOCUMENT_REQUEST: {
    name: 'document_request',
    params: ['customer_name', 'document_list'],
  },
  OFFER_NOTIFICATION: {
    name: 'offer_notification',
    params: ['customer_name', 'unit_details', 'offer_amount'],
  },
} as const
