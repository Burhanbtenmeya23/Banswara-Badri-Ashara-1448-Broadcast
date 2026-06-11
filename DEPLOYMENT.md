# 🚀 Deployment Guide — Banswara Badri Ashara 1448 Broadcast

Complete beginner-friendly step-by-step guide to deploy this application.

---

## Prerequisites

You will need:
- A computer with internet
- A GitHub account (free) — github.com
- A Supabase account (free) — supabase.com
- A Vercel account (free) — vercel.com

---

## STEP 1: Set Up Supabase Database

1. Go to **https://supabase.com** and sign in / create an account
2. Click **"New Project"**
3. Fill in:
   - **Name**: `banswara-1448-broadcast`
   - **Database Password**: create a strong password (save it!)
   - **Region**: choose closest to your users (e.g., Asia — Singapore)
4. Click **"Create new project"** and wait ~2 minutes

### Run the Database Schema

5. In your Supabase project, click **"SQL Editor"** in the left sidebar
6. Click **"New query"**
7. Copy the entire contents of `supabase/schema.sql` from this project
8. Paste it into the SQL editor
9. Click **"Run"** (▶ button)
10. You should see: `users`, `settings`, `sessions` listed at the bottom

### Get Your API Keys

11. Click **"Settings"** (gear icon) → **"API"**
12. Note down:
    - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
    - **anon / public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
    - **service_role / secret key** → `SUPABASE_SERVICE_ROLE_KEY` (keep this secret!)

---

## STEP 2: Push Code to GitHub

1. Go to **https://github.com** and sign in
2. Click **"New repository"**
3. Name: `banswara-1448-broadcast`
4. Set to **Private** ✓
5. Click **"Create repository"**
6. On the next page, copy the repository URL (e.g., `https://github.com/yourusername/banswara-1448-broadcast.git`)

On your computer (or this environment), run:
```bash
git remote add origin https://github.com/yourusername/banswara-1448-broadcast.git
git branch -M main
git push -u origin main
```

---

## STEP 3: Deploy to Vercel

1. Go to **https://vercel.com** and sign in with GitHub
2. Click **"Add New..."** → **"Project"**
3. Find and select your `banswara-1448-broadcast` repository
4. Click **"Import"**

### Configure Environment Variables

Before clicking Deploy, scroll down to **"Environment Variables"** and add these one by one:

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service_role key |
| `ADMIN_USERNAME` | `admin` (or your choice) |
| `ADMIN_PASSWORD` | A strong password you'll remember |
| `JWT_SECRET` | A random 64-character string* |
| `ADMIN_JWT_SECRET` | Another random 64-character string* |
| `NEXT_PUBLIC_APP_URL` | Your Vercel URL (set after first deploy) |

*Generate random strings at: https://www.uuidgenerator.net/ (generate multiple and concatenate)

5. Click **"Deploy"**
6. Wait 2-3 minutes for the build to complete
7. Copy your Vercel URL (e.g., `https://banswara-1448-broadcast.vercel.app`)
8. Go back to Vercel → Settings → Environment Variables → Update `NEXT_PUBLIC_APP_URL` with your Vercel URL → Redeploy

---

## STEP 4: Set Up Custom Domain (Optional)

1. In Vercel, go to your project → **"Settings"** → **"Domains"**
2. Click **"Add"** and enter your domain (e.g., `broadcast.yoursite.com`)
3. Vercel will show you DNS records to add
4. Log into your domain registrar (GoDaddy, Namecheap, etc.)
5. Add the CNAME or A record as instructed by Vercel
6. Wait up to 48 hours for DNS propagation (usually 15 minutes)

---

## STEP 5: First Admin Login

1. Visit `https://your-app.vercel.app/admin/login`
2. Login with:
   - Username: the `ADMIN_USERNAME` you set
   - Password: the `ADMIN_PASSWORD` you set
3. You'll land on the Admin Dashboard

---

## STEP 6: Add Users

1. In Admin Dashboard → **Users** tab
2. Click **"+ Add User"**
3. Enter ITS ID (8 digits) and a password
4. Click **"Add User"**

**OR** use bulk import:
1. Create a CSV file with columns: `its_id,password`
2. Example:
   ```
   its_id,password
   12345678,password123
   87654321,mypassword
   ```
3. Click **"Import CSV"** and upload your file

---

## STEP 7: Set Broadcast Video

1. In Admin Dashboard → **Broadcast** tab
2. Paste the YouTube URL of your video/stream
3. Click **"Update Broadcast"**
4. Click **"Preview"** to confirm it's working

---

## STEP 8: User Login

Users visit your app URL and:
1. Enter their 8-digit ITS ID
2. Enter their password
3. Click **"Enter Broadcast"**
4. They see the video player

---

## Security Notes

- Change `ADMIN_PASSWORD` to something strong (12+ characters, mixed case, numbers, symbols)
- Never share `SUPABASE_SERVICE_ROLE_KEY` or `JWT_SECRET` publicly
- The app enforces **single session** — logging in on a new device kicks out the previous session
- Passwords are stored with **bcrypt** (industry-standard hashing)
- Rate limiting prevents brute-force attacks (5 attempts per 15 minutes per IP)

---

## Troubleshooting

**Build fails on Vercel:**
- Check all environment variables are set correctly
- Check the build logs in Vercel for specific errors

**"Unauthorized" errors:**
- Make sure `SUPABASE_SERVICE_ROLE_KEY` is set (not just the anon key)
- Confirm the schema.sql was run successfully in Supabase

**YouTube video not showing:**
- Make sure the video is public or unlisted (not private)
- The URL must be a valid youtube.com or youtu.be link

**Users can't login:**
- Verify the ITS ID is exactly 8 digits
- Verify the password was set correctly in admin panel
- Check Supabase SQL Editor → run `SELECT * FROM users;` to see users

**Session keeps getting terminated:**
- This is by design — only one device at a time per ITS ID
- If this is unintended, check that nobody else is using the same ITS ID

---

## Local Development

```bash
# Install dependencies
npm install

# Copy env file
cp .env.example .env.local
# Fill in your Supabase and JWT values

# Run development server
npm run dev

# Open http://localhost:3000
```
