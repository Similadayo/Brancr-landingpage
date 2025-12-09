# Custom Observability Setup Guide

This document explains how to set up and manage your custom observability system.

## Overview

The custom observability system replaces Sentry with a self-hosted solution that you control. It includes:

- **Error Tracking**: Automatic capture of client and server errors
- **Event Tracking**: Custom event logging
- **Metrics**: Application health and performance metrics
- **User Context**: Automatic tenant/user tracking

## Architecture

```
Client (Browser)
  ↓
lib/observability.ts (Client SDK)
  ↓
POST /api/observability
  ↓
Your Database/Logging Service
```

## Setup Steps

### 1. Database Schema (PostgreSQL Example)

```sql
CREATE TABLE error_logs (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER,
  type VARCHAR(50) NOT NULL,
  message TEXT,
  stack TEXT,
  url TEXT,
  user_agent TEXT,
  context JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_error_logs_tenant ON error_logs(tenant_id);
CREATE INDEX idx_error_logs_created ON error_logs(created_at);
CREATE INDEX idx_error_logs_type ON error_logs(type);
```

### 2. Update API Endpoint

Edit `app/api/observability/route.ts` to store in your database:

```typescript
import { db } from '@/lib/db'; // Your database client

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { type, payload } = body;
  const tenantId = request.headers.get('x-tenant-id') || payload?.tenant_id;

  // Store in database
  await db.error_logs.create({
    tenant_id: tenantId,
    type,
    message: payload.message,
    stack: payload.stack,
    url: payload.url,
    user_agent: payload.userAgent,
    context: payload,
  });

  // Optional: Send alerts for critical errors
  if (type === 'error' && payload.name === 'CriticalError') {
    await sendAlert({
      tenant_id: tenantId,
      message: payload.message,
    });
  }

  return NextResponse.json({ success: true });
}
```

### 3. Set Up Alerts

Create alerting based on error rates:

```typescript
// Example: Check error rate every 5 minutes
setInterval(async () => {
  const errorCount = await db.error_logs.count({
    where: {
      type: 'error',
      created_at: { gte: new Date(Date.now() - 5 * 60 * 1000) },
    },
  });

  if (errorCount > 100) {
    await sendSlackAlert(`High error rate: ${errorCount} errors in 5 minutes`);
  }
}, 5 * 60 * 1000);
```

### 4. Create Dashboards

Use your preferred tool (Grafana, Metabase, etc.) to visualize:

- Error rate over time
- Errors by tenant
- Most common errors
- Error trends

### 5. Integration Options

#### Option A: Direct Database Storage
- Store directly in PostgreSQL/MySQL
- Simple, no external dependencies
- Good for small to medium scale

#### Option B: Logging Service
Forward to:
- **CloudWatch** (AWS)
- **Datadog**
- **LogRocket**
- **Elasticsearch/ELK Stack**

#### Option C: Hybrid
- Store critical errors in database
- Forward all logs to logging service
- Use database for queries, logging service for search

## API Endpoints

### POST /api/observability
Receives error logs and events from clients.

**Request Body:**
```json
{
  "type": "error" | "log" | "event",
  "payload": {
    "message": "Error message",
    "stack": "Stack trace",
    "tenant_id": 123,
    "url": "https://...",
    "userAgent": "...",
    "timestamp": "2025-01-10T..."
  }
}
```

### GET /api/metrics
Returns application metrics (memory, uptime, etc.)

**Response:**
```json
{
  "timestamp": "2025-01-10T...",
  "uptime": 3600,
  "memory": {
    "used": 45.2,
    "total": 128.0
  },
  "environment": "production"
}
```

## Usage in Code

### Capture Errors
```typescript
import { captureException } from '@/lib/observability';

try {
  // Your code
} catch (error) {
  captureException(error, {
    tenant_id: 123,
    context: { additional: 'data' },
  });
}
```

### Log Messages
```typescript
import { captureMessage } from '@/lib/observability';

captureMessage('User performed action', 'info', {
  tenant_id: 123,
  action: 'clicked_button',
});
```

### Track Events
```typescript
import { observability } from '@/lib/observability';

observability.trackEvent('purchase_completed', {
  tenant_id: 123,
  amount: 99.99,
  product: 'premium',
});
```

## Environment Variables

```env
# Custom observability endpoint (optional, defaults to /api/observability)
NEXT_PUBLIC_OBSERVABILITY_ENDPOINT=/api/observability

# Enable in development (default: only in production)
NEXT_PUBLIC_ENABLE_OBSERVABILITY=false
```

## Monitoring Best Practices

1. **Set Up Alerts**
   - Error rate > threshold
   - Specific error types
   - Per-tenant error spikes

2. **Regular Reviews**
   - Weekly error analysis
   - Identify patterns
   - Fix recurring issues

3. **Retention Policy**
   - Keep errors: 90 days
   - Keep logs: 30 days
   - Archive old data

4. **Performance**
   - Batch writes if high volume
   - Use async processing
   - Rate limit client requests

## Migration from Sentry

The API is designed to match Sentry's interface, so existing code works with minimal changes:

- `captureException()` - Same signature
- `captureMessage()` - Same signature
- `setUserContext()` - Same signature

## Next Steps

1. Set up your database schema
2. Update `/api/observability` to store data
3. Create dashboards
4. Set up alerts
5. Monitor and iterate

