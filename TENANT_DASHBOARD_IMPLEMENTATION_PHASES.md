# Tenant Dashboard Implementation - Phased Plan

## 🎯 Overview

This document breaks down the tenant dashboard enhancements into actionable phases, prioritizing based on user value, technical dependencies, and backend readiness.

---

## 📅 Phase 1: Foundation & Quick Wins (Week 1-2)

**Goal:** Enhance existing features and fix gaps with minimal backend changes.

### 1.1 Enhanced Dashboard Overview ✅ **FRONTEND-ONLY**

**Backend Status:** Endpoint exists (`/api/tenant/overview`), needs enhancement

**Frontend Tasks:**
- [ ] Enhance `/app/page.tsx` (Dashboard) to show:
  - Upcoming posts (next 5 scheduled) - use existing `useScheduledPosts()` hook
  - Recent conversations (last 5) - use existing `useConversations()` hook
  - Integration status overview - use existing `useIntegrations()` hook
  - Activity timeline (recent posts + conversations)
- [ ] Add stat cards with breakdowns
- [ ] Add "Quick Actions" section
- [ ] Add loading states and empty states

**Backend Tasks (Optional Enhancement):**
- [ ] Enhance `/api/tenant/overview` to return:
  - Upcoming posts array
  - Recent activity array
  - Integration summary
  - Unread conversations count

**Estimated Time:** 2-3 days (frontend only)

---

### 1.2 Enhanced Scheduled Posts Management ✅ **FRONTEND + MINOR BACKEND**

**Backend Status:** Read/Delete exists, needs Update endpoint

**Frontend Tasks:**
- [ ] Enhance `/app/campaigns/[id]/page.tsx` to show:
  - Media preview (if media_asset_ids exist)
  - Platform badges
  - Status timeline
  - Error details (if failed)
  - Posting window indicator
- [ ] Add "Reschedule" button (if scheduled/posting)
- [ ] Add "Edit Caption" button (if scheduled/posting)
- [ ] Add "Duplicate" button
- [ ] Add "View Analytics" link (if posted)

**Backend Tasks:**
- [ ] Add `PUT /api/tenant/scheduled-posts/{id}` endpoint:
  ```go
  {
    "caption": "string (optional)",
    "scheduled_at": "ISO datetime (optional)",
    "platforms": ["string"] (optional)
  }
  ```

**Estimated Time:** 3-4 days (frontend + backend)

---

### 1.3 Enhanced Conversations UI ✅ **FRONTEND-ONLY (Phase 1)**

**Backend Status:** Full API exists

**Frontend Tasks:**
- [ ] Enhance `/app/inbox/page.tsx`:
  - Add customer profile sidebar
  - Add tags display and management (placeholder until backend)
  - Add conversation status management
  - Improve message display (attachments, formatting)
  - Add "Escalate" button (placeholder)
  - Add real-time polling (every 10-15 seconds)
- [ ] Add conversation filters by platform
- [ ] Add conversation search (already implemented, verify)

**Backend Tasks (Optional):**
- [ ] Add `PUT /api/tenant/conversations/{id}` for:
  - Mark as read
  - Update tags
  - Update status

**Estimated Time:** 2-3 days (frontend only)

---

### 1.4 Recurring Templates UI ✅ **FRONTEND-ONLY**

**Backend Status:** Full CRUD API exists

**Frontend Tasks:**
- [ ] Enhance `/app/templates/page.tsx` to show:
  - Template frequency/schedule (if available in API)
  - Next run time
  - Last run time
  - Active/inactive status
  - Post count (uses field)
- [ ] Add template creation form at `/app/templates/new` (already created)
- [ ] Add template edit functionality
- [ ] Add "Test Template" button (preview)
- [ ] Add template history (posts created from template)

**Backend Tasks (Minor):**
- [ ] Verify template API returns: frequency, schedule, next_run, last_run, active status
- [ ] If not, add to response

**Estimated Time:** 2-3 days

---

### 1.5 Enhanced Analytics Dashboard ✅ **FRONTEND-ONLY (Phase 1)**

**Backend Status:** Comprehensive API exists

