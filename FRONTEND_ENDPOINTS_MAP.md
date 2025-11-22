# Frontend Endpoints Map - Complete API Reference

**Base URL:** `/api`  
**Authentication:** All endpoints (except `/auth/*` and `/oauth/*`) require `TenantAuth` middleware (JWT token in cookie: `brancr_tenant_session`)

---

## 📋 Navigation Structure & Endpoints

### **CORE NAVIGATION**

---

## 1. **Overview** (`/app/overview`)

### Primary Endpoint

```
GET /api/tenant/overview
```

**Response:** Dashboard summary with stats, recent activity, quick insights

**Additional Data Sources:**

- Uses `GET /api/tenant/scheduled-posts?limit=5` for recent posts
- Uses `GET /api/tenant/conversations?limit=5` for recent conversations
- Uses `GET /api/tenant/calendar?start={today}&end={+7days}` for upcoming posts
- Uses `GET /api/tenant/analytics` for aggregated metrics

---

## 2. **Inbox** (`/app/inbox`)

### List Conversations

```
GET /api/tenant/conversations
```

**Query Parameters:**

- `cursor` (optional): Pagination cursor (integer ID)
- `limit` (optional): Number of items per page (default: 20)
- `status` (optional): Filter by status (`open`, `closed`, `pending`)
- `platform` (optional): Filter by platform (`instagram`, `facebook`, `whatsapp`)

**Response:**

```json
{
  "items": [
    {
      "id": 1,
      "platform": "instagram",
      "customer": {...},
      "last_message": {...},
      "status": "open",
      "unread_count": 2,
      "updated_at": "2025-01-XX..."
    }
  ],
  "next_cursor": 123
}
```

### Get Single Conversation

```
GET /api/tenant/conversations/{id}
```

**Response:** Full conversation with all messages, customer details, metadata

### Send Reply

```
POST /api/tenant/conversations/{id}/replies
```

**Request Body:**

```json
{
  "message": "Hello, thanks for reaching out!",
  "platform": "instagram" // or "facebook", "whatsapp"
}
```

### Update Conversation

```
PUT /api/tenant/conversations/{id}
```

**Request Body:**

```json
{
  "status": "closed", // or "open", "pending"
  "assigned_to": 123, // optional team member ID
  "tags": ["support", "urgent"] // optional
}
```

### Get AI-Suggested Replies

```
POST /api/tenant/conversations/{id}/suggest-replies
```

**Response:** Array of AI-generated reply suggestions based on conversation context

---

## 3. **Campaigns** (`/app/campaigns`)

### List Scheduled Posts (Campaigns)

```
GET /api/tenant/scheduled-posts
```

**Query Parameters:**

- `status` (optional): Filter by status (`scheduled`, `published`, `failed`, `cancelled`)
- `platform` (optional): Filter by platform (`instagram`, `facebook`, `whatsapp`, `tiktok`)
- `start_date` (optional): Filter posts scheduled after this date (ISO 8601)
- `end_date` (optional): Filter posts scheduled before this date (ISO 8601)
- `limit` (optional): Number of items per page (default: 20)
- `cursor` (optional): Pagination cursor

**Response:**

```json
{
  "items": [
    {
      "id": 1,
      "platform": "instagram",
      "caption": "Check out our new product!",
      "media_urls": ["https://..."],
      "scheduled_at": "2025-01-XXT10:00:00Z",
      "status": "scheduled",
      "created_at": "2025-01-XX..."
    }
  ],
  "next_cursor": 123
}
```

### Get Single Scheduled Post

```
GET /api/tenant/scheduled-posts/{id}
```

**Response:** Full post details including media, caption, scheduling info, status

### Update Scheduled Post

```
PUT /api/tenant/scheduled-posts/{id}
```

**Request Body:**

```json
{
  "caption": "Updated caption",
  "media_urls": ["https://..."],
  "scheduled_at": "2025-01-XXT15:00:00Z",
  "platform": "instagram"
}
```

### Delete Scheduled Post

```
DELETE /api/tenant/scheduled-posts/{id}
```

### Create Post (from Campaigns page)

```
POST /api/tenant/posts
```

**Request Body:**

