#!/usr/bin/env tsx

import { WhatsAppStubAdapter } from '@/lib/adapters/whatsapp/stub'

const adapter = new WhatsAppStubAdapter()

async function simulateIncomingMessages() {
  const webhookUrl = 'http://localhost:3000/api/webhooks/whatsapp'
  
  const testMessages = [
    {
      from: '+919876543210',
      message: 'Hi, I am interested in your properties',
    },
    {
      from: '+919876543211', 
      message: 'Do you have any 2BHK flats available?',
    },
    {
      from: '+919876543212',
      message: 'What are the prices for 3BHK units?',
    },
    {
      from: '+919876543210',
      message: 'Can I schedule a site visit?',
    },
  ]

  console.log('🚀 Starting WhatsApp webhook simulation...')
  console.log(`📡 Webhook URL: ${webhookUrl}`)
  console.log('📱 Simulating incoming messages...\n')

  for (const testMessage of testMessages) {
    const payload = adapter.generateIncomingMessage(testMessage.from, testMessage.message)
    
    console.log(`📨 Sending message from ${testMessage.from}:`)
    console.log(`   "${testMessage.message}"`)
    
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        console.log('   ✅ Webhook processed successfully')
      } else {
        console.log(`   ❌ Webhook failed: ${response.status}`)
      }
    } catch (error) {
      console.log(`   ❌ Network error: ${error}`)
    }
    
    console.log('')
    
    // Wait 1 second between messages
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  console.log('✨ Simulation complete!')
}

async function simulateOutgoingMessages() {
  console.log('📤 Testing outgoing message templates...\n')

  // Test template message
  const templateResult = await adapter.sendTemplate({
    to: '+919876543210',
    templateName: 'deal_page_share',
    templateParams: {
      customer_name: 'Rahul',
      deal_link: 'https://citiwise.com/deal/abc123',
      expiry_date: '2024-01-15',
    },
  })

  console.log('📋 Template message result:', templateResult)

  // Test regular message
  const messageResult = await adapter.sendMessage(
    '+919876543210',
    'Thank you for your interest! Our sales team will contact you shortly.'
  )

  console.log('💬 Regular message result:', messageResult)
}

async function main() {
  const command = process.argv[2]

  switch (command) {
    case 'incoming':
      await simulateIncomingMessages()
      break
    case 'outgoing':
      await simulateOutgoingMessages()
      break
    case 'all':
      await simulateOutgoingMessages()
      console.log('\n' + '='.repeat(50) + '\n')
      await simulateIncomingMessages()
      break
    default:
      console.log('Usage: tsx scripts/whatsapp-sim.ts [incoming|outgoing|all]')
      console.log('')
      console.log('Commands:')
      console.log('  incoming  - Simulate incoming webhook messages')
      console.log('  outgoing  - Test outgoing message sending')
      console.log('  all       - Run both tests')
      process.exit(1)
  }
}

if (require.main === module) {
  main().catch(console.error)
}
