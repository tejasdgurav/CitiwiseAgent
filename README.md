# CitiWise AI Agent

CitiWise is an AI-driven real estate sales automation platform that streamlines the entire sales process from lead generation to deal closure. Built with Next.js 14, Prisma, Supabase, and OpenAI integration.

## Features

- **Lead Management**: Automated lead capture via WhatsApp, qualification, and nurturing
- **Deal Pages**: Personalized buyer deal pages with pricing, EMI calculator, and token payments
- **Task Planning**: AI-powered task generation and approval workflows
- **Dashboard**: Real-time cash flow tracking, task queue, and risk management
- **Agent Console**: Lead search, deal page creation, and pipeline management
- **Pricing Engine**: Deterministic pricing calculations with GST, stamp duty, and loan options
- **Payment Integration**: Token payments with webhook handling
- **WhatsApp Integration**: Automated messaging and lead capture

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, TailwindCSS, Radix UI
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: Supabase (PostgreSQL)
- **AI**: OpenAI GPT for task planning and content generation
- **Testing**: Vitest (unit tests), Playwright (E2E tests)
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- Supabase account and project
- OpenAI API key (optional for AI features)

### Installation

1. **Clone and install dependencies**:
```bash
git clone <repository-url>
cd citiwise
npm install
```

2. **Set up environment variables**:
```bash
cp .env.example .env.local
```

Edit `.env.local` with your configuration:

```env
# Database
DATABASE_URL="postgresql://username:password@host:port/database"

# NextAuth
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# Supabase
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# OpenAI (optional)
OPENAI_API_KEY="sk-your-openai-key"

# Providers (stub/production)
PAYMENTS_PROVIDER="stub"
WHATSAPP_PROVIDER="stub"

# Analytics (optional)
GA_MEASUREMENT_ID="G-XXXXXXXXXX"
```

3. **Set up the database**:
```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma db push

# Seed demo data
npx prisma db seed
```

4. **Start the development server**:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

### Database Setup

The application uses Supabase as the database. After creating a Supabase project:

1. Copy the database URL from your Supabase project settings
2. Update `DATABASE_URL` in your `.env.local`
3. Run `npx prisma db push` to create tables
4. Run `npx prisma db seed` to populate demo data

## Project Structure

```
citiwise/
├── app/                    # Next.js 14 app directory
│   ├── agent/             # Agent console pages
│   ├── api/               # API routes
│   ├── dashboard/         # Dashboard pages
│   └── deal/              # Deal pages
├── components/            # React components
│   ├── agent/            # Agent console components
│   ├── dashboard/        # Dashboard components
│   ├── deal/             # Deal page components
│   ├── layout/           # Layout components
│   ├── payments/         # Payment components
│   └── ui/               # Reusable UI components
├── lib/                   # Utilities and business logic
│   ├── adapters/         # External service adapters
│   ├── ai/               # AI integration
│   ├── pricing/          # Pricing engine
│   └── tasks/            # Task planning and approvals
├── prisma/               # Database schema and migrations
└── scripts/              # Utility scripts
```

## Key Modules

### Pricing Engine (`lib/pricing/`)
Pure functional pricing calculations including:
- Base price, PLC charges, floor rise
- Parking, GST, stamp duty
- Payment schedules and EMI options
- Complete pricing with loan calculations

### WhatsApp Integration (`lib/adapters/whatsapp/`)
- Stub adapter for development
- Template messaging
- Webhook handling for incoming messages
- Lead capture and contact creation

### Task Planning (`lib/tasks/`)
- Deterministic task generation based on cash targets
- Risk-based approval workflows
- Task execution and tracking

### Payment Processing (`lib/adapters/payments/`)
- Stub payment gateway for development
- Token payment flows
- Webhook handling for payment status

## API Endpoints

### Agent APIs
- `POST /api/agent/create-deal-page` - Create personalized deal pages
- `POST /api/agent/plan` - Run task planner
- `GET/POST /api/agent/approvals` - Manage approvals

### Payment APIs
- `POST /api/payments/create-token` - Create token payment
- `POST /api/webhooks/payments` - Payment status webhooks

### WhatsApp APIs
- `POST /api/webhooks/whatsapp` - Incoming message webhooks

## Testing

### Unit Tests
```bash
npm run test
```

### E2E Tests (Playwright)
```bash
npm run test:e2e
```

## Deployment

### Vercel (Recommended)
1. Connect your repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on git push

### Manual Deployment
```bash
npm run build
npm start
```

## Development Workflow

1. **Lead Capture**: WhatsApp messages create contacts and leads
2. **Qualification**: Agents review and qualify leads in the console
3. **Deal Creation**: Generate personalized deal pages for qualified leads
4. **Token Payment**: Buyers pay tokens through integrated payment gateway
5. **Task Planning**: AI generates follow-up tasks and approval workflows
6. **Dashboard Monitoring**: Track cash flow, tasks, and approvals

## Configuration

### Stub vs Production Mode

The application supports stub adapters for development:

- **WhatsApp Stub**: Simulates WhatsApp messaging without real API
- **Payment Stub**: Mock payment gateway for testing flows

Set `WHATSAPP_PROVIDER=stub` and `PAYMENTS_PROVIDER=stub` for development.

### Risk Levels

Tasks and approvals are categorized by risk:
- **LOW**: Auto-approved, minimal oversight
- **MEDIUM**: Requires manager approval
- **HIGH**: Requires senior approval with audit trail

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes with tests
4. Submit a pull request

## License

Private - All rights reserved