```json
{
  "platform": "instagram",
  "caption": "New post caption",
  "media_urls": ["https://..."],
  "scheduled_at": "2025-01-XXT10:00:00Z", // optional, omit for immediate post
  "is_carousel": true // optional
}
```

### Generate Caption (AI)

```
POST /api/tenant/posts/generate-caption
```

**Request Body:**

```json
{
  "media_urls": ["https://..."],
  "tone": "professional", // optional
  "hashtags": true // optional, include hashtags
}
```

**Response:**

```json
{
  "caption": "Generated caption text...",
  "hashtags": ["#tag1", "#tag2"]
}
```

### Get Optimal Posting Times

```
GET /api/tenant/posts/optimal-times
```

**Query Parameters:**

- `platform` (optional): Filter by platform
- `day_of_week` (optional): Filter by day (0-6, Sunday=0)

**Response:**

```json
{
  "optimal_times": [
    {
      "day": "Monday",
      "hour": 14,
      "engagement_score": 0.85
    }
  ]
}
```

---

## 4. **Calendar** (`/app/calendar`)

### Get Calendar View

```
GET /api/tenant/calendar
```

**Query Parameters:**

- `start` (required): Start date (ISO 8601, e.g., `2025-01-01T00:00:00Z`)
- `end` (required): End date (ISO 8601, e.g., `2025-01-31T23:59:59Z`)

**Response:**

```json
{
  "items": [
    {
      "id": 1,
      "type": "scheduled_post", // or "template", "recurring"
      "title": "Product Launch",
      "platform": "instagram",
      "scheduled_at": "2025-01-15T10:00:00Z",
      "status": "scheduled",
      "media_count": 3
    }
  ]
}
```

**Note:** This endpoint aggregates:

- Scheduled posts (`scheduled_at` within range)
- Recurring templates (next occurrences)
- Any other calendar-worthy events

### Update Scheduled Post (Drag & Drop Reschedule)

```
PUT /api/tenant/scheduled-posts/{id}
```

**Request Body:**

```json
{
  "scheduled_at": "2025-01-20T14:00:00Z" // New date/time from drag-drop
}
```

---

## 5. **Media** (`/app/media`)

### List Media Library

```
GET /api/tenant/media
```

**Query Parameters:**

- `cursor` (optional): Pagination cursor (integer ID)
- `limit` (optional): Number of items per page (default: 20)
- `type` (optional): Filter by type (`image`, `video`)
- `platform` (optional): Filter by platform

**Response:**

```json
{
  "items": [
    {
      "id": 1,
      "file_id": "telegram_file_id",
      "url": "https://cloudinary.com/...",
      "type": "image",
      "platform": "instagram",
      "uploaded_at": "2025-01-XX...",
      "metadata": {
        "width": 1080,
        "height": 1080,
        "size": 1024000
      }
    }
  ],
  "next_cursor": 123
}
```

### Get Single Media Item

```
GET /api/tenant/media/{id}
```

**Response:** Full media item details

### Upload Media (Stub - needs implementation)

```
POST /api/tenant/media
```

**Request Body:**

```json
{
  "file": "<multipart/form-data>",
  "platform": "instagram", // optional
  "tags": ["product", "summer"] // optional
}
```

**Status:** ⚠️ Currently a stub - needs pre-signed upload URL or direct upload implementation

### Update Media Metadata

```
PUT /api/tenant/media/{id}
```

**Request Body:**

```json
{
  "tags": ["updated", "tags"],
  "description": "Media description"
}
```

### Delete Media

```
DELETE /api/tenant/media/{id}
```

---

### 5.1. **Bulk Uploads** (Submenu under Media)

### List Bulk Uploads

```
GET /api/tenant/bulk-uploads
```

**Query Parameters:**

- `cursor` (optional): Pagination cursor
- `limit` (optional): Number of items per page
- `status` (optional): Filter by status (`pending`, `processing`, `completed`, `failed`)

**Response:**

```json
{
  "items": [
    {
      "id": 1,
      "status": "processing",
      "total_items": 50,
      "processed_items": 25,
      "created_at": "2025-01-XX...",
      "completed_at": null
    }
  ],
  "next_cursor": 123
}
```

### Get Single Bulk Upload

```
GET /api/tenant/bulk-uploads/{id}
```

**Response:** Bulk upload details with progress, items, errors

