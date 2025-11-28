# Inbox UI/UX Implementation Guide - Backend Aligned

This document tracks the implementation of the inbox UI/UX design aligned with the backend API structure.

## Status

✅ **API Types Updated** - Updated `lib/api.ts` to match backend structure
🔄 **Hooks Update** - In progress
⏳ **UI Components** - Pending

## Key Changes Needed

### 1. API Response Structure (Updated in lib/api.ts)

**GET /api/tenant/conversations:**
- `customer_name` (was `contact_name`)
- `customer_avatar` (new field)
- `platform` (was `channel`)
- `last_message` (was `preview`)
- `last_message_at` (was `updated_at`)
- `status`: "active" | "resolved" | "archived" (was "open" | "pending" | "closed")

**GET /api/tenant/conversations/{id}:**
- Messages now include:
  - `direction`: "incoming" | "outgoing"
  - `message_type`: "text" | "image" | "video" | "comment"
  - `content` (was `body`)
  - `detected_intent`, `detected_tone`, `confidence`
  - `response_type`, `response_status`
  - `suggested_reply`, `final_reply`

### 2. Frontend Types to Update

**ConversationSummary:**
- Use `customer_name`, `customer_avatar`, `platform`
- Use `last_message`, `last_message_at`
- Status: "active" | "resolved" | "archived"

**Message:**
- Use `direction`, `message_type`, `content`
- Add AI fields: `detected_intent`, `detected_tone`, `confidence`
- Add response fields: `response_type`, `response_status`, `suggested_reply`, `final_reply`

### 3. UI Components to Update

1. **ConversationListItem** - Show avatar, platform badge, status indicator
2. **MessageBubble** - Show direction, intent/tone badges, response type indicators
3. **AIInsightsPanel** - New component for intent/tone/confidence display
4. **ReplySection** - Enhanced with better AI suggestions UI

## Implementation Notes

- Maintain backward compatibility where possible
- Handle missing fields gracefully (fallbacks)
- Update all references from `channel` to `platform`
- Update all references from `contact_name` to `customer_name`
- Map old status values to new ones if needed