**Frontend Tasks:**
- [ ] Enhance `/app/analytics/page.tsx`:
  - Add chart visualizations (use Chart.js or Recharts):
    - Posts over time (line chart)
    - Engagement over time (line chart)
    - Platform comparison (bar chart)
    - Response distribution (pie chart)
  - Add engagement rate display
  - Add auto-reply success rate display
  - Add "Top Performing Posts" table
  - Add date range picker (already implemented)
  - Add platform filter (already implemented)
  - Improve empty states

**Backend Tasks:** None (API already comprehensive)

**Estimated Time:** 3-4 days

---

**Phase 1 Summary:**
- **Duration:** 2 weeks
- **Backend Changes:** Minimal (1 new endpoint for scheduled posts update)
- **Frontend Focus:** Enhance existing pages, improve UX
- **Value:** High - improves existing features users already have

---

## 📅 Phase 2: Core Content Management (Week 3-5)

**Goal:** Add essential content management features that currently exist only via Telegram.

### 2.1 Media Library API + UI ❌ **NEW FEATURE**

**Backend Tasks (Priority: HIGH):**
- [ ] Create Media Library endpoints:
  ```go
  GET    /api/tenant/media                - List media (filters: type, tags, campaign, date)
  GET    /api/tenant/media/{id}          - Get media details
  POST   /api/tenant/media                - Upload single media
  POST   /api/tenant/media/bulk-upload    - Upload multiple files
  PUT    /api/tenant/media/{id}          - Update tags, campaign, caption
  DELETE /api/tenant/media/{id}          - Delete media
  ```
- [ ] Add file upload handling (Cloudinary integration)
- [ ] Add media validation (file types, sizes)
- [ ] Support: images, videos, carousels

**Frontend Tasks:**
- [ ] Create `/app/media/page.tsx`:
  - Grid/list view toggle
  - Media cards with thumbnails
  - Filter sidebar (type, tags, campaign, date)
  - Search functionality
  - Upload button (opens modal)
  - Media preview modal
- [ ] Create `/app/media/upload/page.tsx`:
  - Drag-and-drop upload area
  - File picker
  - Upload progress
  - Add tags during upload
  - Assign to campaign
- [ ] Add media selection component (for post creation)
- [ ] Add media management (edit, delete) actions

**Estimated Time:** 5-7 days (backend + frontend)

---

### 2.2 Content Calendar API + UI ❌ **NEW FEATURE**

**Backend Tasks (Priority: HIGH):**
- [ ] Create Content Calendar endpoints:
  ```go
  GET /api/tenant/calendar                - Get calendar entries (filters: start_date, end_date, platform)
  GET /api/tenant/calendar/{date}        - Get posts for specific date
  ```
- [ ] Return calendar data in format:
  ```json
  {
    "entries": [
      {
        "id": "post-id",
        "date": "2025-01-15",
        "time": "14:30:00",
        "name": "Post name",
        "platforms": ["instagram", "facebook"],
        "status": "scheduled",
        "media_count": 3
      }
    ]
  }
  ```

**Frontend Tasks:**
- [ ] Create `/app/calendar/page.tsx`:
  - Calendar view (monthly/weekly/daily toggle)
  - Color-coded posts by platform
  - Click post to view/edit details
  - Drag-and-drop to reschedule (future enhancement)
  - Optimal time indicators (AI-suggested)
  - Visual indicators for:
    - Bulk uploads (grouped)
    - Recurring templates (icon)
- [ ] Add calendar navigation (prev/next month)
- [ ] Add day view (detailed timeline)
- [ ] Add week view (compact overview)

**Estimated Time:** 4-5 days (backend + frontend)

---

### 2.3 Post Creation Flow (Web UI) ❌ **NEW FEATURE**

