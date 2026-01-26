export const initialTestCases = [
  {
    category: "Authentication",
    items: [
      "Sign up with Google",
      "Sign up with Apple (iOS only)",
      "Sign up with email",
      "Sign in with Google",
      "Sign in with Apple (iOS only)",
      "Sign in with email",
      "Log out",
      "Session expiration handling"
    ]
  },
  {
    category: "Share Extension - Instagram",
    items: [
      "Share from Instagram post",
      "Share from Instagram reel",
      "Share from Instagram profile",
      "Share Instagram story (should show unsupported message)",
      "First-time share: notification permission prompt",
      "Subsequent shares: exits to background"
    ]
  },
  {
    category: "Share Extension - Other Sources",
    items: [
      "Share from TikTok video (full URL)",
      "Share from TikTok video (short URL)",
      "Share from Google Maps (place URL)",
      "Share from Google Maps (short URL)",
      "Share while not logged in (should save pending URL)",
      "Share duplicate URL (already processing message)",
      "Share already-saved place (already saved alert)"
    ]
  },
  {
    category: "Add Place Manually",
    items: [
      "Add via Instagram URL paste",
      "Add via TikTok URL paste",
      "Add via Google Maps URL paste",
      "Add via manual search"
    ]
  },
  {
    category: "Place Management",
    items: [
      "View place details",
      "Edit place notes",
      "Mark place as visited",
      "Delete place",
      "Share individual place",
      "Add place to collection",
      "Mute place notifications"
    ]
  },
  {
    category: "Review Extracted Places",
    items: [
      "Review single extracted place (preview screen)",
      "Review multiple extracted places (card swipe UI)",
      "Skip/Save/Save as Visited actions"
    ]
  },
  {
    category: "Collections",
    items: [
      "Create collection manually",
      "Create collection with AI (enter location + purpose)",
      "AI follow-up questions (companions, duration, season)",
      "View collection detail (list view)",
      "View collection detail (map view)",
      "Add pins to collection",
      "Remove pins from collection",
      "Delete collection",
      "Share collection"
    ]
  },
  {
    category: "Itinerary (AI)",
    items: [
      "Generate itinerary for collection",
      "View day-by-day itinerary",
      "Regenerate itinerary with different preferences",
      "View travel/packing items"
    ]
  },
  {
    category: "Share Link Acceptance",
    items: [
      "Accept collection share link (logged in)",
      "Accept collection share link (not logged in → login → accept)",
      "Accept place share link",
      "Invalid/expired share link error"
    ]
  },
  {
    category: "Dashboard & Navigation",
    items: [
      "View dashboard with countries/cities",
      "Sort by date/name/pin count",
      "Tap country → view cities",
      "Tap city → view places",
      "Search places/cities/countries",
      "Pull to refresh"
    ]
  },
  {
    category: "Nearby & Map",
    items: [
      "Enable location permission",
      "View nearby places list",
      "View nearby places map",
      "Filter by place type",
      "Sort by distance/rating/name",
      "Tap map marker → view place card"
    ]
  },
  {
    category: "Geofencing & Notifications",
    items: [
      "Enable proximity alerts",
      "Receive proximity notification when near saved place",
      "Tap notification → opens Nearby focused on place",
      "Disable proximity alerts"
    ]
  },
  {
    category: "Scraping Jobs",
    items: [
      "View in-progress jobs",
      "Job completion notification",
      "Job failure → manual retry",
      "Delete/dismiss job"
    ]
  },
  {
    category: "Account & Settings",
    items: [
      "View profile info",
      "Edit full name",
      "View travel stats",
      "Add visited location",
      "Import Google Maps list",
      "Change theme (light/dark/system)",
      "Toggle notification settings",
      "Send feedback"
    ]
  },
  {
    category: "Offline Support",
    items: [
      "Offline detection (banner/toast)",
      "Operations queue while offline",
      "Sync when back online",
      "Pull to refresh triggers sync"
    ]
  },
  {
    category: "Platform-Specific",
    items: [
      "iOS: Share extension appears in share sheet",
      "Android: Share intent handling",
      "iOS: Background geofencing",
      "Android: Background geofencing"
    ]
  }
]

export function generateTestCases() {
  const cases: Array<{
    id: string
    category: string
    title: string
    status: 'untested'
    notes: string
  }> = []
  
  initialTestCases.forEach((cat, catIdx) => {
    cat.items.forEach((item, itemIdx) => {
      cases.push({
        id: `${catIdx}-${itemIdx}`,
        category: cat.category,
        title: item,
        status: 'untested',
        notes: ''
      })
    })
  })
  
  return cases
}
