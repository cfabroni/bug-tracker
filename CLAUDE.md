# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Pocket Places Test Tracker - a lightweight manual testing tracker built with Next.js 14 and Supabase. Tracks test cases with 4 statuses (Untested, Pass, Fail, Blocked) with real-time sync to a Supabase database.

## Commands

```bash
npm install          # Install dependencies
npm run dev          # Start dev server at http://localhost:3000
npm run build        # Production build
npm run lint         # Run ESLint
```

## Environment Setup

Copy `.env.example` to `.env.local` and add your Supabase credentials:
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon/public key

## Architecture

**Single-page app** with all UI in `app/page.tsx` - a client component that handles:
- Loading test cases from Supabase (falls back to local data on error)
- Status cycling (untested → pass → fail → blocked)
- Inline note editing with auto-save
- Search/filter by status and text
- Collapsible categories with progress tracking

**Data layer:**
- `lib/supabase.ts` - Supabase client and TypeScript types (`TestCase`, `TestStatus`)
- `lib/test-data.ts` - Default test case definitions and `generateTestCases()` for seeding

**Database schema** (see README for full SQL):
- Single `test_cases` table with: `id`, `category`, `title`, `status`, `notes`, `updated_at`
- Status constrained to: `untested`, `pass`, `fail`, `blocked`

## Modifying Test Cases

Edit `lib/test-data.ts` to change categories/items. To apply:
1. Clear the `test_cases` table in Supabase, OR
2. Delete local data and refresh (app auto-seeds when table is empty)