**Backend Tasks (Priority: HIGH):**
- [ ] Create Post Creation endpoints:
  ```go
  POST /api/tenant/posts                  - Create new scheduled post
  {
    "name": "string",
    "caption": "string",
    "media_asset_ids": ["string"],
    "platforms": ["string"],
    "scheduled_at": "ISO datetime",
    "posting_window": {...} (optional)
  }
  
  POST /api/tenant/posts/{id}/publish-now - Publish immediately
  
  POST /api/tenant/posts/generate-caption - AI caption generation
  {
    "media_asset_ids": ["string"],
    "tone": "string (optional)",
    "include_hashtags": boolean (optional)
  }
  
  GET  /api/tenant/posts/optimal-times    - Get AI-suggested optimal times
  {
    "platforms": ["string"],
    "date": "YYYY-MM-DD"
  }
  ```
- [ ] Integrate with existing scheduled post system
- [ ] Add caption generation AI integration
- [ ] Add optimal time calculation

**Frontend Tasks:**
- [ ] Create `/app/posts/new/page.tsx`:
  - Step 1: Upload/Select Media
    - Drag-and-drop zone
    - Media library picker
    - Preview media
    - Add captions per media
  - Step 2: Write Caption
    - Rich text editor (or simple textarea)
    - AI caption generator button
    - Hashtag suggestions
    - Character count per platform
  - Step 3: Select Platforms
    - Checkboxes for each platform
    - Platform-specific options
  - Step 4: Schedule
    - Date/time picker (with timezone)
    - "Publish Now" option
    - Optimal time suggestions (AI-powered)
    - Link to recurring template
  - Step 5: Review & Schedule
    - Preview post
    - Edit before scheduling
    - Schedule button
- [ ] Add multi-step form navigation
- [ ] Add form validation
- [ ] Add preview component

**Estimated Time:** 7-10 days (backend + frontend)

---

**Phase 2 Summary:**
- **Duration:** 3 weeks
- **Backend Changes:** Significant (3 new feature sets)
- **Frontend Focus:** New pages and workflows
- **Value:** Critical - enables core content management via web UI

---

## 📅 Phase 3: Advanced Features (Week 6-8)

**Goal:** Add advanced features and improve existing ones.

### 3.1 Bulk Upload Management API + UI ❌ **NEW FEATURE**

**Backend Tasks (Priority: MEDIUM):**
- [ ] Create Bulk Upload endpoints:
  ```go
  GET    /api/tenant/bulk-uploads           - List bulk upload sessions
  GET    /api/tenant/bulk-uploads/{id}      - Get bulk upload details
  POST   /api/tenant/bulk-uploads           - Create bulk upload from dashboard
  PUT    /api/tenant/bulk-uploads/{id}      - Update bulk upload settings
  DELETE /api/tenant/bulk-uploads/{id}      - Cancel bulk upload
  ```
- [ ] Expose existing `BulkUploadSession` via API
- [ ] Support web-based bulk uploads (currently Telegram-only)

**Frontend Tasks:**
- [ ] Create `/app/bulk-uploads/page.tsx`:
  - List all bulk upload sessions
  - Status badges (pending, processing, completed, failed)
  - Split strategy display
  - Schedule strategy display
  - Progress indicators
- [ ] Create `/app/bulk-uploads/[id]/page.tsx`:
  - Bulk upload details
  - Media items grid
  - Edit settings (if pending)
  - View resulting scheduled posts
- [ ] Create `/app/bulk-uploads/new/page.tsx`:
  - Upload multiple files
  - Configure split strategy
  - Configure schedule strategy
  - Review and submit

**Estimated Time:** 5-6 days

---

### 3.2 Enhanced Conversations UI (Advanced) ✅ **FRONTEND + BACKEND**

**Backend Tasks:**
- [ ] Add `PUT /api/tenant/conversations/{id}` endpoint:
  ```go
  {
    "read": boolean (optional),
    "tags": ["string"] (optional),
    "status": "string" (optional),
    "notes": "string" (optional)
  }
  ```
- [ ] Add WebSocket support for real-time messages (future)
- [ ] Add AI suggested replies endpoint:
  ```go
  POST /api/tenant/conversations/{id}/suggest-reply
  Returns: Array of suggested replies
  ```

**Frontend Tasks:**
- [ ] Add AI suggested replies component
- [ ] Add quick reply templates
- [ ] Add conversation notes management
- [ ] Add tags management UI
- [ ] Improve real-time updates (WebSocket or better polling)
- [ ] Add typing indicators (if WebSocket)
- [ ] Add read receipts display

