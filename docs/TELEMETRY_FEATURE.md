# Telemetry Feature Documentation

## Overview

The telemetry feature provides comprehensive distributed tracing and observability for the e-commerce application. It captures OpenTelemetry traces and spans, stores them in the database with user context, and makes them accessible through the admin portal.

## Key Features

- **Database Storage**: Traces and spans are stored in dedicated database tables
- **User Context**: Captures username, email, and phone for each trace
- **Admin Portal**: View and manage telemetry data through the admin UI
- **REST API**: Full CRUD access to traces and spans for admin users
- **Automatic Capture**: Middleware automatically captures traces for all requests
- **Span Details**: Stores timing, attributes, events, and status for each span

## Backend Components

### Database Models

#### TelemetryTrace
- trace_id (unique identifier)
- user information (username, email, phone)
- service metadata (service_name, environment)
- HTTP details (method, URL, status_code, user_agent)
- timing (duration_ms)
- status (ok/error/unset)

#### TelemetrySpan  
- Associated trace
- span_id and parent_span_id
- Operation name and kind
- Timing (start_time, end_time, duration_ms)
- Status and error messages
- Attributes and events (JSON)

### API Endpoints

Admin-only endpoints:
- `/api/v1/admin/telemetry/traces/` - CRUD for traces
- `/api/v1/admin/telemetry/spans/` - CRUD for spans

Public endpoints:
- `/api/v1/telemetry/health/` - System status
- `/api/v1/telemetry/traces/` - Read-only access (admin-only)
- `/api/v1/telemetry/spans/` - Read-only access (admin-only)

## Frontend Integration

The admin portal includes two new resources under the "telemetry" section:

1. **Telemetry Traces** - View all captured traces with filtering and search
2. **Telemetry Spans** - View individual spans with detailed information

## Usage

### Viewing in Admin Portal

1. Log in as admin/staff user
2. Navigate to Admin page
3. Find "telemetry" section
4. Click "Telemetry Traces" to see all traces
5. Click on a trace to view details and associated spans

### Automatic Capture

Traces are automatically captured for all HTTP requests via the middleware. No manual intervention needed.

## Database Setup

Run migrations to create the tables:
```bash
python manage.py migrate telemetry
```

## Configuration

Controlled by existing OpenTelemetry settings:
- `OTEL_ENABLED` - Enable/disable telemetry (default: True)
- `OTEL_SERVICE_NAME` - Service identifier
- `OTEL_ENVIRONMENT` - Environment name

## Implementation Files

Backend:
- `backend/apps/telemetry/models.py` - Database models
- `backend/apps/telemetry/serializers.py` - API serializers
- `backend/apps/telemetry/views.py` - API viewsets
- `backend/apps/telemetry/admin.py` - Django admin registration
- `backend/apps/telemetry/middleware.py` - Trace capture middleware
- `backend/utils/telemetry_capture.py` - Capture utilities

Frontend:
- `frontend/src/admin/resources.ts` - Admin portal resources

## Future Enhancements

- Trace visualization (flame graphs, waterfall charts)
- Real-time monitoring dashboard
- Advanced filtering and search
- Data retention policies
- Performance analysis tools
- Alert generation for errors
