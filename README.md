# Pocket Places - Test Tracker

A lightweight issue/test tracker built with Next.js and Supabase.

![Test Tracker Screenshot](https://via.placeholder.com/800x450?text=Pocket+Places+Test+Tracker)

## Features

- ✅ Track test cases with 4 statuses: Untested, Pass, Fail, Blocked
- 📝 Add notes to any test case
- 🔍 Search and filter by status
- 📊 Progress tracking with visual stats
- ☁️ Real-time sync with Supabase
- 📱 Responsive design

---

## Setup Instructions

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
  status TEXT NOT NULL DEFAULT 'untested' CHECK (status IN ('untested', 'pass', 'fail', 'blocked')),
  notes TEXT DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create an index for faster queries
CREATE INDEX idx_test_cases_category ON test_cases(category);
CREATE INDEX idx_test_cases_status ON test_cases(status);

-- Enable Row Level Security (optional but recommended)
ALTER TABLE test_cases ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows all operations (adjust for your needs)
CREATE POLICY "Allow all operations" ON test_cases
  FOR ALL
  USING (true)
  WITH CHECK (true);
```

### 3. Get Your API Keys

1. Go to **Settings** → **API** in your Supabase dashboard
2. Copy:
   - **Project URL** (looks like `https://xxxxx.supabase.co`)
   - **anon/public key** (starts with `eyJ...`)

### 4. Deploy to Vercel

#### Option A: One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/pocket-places-tracker&env=NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY)

#### Option B: Manual Deploy

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

## Local Development

```bash
# Install dependencies
npm install

# Create .env.local with your Supabase credentials
cp .env.example .env.local
# Edit .env.local with your actual values

# Run dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

---

## Project Structure

```
pocket-places-tracker/
├── app/
│   ├── globals.css      # Global styles + Tailwind
│   ├── layout.tsx       # Root layout
│   └── page.tsx         # Main tracker component
├── lib/
│   ├── supabase.ts      # Supabase client setup
│   └── test-data.ts     # Initial test case data
├── .env.example         # Environment variables template
├── package.json
├── tailwind.config.js
└── tsconfig.json
```

---

## Customization

### Adding/Editing Test Cases

Edit `lib/test-data.ts` to modify the test cases:

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
- Delete all rows in your Supabase table and refresh the app
- Or manually update the database

### Changing the Theme

Edit `app/globals.css` and `app/page.tsx` to customize colors. The app uses Tailwind CSS.

---

## License

MIT
