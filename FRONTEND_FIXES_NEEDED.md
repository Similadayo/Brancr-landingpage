# Frontend Fixes Needed (Priority Order)

> 📋 **Complete API Reference:** See [`FRONTEND_ENDPOINTS_MAP.md`](./FRONTEND_ENDPOINTS_MAP.md) for all endpoints mapped to each menu/submenu item.

## 🔴 Critical Fixes (Data Binding Issues)

### 1. **Campaigns Page Showing Empty**
**Issue:** Overview shows 41 scheduled posts, but Campaigns page is empty.

**Root Cause:** Likely incorrect API endpoint usage or missing data fetch.

**Fix:**
```typescript
// In Campaigns page component
// Should use: GET /api/tenant/scheduled-posts
// Not: GET /api/tenant/campaigns (doesn't exist)

// Example fix:
const { data: scheduledPosts } = useScheduledPosts(); // This hook should call GET /api/tenant/scheduled-posts
// Filter by status if needed: scheduledPosts.filter(p => p.status === 'scheduled')
```

**Check:**
- ✅ Endpoint exists: `GET /api/tenant/scheduled-posts`
- ⚠️ Frontend might be calling wrong endpoint or not filtering correctly
- ⚠️ Check if `useScheduledPosts` hook exists and is correctly implemented

### 2. **Planner & Timeline Empty in Overview**
**Issue:** Overview shows 41 scheduled posts, but "Planner - Upcoming posts" and "Timeline - Recent conversations" are empty.

**Root Cause:** Not fetching data from correct endpoints or not displaying correctly.

**Fix:**
```typescript
// For Planner (Upcoming Posts):
// Should use: GET /api/tenant/calendar?start={start}&end={end}
// Or: GET /api/tenant/scheduled-posts?status=scheduled&limit=5

// For Timeline (Recent Conversations):
// Should use: GET /api/tenant/conversations?limit=5

// Example:
const { data: upcomingPosts } = useCalendar({ start, end }); // Last 7 days
const { data: recentConvos } = useConversations({ limit: 5 });
```

**Check:**
- ✅ Endpoint exists: `GET /api/tenant/calendar?start&end`
- ✅ Endpoint exists: `GET /api/tenant/conversations?limit=5`
- ⚠️ Frontend might not be calling these endpoints
- ⚠️ Check date range filtering

### 3. **Template Library Showing Hardcoded Examples**
**Issue:** Campaigns page shows hardcoded template examples instead of real data.

**Fix:**
```typescript
// Should use: GET /api/tenant/templates
// Replace hardcoded mockTemplates array with real API data

// Example:
const { data: templates } = useTemplates(); // This hook should call GET /api/tenant/templates
// Remove: const mockTemplates = [...] // Hardcoded examples
```

**Check:**
- ✅ Endpoint exists: `GET /api/tenant/templates`
- ✅ CRUD endpoints all exist
- ⚠️ Frontend might be using mock data instead of API

---

## 🟡 UI/UX Improvements (Sidebar Simplification)

### 4. **Remove/Simplify Sidebar Items**

**Current (12 items - too many):**
```
1. Overview ✅
2. Inbox ✅
3. Campaigns ✅
4. Calendar ✅
5. Media ✅
6. Create Post ✅
7. Bulk Uploads ⚠️ (stubs)
8. Onboarding ⚠️ (one-time)
9. Integrations ✅
10. Analytics ✅
11. Settings ✅
12. Onboarding Summary ⚠️ (redundant)
```

**Recommended (8 items - cleaner):**

```
CORE NAVIGATION:
├─ Overview
├─ Inbox
├─ Campaigns
│  └─ [+ Create Post] button in header (not sidebar item)
├─ Calendar
└─ Media
   └─ Bulk Uploads (submenu or collapsible)

SETTINGS (dropdown/collapsible):
├─ Integrations
├─ Analytics
├─ Settings
│  ├─ Account
│  ├─ Business Profile
│  ├─ AI Persona
│  └─ Team (when ready)
└─ Onboarding Summary (conditional, show only if completed)
```