**Estimated Time:** 4-5 days

---

### 3.3 Enhanced Scheduled Posts (Advanced) ✅ **FRONTEND + BACKEND**

**Backend Tasks:**
- [ ] Extend `PUT /api/tenant/scheduled-posts/{id}` to support:
  - Priority field
  - Posting window
  - Bulk upload grouping

**Frontend Tasks:**
- [ ] Add drag-and-drop rescheduling in calendar view
- [ ] Add bulk actions (cancel multiple, reschedule multiple)
- [ ] Add post duplication with date offset
- [ ] Add post templates (save as template)
- [ ] Add post analytics (engagement metrics if posted)

**Estimated Time:** 3-4 days

---

### 3.4 Enhanced Analytics (Advanced Visualizations) ✅ **FRONTEND-ONLY**

**Backend Tasks (Optional):**
- [ ] Add granular analytics endpoints:
  ```go
  GET /api/tenant/analytics/posts              - Post-level analytics
  GET /api/tenant/analytics/engagement-trends  - Time-series engagement
  GET /api/tenant/analytics/best-times         - Optimal posting times analysis
  ```

**Frontend Tasks:**
- [ ] Add advanced charts:
  - Best posting times heatmap
  - Response time trends
  - Engagement by post type
  - Audience growth over time
- [ ] Add export functionality (CSV/PDF)
- [ ] Add scheduled reports
- [ ] Add comparison views (period over period)

**Estimated Time:** 4-5 days

---

**Phase 3 Summary:**
- **Duration:** 3 weeks
- **Backend Changes:** Moderate (2-3 new endpoints, enhancements)
- **Frontend Focus:** Advanced features and visualizations
- **Value:** High - improves power user experience

---

## 📅 Phase 4: Settings & Management (Week 9-10)

**Goal:** Improve settings management and add missing configuration features.

### 4.1 Business Profile Management ✅ **FRONTEND + BACKEND**

**Backend Tasks:**
- [ ] Create dedicated Business Profile endpoints:
  ```go
  GET /api/tenant/business-profile       - Get business profile
  PUT /api/tenant/business-profile       - Update business profile
  
  GET    /api/tenant/menu-items          - List menu items
  POST   /api/tenant/menu-items          - Create menu item
  PUT    /api/tenant/menu-items/{id}     - Update menu item
  DELETE /api/tenant/menu-items/{id}     - Delete menu item
  
  GET    /api/tenant/faqs                - List FAQs
  POST   /api/tenant/faqs                - Create FAQ
  PUT    /api/tenant/faqs/{id}           - Update FAQ
  DELETE /api/tenant/faqs/{id}           - Delete FAQ
  ```
- [ ] Move business profile out of onboarding-only scope

**Frontend Tasks:**
- [ ] Create `/app/settings/business/page.tsx`:
  - Business information form
  - Menu items management (CRUD)
  - FAQs management (CRUD)
  - Keywords input
  - Knowledge base textarea
  - Timezone selector
- [ ] Reuse existing onboarding forms/components

**Estimated Time:** 3-4 days

---

### 4.2 AI Persona Configuration ✅ **FRONTEND + BACKEND**

**Backend Tasks:**
- [ ] Create dedicated AI Persona endpoints:
  ```go
  GET /api/tenant/persona                - Get current persona
  PUT /api/tenant/persona                - Update persona
  
  POST /api/tenant/persona/test          - Test persona with sample message
  {
    "message": "string",
    "context": {...} (optional)
  }
  Returns: AI-generated response
  ```
- [ ] Move persona out of onboarding-only scope

**Frontend Tasks:**
- [ ] Create `/app/settings/persona/page.tsx`:
  - Current persona display
  - Edit persona form (reuse onboarding component)
  - Test persona section:
    - Chat interface
    - Sample message input
    - AI response preview
  - Conversation examples
  - Style guide display

**Estimated Time:** 3-4 days

---

### 4.3 Enhanced Integrations UI ✅ **FRONTEND-ONLY**

