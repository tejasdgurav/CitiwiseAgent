import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logging'
import { prisma } from '@/lib/db'
import { WhatsAppWebhookPayload } from '@/lib/adapters/whatsapp/stub'

export async function POST(request: NextRequest) {
  try {
    const payload: WhatsAppWebhookPayload = await request.json()
    
    logger.info('WhatsApp webhook received', { payload })

    // Process incoming message
    await processIncomingMessage(payload)

    return NextResponse.json({ status: 'success' })
  } catch (error) {
    logger.error('WhatsApp webhook error', { error })
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

async function processIncomingMessage(payload: WhatsAppWebhookPayload) {
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