### Create Bulk Upload (Stub)

```
POST /api/tenant/bulk-uploads
```

**Status:** ⚠️ Currently a stub - needs implementation

### Update Bulk Upload Status

```
PUT /api/tenant/bulk-uploads/{id}
```

**Request Body:**

```json
{
  "status": "paused" // or "resumed", "cancelled"
}
```

**Status:** ⚠️ Currently a stub

### Cancel Bulk Upload

```
POST /api/tenant/bulk-uploads/{id}/cancel
```

**Status:** ⚠️ Currently a stub

---

## **SETTINGS** (Dropdown/Collapsible)

---

## 6. **Integrations** (`/app/integrations`)

### List All Integrations

```
GET /api/tenant/integrations
```

**Response:**

```json
{
  "integrations": [
    {
      "platform": "instagram",
      "connected": true,
      "account_name": "@mybusiness",
      "account_id": "123456",
      "connected_at": "2025-01-XX...",
      "status": "active", // or "expired", "error"
      "health": {
        "token_valid": true,
        "webhook_active": true,
        "last_sync": "2025-01-XX..."
      }
    },
    {
      "platform": "facebook",
      "connected": false,
      "connected_at": null
    },
    {
      "platform": "whatsapp",
      "connected": true,
      "phone_number": "+1234567890",
      "status": "active"
    },
    {
      "platform": "tiktok",
      "connected": false
    }
  ]
}
```

### Get Single Integration

```
GET /api/tenant/integrations/{platform}
```

**Platform values:** `instagram`, `facebook`, `whatsapp`, `tiktok`

**Response:** Detailed integration info for specific platform

### Connect Integration (OAuth Start)

```
GET /api/oauth/{platform}/start?tenant_id={id}&success_redirect={url}
```

**Response:**

```json
{
  "platform": "instagram",
  "auth_url": "https://auth.instagram.brancr.com/start?tenant_id=123",
  "success_redirect": "/app/integrations"
}
```

### OAuth Callback

```
GET /api/oauth/{platform}/callback?code={code}&state={state}
```

**Status:** ⚠️ Currently a stub - needs full OAuth flow implementation

### Verify Integration

```
POST /api/tenant/integrations/{platform}/verify
```

**Response:** Verification result, health check status

### Repair Integration

```
POST /api/tenant/integrations/{platform}/repair
```

**Response:** Repair attempt result (reconnects webhooks, refreshes tokens)

### Delete/Disconnect Integration

```
DELETE /api/tenant/integrations/{platform}
```

### Debug Integration

```
GET /api/tenant/integrations/{platform}/debug
```

**Response:** Detailed debug info (tokens, webhook URLs, account details)

### Subscribe Instagram Page (Manual)

```
POST /api/tenant/integrations/instagram/subscribe
```

**Request Body:**

```json
{
  "page_id": "123456789"
}
```

---

## 7. **Analytics** (`/app/analytics`)

### Get Analytics Dashboard

```
GET /api/tenant/analytics
```

**Query Parameters:**

- `start_date` (optional): Start date for analytics range (ISO 8601)
- `end_date` (optional): End date for analytics range (ISO 8601)
- `platform` (optional): Filter by platform
- `metric` (optional): Specific metric to retrieve

**Response:**

```json
{
  "period": {
    "start": "2025-01-01T00:00:00Z",
    "end": "2025-01-31T23:59:59Z"
  },
  "overview": {
    "total_posts": 150,
    "total_engagement": 5000,
    "total_reach": 25000,
    "total_conversations": 45,
    "avg_response_time": 3600 // seconds
  },
  "by_platform": {
    "instagram": {
      "posts": 80,
      "engagement": 3000,
      "reach": 15000
    },
    "facebook": {
      "posts": 50,
      "engagement": 1500,
      "reach": 8000
    },
    "whatsapp": {
      "conversations": 45,
      "messages_sent": 200,
      "avg_response_time": 1800
    }
  },
  "trends": {
    "posts_over_time": [
      {"date": "2025-01-01", "count": 5},
      {"date": "2025-01-02", "count": 7}
    ],
    "engagement_over_time": [...]
  },
  "top_posts": [
    {
      "id": 1,
      "caption": "...",
      "engagement": 500,
      "reach": 2000
    }
  ]
}
```