**Frontend Tasks:**
- [ ] Enhance `/app/integrations/page.tsx`:
  - Connection health indicators (green/yellow/red)
  - Last verified timestamp
  - Token expiration warnings
  - Webhook status indicators
  - Error message display
  - Connection troubleshooting tips
- [ ] Improve OAuth flow handling
- [ ] Add connection progress indicators
- [ ] Add WhatsApp number management modal:
  - Show current number
  - List available numbers
  - Request own number flow
  - Verification code input

**Backend Tasks:** None (API already comprehensive)

**Estimated Time:** 2-3 days

---

**Phase 4 Summary:**
- **Duration:** 2 weeks
- **Backend Changes:** Moderate (settings endpoints)
- **Frontend Focus:** Settings pages and management
- **Value:** Medium - improves configuration experience

---

## 📅 Phase 5: Polish & Nice-to-Have (Week 11-12)

**Goal:** Add team management and advanced features.

### 5.1 Team Management ⚠️ **BACKEND + FRONTEND**

**Backend Tasks:**
- [ ] Implement team management endpoints:
  ```go
  GET    /api/tenant/team/members        - List team members (already exists, enhance)
  POST   /api/tenant/team/invite         - Invite member (implement)
  GET    /api/tenant/team/members/{id}   - Get member (implement)
  PUT    /api/tenant/team/members/{id}   - Update member role (implement)
  DELETE /api/tenant/team/members/{id}   - Remove member (implement)
  
  GET    /api/tenant/team/roles          - List available roles
  ```
- [ ] Add invitation system (email invitations)
- [ ] Add role permissions system

**Frontend Tasks:**
- [ ] Enhance `/app/settings/team/page.tsx`:
  - Remove "Coming Soon" messages
  - Enable invite functionality
  - Enable role management
  - Enable member removal
  - Add permissions display
  - Add invitation management (pending invitations)

**Estimated Time:** 5-7 days

---

### 5.2 Advanced Features ✅ **FRONTEND-ONLY**

**Frontend Tasks:**
- [ ] Add export functionality:
  - Export analytics to CSV/PDF
  - Export conversations to CSV
  - Export scheduled posts list
- [ ] Add scheduled reports:
  - Weekly analytics email
  - Monthly summary
- [ ] Add keyboard shortcuts
- [ ] Add dark mode toggle
- [ ] Add notification preferences
- [ ] Add activity log/audit trail view

**Backend Tasks (Optional):**
- [ ] Add export endpoints if needed
- [ ] Add scheduled reports system

**Estimated Time:** 3-4 days

---

### 5.3 Mobile Responsiveness ✅ **FRONTEND-ONLY**

**Frontend Tasks:**
- [ ] Audit all pages for mobile responsiveness
- [ ] Optimize touch interactions
- [ ] Add mobile-specific navigation
- [ ] Test on various screen sizes
- [ ] Optimize images and media for mobile

**Estimated Time:** 3-4 days

---

**Phase 5 Summary:**
- **Duration:** 2 weeks
- **Backend Changes:** Team management implementation
- **Frontend Focus:** Polish, mobile, advanced features
- **Value:** Medium - improves user experience

---

## 📊 Implementation Timeline Summary

| Phase | Duration | Backend Endpoints | Frontend Pages | Priority |
|-------|----------|-------------------|----------------|----------|
| **Phase 1** | 2 weeks | 1 new | 5 enhanced | HIGH |
| **Phase 2** | 3 weeks | 3 new features | 3 new pages | CRITICAL |
| **Phase 3** | 3 weeks | 2-3 new | 4 enhanced | MEDIUM |
| **Phase 4** | 2 weeks | 2 new features | 3 new pages | MEDIUM |
| **Phase 5** | 2 weeks | 1 new feature | Polish | LOW |

**Total Estimated Time:** 12 weeks (3 months)

---

## 🎯 Quick Wins (Can Start Immediately)

These can be done in Phase 1 with minimal backend changes:

1. ✅ **Enhanced Dashboard Overview** - Use existing APIs
2. ✅ **Enhanced Analytics Visualizations** - API already comprehensive
3. ✅ **Enhanced Conversations UI** - Add features using existing API
4. ✅ **Recurring Templates UI** - API already exists
5. ✅ **Enhanced Scheduled Posts Display** - Add UI improvements