**Changes:**
1. **Remove "Onboarding"** from sidebar
   - Redirect to `/app/onboarding` if `onboarding_complete === false`
   - Hide completely if `onboarding_complete === true`
   
2. **Remove "Create Post"** from sidebar
   - Make it a **button** in Campaigns page header: "+ Build campaign"
   - Or add as submenu under Campaigns

3. **Group Settings items**
   - Create a collapsible "Settings" section
   - Include: Integrations, Analytics, Settings (Account/Profile/Persona), Onboarding Summary

4. **Make Bulk Uploads a submenu**
   - Under Media dropdown, or keep separate but smaller

5. **Conditional "Onboarding Summary"**
   - Only show if `onboarding_complete === true`
   - Move into Settings dropdown

---

## 🟢 Nice-to-Have (Remove Non-Functional Features)

### 5. **Hide/Remove Export CSV Buttons**

**Issue:** Export CSV buttons exist but endpoints don't exist.

**Options:**
1. **Remove completely** (recommended for MVP)
2. **Hide until endpoints exist**
3. **Show "Coming Soon" badge**

**Recommended:** Remove completely for MVP. Add back when CSV export endpoints are implemented.

**Locations to check:**
- Inbox page: "Export CSV" button
- Campaigns page: "Export CSV" button  
- Analytics page: "CSV Export" button (if exists)

**Code:**
```typescript
// Remove or comment out:
// <Button onClick={handleExportCSV}>Export CSV</Button>

// Or show "Coming Soon":
// <Button disabled>Export CSV <Badge>Coming Soon</Badge></Button>
```

---

## 📋 Implementation Checklist

### Backend APIs (Already Implemented ✅)
- [x] `GET /api/tenant/scheduled-posts` - Returns scheduled posts
- [x] `GET /api/tenant/calendar?start&end` - Returns calendar items
- [x] `GET /api/tenant/conversations?limit=5` - Returns conversations with pagination
- [x] `GET /api/tenant/templates` - Returns templates
- [x] `GET /api/tenant/onboarding/status` - Returns onboarding status

### Frontend Fixes Needed ⚠️
- [ ] Fix Campaigns page to use `GET /api/tenant/scheduled-posts`
- [ ] Fix Planner in Overview to use `GET /api/tenant/calendar`
- [ ] Fix Timeline in Overview to use `GET /api/tenant/conversations?limit=5`
- [ ] Replace hardcoded templates with `GET /api/tenant/templates`
- [ ] Remove/hide Export CSV buttons
- [ ] Simplify sidebar (remove redundant items, group Settings)
- [ ] Make "Onboarding" conditional (redirect or hide)
- [ ] Make "Create Post" a button in Campaigns header

---

## 🔍 Debugging Steps

### Check if APIs are being called:
1. Open browser DevTools → Network tab
2. Navigate to Campaigns page
3. Check if `GET /api/tenant/scheduled-posts` is called
4. Check response data matches what Overview shows

### Check if data is being displayed:
1. Inspect Campaigns component
2. Check if `scheduledPosts` array has 41 items
3. Check if filtering logic is correct
4. Check if rendering logic displays all posts

### Check date range:
1. For Planner/Timeline, ensure date range is correct
2. `start` should be today or last 7 days
3. `end` should be 30 days from now (for upcoming posts)

---

## 📝 Notes

- **CSV Exports:** Not needed for MVP. Remove/hide until endpoints exist.
- **Templates:** Backend is ready, just need to replace mock data with API calls.
- **Sidebar:** Current sidebar is too cluttered. Grouping similar items improves UX.
- **Onboarding:** Should only show during initial setup, not as permanent sidebar item.

---

## 🎯 Priority Order

1. **Fix Campaigns data binding** (shows 41 in Overview but empty in Campaigns)
2. **Fix Planner/Timeline empty state** (load from correct endpoints)
3. **Replace hardcoded templates** (use real API data)
4. **Simplify sidebar** (improve UX, reduce clutter)
5. **Hide Export CSV** (remove non-functional features)

---

*Last updated: 2025-01-XX*

