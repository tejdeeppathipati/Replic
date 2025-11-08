# ProdigyPM - AI Product Management Copilot

An AI-powered product management copilot that automatically joins meetings, builds client memory, and transforms discussions into Jira stories and Slack updates.

## Features

### Landing Page
- Hero section with animated text and smooth transitions
- How It Works section explaining the 3-step process
- Integrations showcase (Zoom, Google Meet, Jira, Slack, ElevenLabs, Dedalus Labs)
- Testimonials from product teams
- Early access signup form
- Professional footer with links and social media

### Dashboard
- Left sidebar navigation with quick access to all sections
- Top navbar with search and notifications
- Quick Actions for common tasks
- Meeting feed showing recent meetings with status
- Insights sidebar with key metrics and memory snapshot

### Tool Connectors Page
- Integration grid showing all available tools
- Connection status for each integration
- Integration stats and quick setup guide
- Manage and connect buttons for each tool

## Tech Stack

- Next.js 16 with App Router
- TypeScript
- Tailwind CSS v4
- shadcn/ui components
- Framer Motion for animations
- Lucide React for icons

## Getting Started

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. Navigate to the project directory:
```bash
cd prodigypm
```

2. Install dependencies (already done):
```bash
npm install
```

### Development

Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the landing page.

Visit [http://localhost:3000/dashboard](http://localhost:3000/dashboard) to see the dashboard.

Visit [http://localhost:3000/dashboard/integrations](http://localhost:3000/dashboard/integrations) to see the integrations page.

### Build

Build for production:
```bash
npm run build
```

Start production server:
```bash
npm start
```

## Project Structure

```
prodigypm/
├── app/
│   ├── dashboard/
│   │   ├── integrations/
│   │   │   └── page.tsx
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── dashboard/
│   │   ├── insights-sidebar.tsx
│   │   ├── meeting-feed.tsx
│   │   ├── navbar.tsx
│   │   ├── quick-actions.tsx
│   │   └── sidebar.tsx
│   ├── landing/
│   │   ├── early-access.tsx
│   │   ├── footer.tsx
│   │   ├── how-it-works.tsx
│   │   ├── integrations.tsx
│   │   └── testimonials.tsx
│   └── ui/
│       ├── badge.tsx
│       ├── button.tsx
│       ├── card.tsx
│       ├── input.tsx
│       ├── label.tsx
│       ├── prodigy-hero.tsx
│       ├── sheet.tsx
│       └── table.tsx
└── lib/
    └── utils.ts
```

## Design System

### Color Palette
- Primary: Indigo (#6366F1)
- Secondary: Purple (#9333EA)
- Success: Emerald (#10B981)
- Sky Blue: (#38BDF8)
- Background: Neutral Gray (#F9FAFB)
- Dark: Neutral (#171717)

### Typography
- Font: Geist Sans and Geist Mono
- All text uses `font-mono` class for consistent monospace styling

### Components
- Rounded cards with subtle shadows
- Smooth fade-in animations on scroll
- Clean, minimalist design with ample whitespace
- Consistent spacing and hierarchy

## Pages

### 1. Landing Page (/)
Complete landing page with:
- Animated hero section
- Feature highlights
- How it works process
- Integrations showcase
- Testimonials
- Early access form
- Footer

### 2. Dashboard (/dashboard)
Main dashboard featuring:
- Quick action buttons
- Recent meetings table
- Insights and statistics
- Memory snapshot

### 3. Integrations (/dashboard/integrations)
Integration management with:
- All available integrations
- Connection status
- Setup instructions
- Integration statistics

## Next Steps

To make this production-ready:

1. Set up backend API endpoints
2. Implement authentication (NextAuth.js)
3. Connect to real Zoom/Meet/Jira APIs
4. Add database (Prisma + PostgreSQL)
5. Implement AI transcription service
6. Add real-time notifications
7. Create additional dashboard pages (Meetings, Clients, Stories, Settings)
8. Add proper error handling
9. Implement form validation
10. Add loading states and skeletons

## License

MIT