**Estimated Time:** 1 week for all quick wins

---

## 🔄 Dependencies

### Frontend → Backend Dependencies:

- **Media Library UI** requires Media Library API (Phase 2.1)
- **Content Calendar UI** requires Calendar API (Phase 2.2)
- **Post Creation UI** requires Post Creation API (Phase 2.3)
- **Bulk Upload UI** requires Bulk Upload API (Phase 3.1)
- **Business Profile UI** requires dedicated endpoints (Phase 4.1)
- **AI Persona UI** requires dedicated endpoints (Phase 4.2)
- **Team Management UI** requires team API implementation (Phase 5.1)

### Can Build in Parallel:

- Phase 1 items (most are frontend-only)
- Settings pages (Phase 4) can be built while Phase 2/3 backend is in progress
- Mobile responsiveness (Phase 5) can be done continuously

---

## 📋 Backend API Priority Order

### Must Implement First (Phase 2):

1. **Media Library API** - Required for post creation
2. **Post Creation API** - Core feature
3. **Content Calendar API** - Important for content management

### Should Implement Next (Phase 3-4):

4. **Bulk Upload API** - Enhances content management
5. **Business Profile API** - Improves settings
6. **AI Persona API** - Improves settings

### Can Implement Later (Phase 5):

7. **Team Management API** - Nice-to-have

---

## 🚀 Recommended Sprint Breakdown

### Sprint 1 (Week 1): Quick Wins
- Enhanced Dashboard Overview
- Enhanced Analytics (charts)
- Enhanced Conversations UI
- Recurring Templates UI

### Sprint 2 (Week 2): Scheduled Posts Enhancement
- Enhanced Scheduled Posts UI
- Post details page improvements
- Backend: PUT endpoint for scheduled posts

### Sprint 3-4 (Week 3-4): Media Library
- Backend: Media Library API
- Frontend: Media Library page
- Frontend: Media upload

### Sprint 5-6 (Week 5-6): Content Calendar
- Backend: Calendar API
- Frontend: Calendar page
- Integration with scheduled posts

### Sprint 7-9 (Week 7-9): Post Creation
- Backend: Post Creation API
- Backend: Caption generation API
- Backend: Optimal times API
- Frontend: Multi-step post creation flow

### Sprint 10-11 (Week 10-11): Bulk Upload & Advanced
- Backend: Bulk Upload API
- Frontend: Bulk Upload pages
- Enhanced Conversations (advanced features)

### Sprint 12-14 (Week 12-14): Settings & Polish
- Business Profile management
- AI Persona management
- Team Management
- Mobile responsiveness

---

## ✅ Success Criteria

### Phase 1 Complete When:
- [ ] Dashboard shows comprehensive overview
- [ ] Analytics has visual charts
- [ ] Conversations UI is enhanced
- [ ] Templates can be managed via UI
- [ ] Scheduled posts can be edited/rescheduled

### Phase 2 Complete When:
- [ ] Users can upload/manage media via web UI
- [ ] Users can view content calendar
- [ ] Users can create posts via web UI (not just Telegram)

### Phase 3 Complete When:
- [ ] Users can manage bulk uploads via web UI
- [ ] Conversations have AI suggestions
- [ ] Analytics has advanced visualizations

### Phase 4 Complete When:
- [ ] Users can manage business profile via settings
- [ ] Users can manage AI persona via settings
- [ ] Integrations UI shows detailed status

### Phase 5 Complete When:
- [ ] Team management is fully functional
- [ ] Export functionality works
- [ ] Mobile responsiveness is complete

---

## 📝 Notes

- **Backend First Approach:** For Phase 2+ features, implement backend APIs first, then build frontend
- **Incremental Releases:** Each phase can be released independently
- **User Testing:** Test with real users after each phase
- **Performance:** Monitor API response times as features are added
- **Documentation:** Update API docs as new endpoints are added

---

**Last Updated:** 2025-01-15  
**Status:** Ready for Implementation