**Note:** Some analytics features may be stubs or need aggregation jobs:

- ⚠️ `team_leaderboard` - needs implementation
- ⚠️ Nightly aggregation - needs cron job

---

## 8. **Settings** (`/app/settings`)

### 8.1. **Account Settings**

**Get Current User**

```
GET /api/auth/me
```

**Response:**

```json
{
  "id": 1,
  "name": "Business Name",
  "email": "business@example.com",
  "plan_type": "trial",
  "status": "active",
  "created_at": "2025-01-XX..."
}
```

**Update Account** (if exists)

```
PUT /api/auth/me
```

**Status:** ⚠️ May need implementation

**Logout**

```
POST /api/auth/logout
```

---

### 8.2. **Business Profile**

**Get Business Profile** (via onboarding status)

```
GET /api/tenant/onboarding/status
```

**Response includes:**

```json
{
  "onboarding_complete": true,
  "business_profile": {
    "name": "My Business",
    "description": "We sell amazing products",
    "industry": "retail",
    "tone": "friendly",
    "target_audience": "young adults"
  }
}
```

**Update Business Profile**

```
PUT /api/tenant/settings/business-profile
```

**Request Body:**

```json
{
  "name": "Updated Business Name",
  "description": "Updated description",
  "industry": "retail",
  "tone": "professional", // or "friendly", "casual", "formal"
  "target_audience": "young adults",
  "website": "https://example.com",
  "location": "New York, NY"
}
```

---

### 8.3. **AI Persona**

**Get AI Persona** (via onboarding status)

```
GET /api/tenant/onboarding/status
```

**Response includes:**

```json
{
  "persona": {
    "style": "helpful",
    "response_length": "medium",
    "use_emoji": true,
    "signature": "Best regards, Team"
  }
}
```

**Update AI Persona**

```
PUT /api/tenant/settings/persona
```

**Request Body:**

```json
{
  "style": "helpful", // or "professional", "casual", "friendly"
  "response_length": "medium", // or "short", "long"
  "use_emoji": true,
  "signature": "Best regards, Team",
  "custom_instructions": "Always be polite and helpful"
}
```

---

### 8.4. **Team** (Coming Soon)

**List Team Members**

```
GET /api/tenant/team/members
```

**Status:** ⚠️ Currently a stub/placeholder

**Invite Team Member**

```
POST /api/tenant/team/invite
```

**Request Body:**

```json
{
  "email": "member@example.com",
  "role": "editor" // or "viewer", "admin"
}
```

**Status:** ⚠️ Currently a stub

**Get Team Member**

```
GET /api/tenant/team/members/{id}
```

**Status:** ⚠️ Currently a stub

**Update Team Member**

```
PUT /api/tenant/team/members/{id}
```

**Request Body:**

```json
{
  "role": "admin"
}
```

**Status:** ⚠️ Currently a stub

**Remove Team Member**

```
DELETE /api/tenant/team/members/{id}
```

**Status:** ⚠️ Currently a stub

---

## 9. **Onboarding Summary** (Conditional - only if completed)

### Get Onboarding Status

```
GET /api/tenant/onboarding/status
```

**Response:**

```json
{
  "onboarding_complete": true,
  "steps_completed": {
    "business_profile": true,
    "persona": true,
    "business_details": true,
    "integrations": true
  },
  "business_profile": {...},
  "persona": {...},
  "integrations": {
    "instagram": true,
    "facebook": false,
    "whatsapp": false
  }
}
```

**Note:** This endpoint is used to:

1. Check if onboarding is complete (redirect if not)
2. Show onboarding summary in Settings
3. Determine which integrations are connected

---

## 🔐 Authentication Endpoints (Public)

### Signup

```
POST /api/auth/signup
```

**Request Body:**

```json
{
  "name": "Business Name",
  "email": "business@example.com",
  "password": "securepassword"
}
```

### Login

```
POST /api/auth/login
```

**Request Body:**

```json
{
  "email": "business@example.com",
  "password": "securepassword"
}
```

**Response:** Sets `brancr_tenant_session` cookie with JWT token

### Logout

```
POST /api/auth/logout
```

**Response:** Clears session cookie

### Get Current User

```
GET /api/auth/me
```

