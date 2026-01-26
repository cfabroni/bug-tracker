# Pocket Places - Test Tracker

A lightweight manual testing tracker built with Next.js 14 and Supabase. Track test cases across iOS and Android platforms with screenshot attachments and real-time sync.

## Features

- **Dual Platform Tracking** - Track iOS and Android status independently per test case
- **5 Test Statuses** - Untested, Pass, Fail, Blocked, N/A (for platform-specific tests)
- **Add Custom Tasks** - Create new test cases on the fly with custom categories
- **Screenshot Attachments** - Upload screenshots with thumbnail grid and full-size preview
- **Notes** - Add notes to any test case with auto-save
- **Search & Filter** - Filter by status and platform, search by title
- **Progress Tracking** - Visual stats bar with platform-specific breakdowns
- **Real-time Sync** - All changes sync to Supabase instantly
- **Responsive Design** - Works on desktop and mobile

---

## Quick Start

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Click **New Project**
3. Choose a name, password, and region
4. Wait for the project to be created (~2 minutes)

### 2. Create the Database Table

Go to the **SQL Editor** in your Supabase dashboard and run this SQL:

```sql
-- Create the test_cases table
CREATE TABLE test_cases (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'untested' CHECK (status IN ('untested', 'pass', 'fail', 'blocked', 'na')),
  notes TEXT DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Platform-specific status
  ios_status TEXT DEFAULT 'untested' CHECK (ios_status IN ('untested', 'pass', 'fail', 'blocked', 'na')),
  android_status TEXT DEFAULT 'untested' CHECK (android_status IN ('untested', 'pass', 'fail', 'blocked', 'na')),

  -- Screenshots stored as JSONB array
  screenshots JSONB DEFAULT '[]'::jsonb,

  -- Track if task was user-created or seeded
  created_by TEXT DEFAULT 'seed'
);

-- Create indexes for faster queries
CREATE INDEX idx_test_cases_category ON test_cases(category);
CREATE INDEX idx_test_cases_status ON test_cases(status);
CREATE INDEX idx_test_cases_ios_status ON test_cases(ios_status);
CREATE INDEX idx_test_cases_android_status ON test_cases(android_status);
CREATE INDEX idx_test_cases_screenshots ON test_cases USING GIN (screenshots);

-- Enable Row Level Security (optional but recommended)
ALTER TABLE test_cases ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows all operations (adjust for your needs)
CREATE POLICY "Allow all operations" ON test_cases
  FOR ALL
  USING (true)
  WITH CHECK (true);
```

### 3. Create Storage Bucket (for screenshots)

1. Go to **Storage** in your Supabase dashboard
2. Click **New Bucket**
3. Name: `test-screenshots`
4. Toggle **Public bucket** ON
5. Click **Create bucket**
6. Go to bucket **Policies** and add a policy allowing uploads:

```sql
-- Allow public read access
CREATE POLICY "Public read access" ON storage.objects
  FOR SELECT USING (bucket_id = 'test-screenshots');

-- Allow authenticated uploads (or use 'true' for anonymous)
CREATE POLICY "Allow uploads" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'test-screenshots');

-- Allow deletes
CREATE POLICY "Allow deletes" ON storage.objects
  FOR DELETE USING (bucket_id = 'test-screenshots');
```

### 4. Get Your API Keys

1. Go to **Settings** > **API** in your Supabase dashboard
2. Copy:
   - **Project URL** (looks like `https://xxxxx.supabase.co`)
   - **anon/public key** (starts with `eyJ...`)

### 5. Configure Environment

Create a `.env.local` file:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your Supabase credentials:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 6. Run the App

```bash
# Install dependencies
npm install

# Run dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

---

## Usage

### Test Case Status

Click the platform buttons (iOS/Android) to cycle through statuses:
- **Untested** (gray) - Not yet tested
- **Pass** (green) - Test passed
- **Fail** (red) - Test failed
- **Blocked** (amber) - Cannot test due to blocker
- **N/A** (purple) - Not applicable for this platform

### Adding Tasks

1. Click **Add Task** button in the header
2. Select an existing category or create a new one
3. Enter the task title
4. Click **Add Task**

User-created tasks show a delete button; seeded tasks cannot be deleted.

### Screenshots

1. Click **+ Add screenshot** under any test case
2. Click **Choose File** and select an image
3. Thumbnails appear in a grid
4. Click thumbnail for full-size preview
5. Hover and click X to delete

### Filtering

- **Platform Toggle** - View Both, iOS only, or Android only
- **Status Filter** - Filter by Untested, Pass, Fail, Blocked, or N/A
- **Search** - Type to filter by test case title

---

## Project Structure

```
pocket-places-tracker/
├── app/
│   ├── globals.css          # Global styles + Tailwind
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Main tracker component
├── lib/
│   ├── supabase.ts          # Supabase client + TypeScript types
│   └── test-data.ts         # Initial test case definitions
├── supabase/
│   └── migrations/          # SQL migration files
├── .env.example             # Environment variables template
├── package.json
├── tailwind.config.js
└── tsconfig.json
```

---

## Customization

### Adding/Editing Default Test Cases

Edit `lib/test-data.ts` to modify the seeded test cases:

```typescript
export const initialTestCases = [
  {
    category: "Your Category",
    items: [
      "Test case 1",
      "Test case 2",
    ]
  },
  // ...
]
```

Then either:
- Delete all rows in your Supabase table and refresh the app (it auto-seeds when empty)
- Or add tasks directly in the UI

### Changing the Theme

Edit `app/globals.css` and `app/page.tsx` to customize colors. The app uses Tailwind CSS with a dark slate theme.

---

## Deployment

### Deploy to Vercel

1. Push this code to a GitHub repository
2. Go to [vercel.com](https://vercel.com) and click **Add New Project**
3. Import your GitHub repository
4. Add these **Environment Variables**:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```
5. Click **Deploy**

---

## Tech Stack

- **Next.js 14** - React framework with App Router
- **Supabase** - PostgreSQL database + Storage + Auth
- **Tailwind CSS** - Utility-first CSS
- **Lucide React** - Icon library
- **TypeScript** - Type safety

---

## License

MIT
