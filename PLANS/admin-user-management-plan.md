# Admin User Management - Implementation Plan

## Overview
Create a dedicated user management section for the admin panel at `/app/admin/users/`

## Current State
- Admin dashboard exists at `app/admin/dashboard/page.tsx` (82KB - comprehensive)
- User management is a tab within the dashboard
- API exists: `PATCH /api/admin/users/[id]/status` for status changes

## Proposed Structure
```
app/admin/users/
├── page.tsx                    # User list with search, filter, pagination
├── [id]/
│   └── page.tsx               # User details & edit page
└── new/
    └── page.tsx               # Create new user
```

## API Endpoints Needed

### Existing (already implemented)
- ✅ `PATCH /api/admin/users/[id]/status` - Update user status (suspend/activate)

### New Endpoints to Create
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/admin/users` | List all users with filters |
| GET | `/api/admin/users/[id]` | Get user details |
| POST | `/api/admin/users` | Create new user |
| PATCH | `/api/admin/users/[id]` | Update user details |
| DELETE | `/api/admin/users/[id]` | Delete user |

## Features for User List Page

### Search & Filters
- Search by name, email, phone
- Filter by user_type: customer, company, driver, admin
- Filter by status: active, suspended, pending
- Filter by date range (created_at)
- Sort by: name, email, created_at, status

### Table Columns
- ID
- Name
- Email
- Phone
- User Type (badge)
- Status (badge: green/yellow/red)
- Created At
- Actions (View, Edit, Suspend/Activate)

### Pagination
- 10/25/50/100 users per page
- Page numbers with navigation

## Features for User Detail Page

### Sections
1. **Profile Information**
   - Name, Email, Phone
   - NRC/ID (for customers)
   - Company Name (for companies)
   
2. **Account Status**
   - Current status
   - Suspend/Activate button
   - Status change reason
   
3. **Related Data** (depending on user type)
   - Customer: Booking history
   - Company: Buses, Routes, Bookings
   - Driver: Assigned trips, license info
   
4. **Activity Log**
   - Created at
   - Last login
   - Account changes

## Implementation Steps

### Phase 1: API Endpoints
1. Create `GET /api/admin/users` - List users with filters
2. Create `GET /api/admin/users/[id]` - Get single user
3. Create `POST /api/admin/users` - Create user
4. Create `PATCH /api/admin/users/[id]` - Update user
5. Create `DELETE /api/admin/users/[id]` - Delete user

### Phase 2: Frontend Pages
1. Create `app/admin/users/page.tsx` - User list
2. Create `app/admin/users/[id]/page.tsx` - User details
3. Create `app/admin/users/new/page.tsx` - Create user form
4. Add navigation link in dashboard

### Phase 3: Enhancements (Optional)
- Bulk actions (activate/suspend multiple)
- Export to CSV
- User activity timeline
- Login history

## Database Query Examples

### List Users with Filters
```sql
SELECT 
  id, name, email, phone, user_type, status, created_at
FROM users
WHERE 
  (:user_type IS NULL OR user_type = :user_type)
  AND (:status IS NULL OR status = :status)
  AND (:search IS NULL OR name LIKE :search OR email LIKE :search)
ORDER BY created_at DESC
LIMIT :limit OFFSET :offset
```

### Get User with Related Data
```sql
SELECT 
  u.*,
  (SELECT COUNT(*) FROM bookings WHERE user_id = u.id) as booking_count,
  (SELECT COUNT(*) FROM buses WHERE company_id = u.id) as bus_count
FROM users u
WHERE u.id = ?
```

## UI/UX Design

### Color Scheme
- Customer: Blue badge
- Company: Purple badge
- Driver: Orange badge
- Admin: Red badge

- Active: Green status
- Suspended: Red status
- Pending: Yellow status

### Layout
- Sidebar navigation (existing)
- Main content area with breadcrumbs
- Responsive table with horizontal scroll on mobile

## Questions/Clarifications Needed

1. **User Types** - Should we allow creating all types (customer, company, driver, admin) from admin?
2. **Password Requirements** - For new users, auto-generate or set password?
3. **Company Verification** - Should admin be able to verify company documents?
4. **Data Export** - Need CSV export feature?
5. **Bulk Actions** - Need to select multiple users for batch operations?

---
