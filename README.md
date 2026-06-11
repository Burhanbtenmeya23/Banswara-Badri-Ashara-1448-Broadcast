# Banswara Badri Ashara 1448 — Broadcast Portal

A private, secure video broadcast portal built with Next.js 15, Supabase, and deployed on Vercel.

## Features

- **Private user login** via ITS ID and password
- **Single-session enforcement** — logging in on a new device terminates the previous session
- **Admin dashboard** — manage users, set broadcast video, view live stats
- **Bulk user import/export** via CSV
- **bcrypt password hashing** + rate limiting
- **Glassmorphism UI** with gold/beige Islamic aesthetic
- **Mobile-first responsive** design

## Tech Stack

- **Next.js 15** (App Router, TypeScript)
- **Tailwind CSS** + Poppins font
- **Supabase** PostgreSQL database
- **bcryptjs** password hashing
- **JWT** authentication (HTTP-only cookies)
- **Vercel** deployment

## Quick Start

See [DEPLOYMENT.md](./DEPLOYMENT.md) for full step-by-step instructions.

```bash
npm install
cp .env.example .env.local
# Fill in environment variables
npm run dev
```

## Routes

| Route | Description |
|-------|-------------|
| `/` | User login page |
| `/broadcast` | Video broadcast (authenticated users) |
| `/admin/login` | Admin login |
| `/admin/dashboard` | Admin overview stats |
| `/admin/dashboard/users` | User management |
| `/admin/dashboard/broadcast` | Broadcast settings |

## Environment Variables

See `.env.example` for all required variables.

## Database Schema

See `supabase/schema.sql` — run this in Supabase SQL Editor before deploying.
