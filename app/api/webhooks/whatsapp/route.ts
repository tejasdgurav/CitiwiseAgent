import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logging'
import { prisma } from '@/lib/db'
import { rateLimit } from '@/lib/rateLimit'
import { getWhatsAppAdapter } from '@/lib/adapters/whatsapp'

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    const key = `rl:whatsapp:${ip}`
    const { allowed } = rateLimit({ key, windowMs: 10_000, max: 30 })
    if (!allowed) {
      return NextResponse.json({ error: 'Too Many Requests' }, { status: 429 })
    }

    const adapter = getWhatsAppAdapter()
    const normalized = await adapter.normalizeWebhook(request)
    if (!normalized) {
      return NextResponse.json({ error: 'Invalid webhook payload' }, { status: 400 })
    }
    logger.info('WhatsApp webhook received (normalized)', { normalized })

    // Process incoming message
    await processIncomingMessage(normalized)

    return NextResponse.json({ status: 'success' })
  } catch (error) {
    logger.error('WhatsApp webhook error', { error })
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

async function processIncomingMessage(payload: { from: string; message: string; timestamp: string }) {
  const { from, message, timestamp } = payload

  // Find or create contact
  let contact = await prisma.contact.findUnique({
    where: { phone: from }
  })

  if (!contact) {
    contact = await prisma.contact.create({
      data: {
        phone: from,
        name: null, // Will be updated when we get more info
      }
    })
    
    logger.info('New contact created from WhatsApp', { contactId: contact.id, phone: from })
  }

  // Simple message processing logic
  const lowerMessage = message.toLowerCase()
  
  if (lowerMessage.includes('interested') || lowerMessage.includes('property') || lowerMessage.includes('flat')) {
    // Create a lead if one doesn't exist
    const existingLead = await prisma.lead.findFirst({
      where: {
        contactId: contact.id,
        status: { in: ['NEW', 'QUALIFIED', 'INTERESTED'] }
      }
    })

    if (!existingLead) {
      // Get the first available project for demo
      const project = await prisma.project.findFirst()
      
      if (project) {
        await prisma.lead.create({
          data: {
            contactId: contact.id,
            projectId: project.id,
            source: 'WHATSAPP',
            status: 'NEW',
            notes: `Initial message: ${message}`,
          }
        })
        
        logger.info('New lead created from WhatsApp message', { 
          contactId: contact.id, 
          projectId: project.id 
        })
      }
    }
  }

  // Log the event for analytics
  await prisma.event.create({
    data: {
      name: 'whatsapp_message_received',
      payload: {
        from,
        message,
        timestamp,
        contactId: contact.id,
      }
    }
  })
}