**Requires:** Authentication cookie

---

## 📝 Templates (Used in Campaigns)

### List Templates

```
GET /api/tenant/templates
```

**Query Parameters:**

- `type` (optional): Filter by type (`recurring`, `one_time`)
- `platform` (optional): Filter by platform

**Response:**

```json
{
  "items": [
    {
      "id": 1,
      "name": "Weekly Product Showcase",
      "type": "recurring",
      "platform": "instagram",
      "caption": "Check out this week's featured product!",
      "schedule": {
        "frequency": "weekly",
        "day_of_week": 1, // Monday
        "time": "10:00:00"
      },
      "media_urls": ["https://..."],
      "is_active": true
    }
  ]
}
```

### Create Template

```
POST /api/tenant/templates
```

**Request Body:**

```json
{
  "name": "Template Name",
  "type": "recurring", // or "one_time"
  "platform": "instagram",
  "caption": "Template caption",
  "media_urls": ["https://..."],
  "schedule": {
    "frequency": "weekly",
    "day_of_week": 1,
    "time": "10:00:00"
  }
}
```

### Get Template

```
GET /api/tenant/templates/{id}
```

### Update Template

```
PUT /api/tenant/templates/{id}
```

### Delete Template

```
DELETE /api/tenant/templates/{id}
```

---

## 📱 WhatsApp-Specific Endpoints

### List Available Phone Numbers (Provider-Owned)

```
GET /api/tenant/whatsapp/numbers
```

**Response:** List of available phone numbers from provider

### Assign Phone Number

```
POST /api/tenant/whatsapp/numbers/{id}/assign
```

### Select WhatsApp Number (Simplified)

```
POST /api/tenant/whatsapp/select-number
```

**Request Body:**

```json
{
  "phone_number_id": "123456789"
}
```

### Get Current Assigned Number

```
GET /api/tenant/whatsapp/current
```

### Disconnect Phone Number

```
POST /api/tenant/whatsapp/disconnect
```

### Request Tenant Phone Number (Tenant-Provided)

```
POST /api/tenant/whatsapp/request-number
```

### Verify Tenant Phone Number

```
POST /api/tenant/whatsapp/verify-number
```

### Check Phone Number Status

```
POST /api/tenant/whatsapp/check-number
```

---

## ⚠️ Endpoints That Need Implementation

### Stubs/Placeholders:

1. **Media Upload** (`POST /api/tenant/media`) - Needs pre-signed URL or direct upload
2. **Bulk Upload Creation** (`POST /api/tenant/bulk-uploads`) - Needs job creation logic
3. **Bulk Upload Management** (`PUT /api/tenant/bulk-uploads/{id}`, `POST /api/tenant/bulk-uploads/{id}/cancel`) - Needs pause/resume/cancel logic
4. **OAuth Callback** (`GET /api/oauth/{platform}/callback`) - Needs full OAuth flow
5. **Team Management** (all `/api/tenant/team/*`) - Needs RBAC implementation
6. **Account Update** (`PUT /api/auth/me`) - May need implementation
7. **CSV Export** - Not implemented (remove from frontend)

### Needs Enhancement:

1. **Analytics Aggregation** - Needs nightly cron job for `team_leaderboard` and trends
2. **Calendar Drag-Drop** - Needs validation for `PUT /api/tenant/scheduled-posts/{id}` with new `scheduled_at`
3. **Caption Generation** - Could be enhanced with more AI options
4. **Optimal Times** - Could use more AI analysis

---

## 📊 Response Format Standards

### Success Response

```json
{
  "data": {...} // or "items": [...] for lists
}
```

### Paginated List Response

```json
{
  "items": [...],
  "next_cursor": 123 // or null if no more items
}
```

### Error Response

```json
{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Error description"
  }
}
```

### Common HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

## 🔍 Query Parameter Conventions

- **Pagination:** `cursor` (integer ID), `limit` (default: 20)
- **Date Ranges:** `start_date`, `end_date` (ISO 8601)
- **Filtering:** `status`, `platform`, `type`
- **Sorting:** `sort_by`, `order` (asc/desc) - if supported

---

*Last updated: 2025-01-XX*  
*All endpoints require authentication except `/api/auth/*` and `/api/oauth/*`*

