# Feature Implementation Roadmap

## ✅ Completed Features

### 1. Branch Management System
- ✅ Tier-based branch limits (CORE: 1, OPS: 5, OPS_SCAN: 10, OPS_SCAN_PO: unlimited)
- ✅ Branch CRUD API with company scoping
- ✅ Inventory duplication from existing branches
- ✅ Branch management UI at `/dashboard/branches`
- ✅ Real-time limit tracking and upgrade prompts

### 2. Part Request System (Foundation)
- ✅ Prisma schema with PartRequest model
- ✅ Migration SQL for part_requests table
- ✅ Part requests API (GET, POST, PATCH)
- ✅ Company scoping in middleware
- ⏳ **Next**: Build UI for field workers and admin/warehouse

## 🚧 In Progress

### Part Request UI
**Field Worker Experience:**
1. Create `/dashboard/part-requests/page.tsx`
2. "Request Part" button → modal with form
3. Fields: Item name, description, quantity, urgency (low/normal/high/critical)
4. View their own requests with status badges
5. Add to Field navigation menu

**Admin/Warehouse Experience:**
1. Create `/dashboard/manage-part-requests/page.tsx`
2. See all company part requests
3. Filter by status (PENDING, IN_PROGRESS, FULFILLED, CANCELLED)
4. Update status and add fulfillment notes
5. See requester details (name, vehicle number)
6. Add to Admin/Warehouse navigation menu

**Implementation:**
```typescript
// app/dashboard/part-requests/page.tsx (Field Workers)
- List of user's part requests
- Status badges with color coding
- "New Request" button → modal
- Form: itemName, description, quantity, urgency
- Real-time status updates

// app/dashboard/manage-part-requests/page.tsx (Admin/Warehouse)
- All company requests with requester info
- Status filters (tabs or dropdown)
- Click request → modal to update status/notes
- Mark as IN_PROGRESS, FULFILLED, or CANCELLED
- Show fulfillment history
```

## 📋 Remaining Features

### 3. Enhanced Admin Dashboard
**Goal**: More comprehensive KPIs and tracking

**Features to Add:**
1. **Vehicle Inventory Tracking Card**
   - Show field workers with overdue vehicle stock submissions
   - Click to see individual vehicle inventory details
   - Color-coded status (on-time, warning, overdue)

2. **Low Stock Alerts by Category**
   - Break down low stock by category (not just total)
   - Show top 5 critically low items
   - Link to warehouse inventory filtered by low stock

3. **Recent Activity Feed**
   - Latest orders submitted
   - Latest part requests
   - Recent inventory updates
   - User activity log

4. **Performance Metrics**
   - Order fulfillment time (average)
   - Part request response time
   - Inventory turnover rate (if applicable)

**Implementation**:
```typescript
// app/dashboard/page.tsx additions
- Add VehicleInventoryTracker component
- Add LowStockBreakdown component
- Add RecentActivity component
- Add PerformanceMetrics component (optional)
```

### 4. Comprehensive Branding Customization
**Goal**: Full white-label capabilities for OPS+ tiers

**Current State**:
- Settings page has: name, slug, logoUrl, primaryColor, appName

**Add to Settings Page**:
1. **Color Scheme Editor**
   - Primary color (existing)
   - Secondary color (accents)
   - Background color
   - Text color
   - Button colors
   - Live preview

2. **Logo Upload**
   - File upload (not just URL)
   - Image preview
   - Max file size validation
   - Store in public folder or S3

3. **Typography**
   - Font family selection (Google Fonts)
   - Font size presets

4. **Tier-Based Access Control**
   - CORE tier: Basic branding only (logo, name)
   - OPS tier: Full color customization
   - OPS_SCAN+: Typography control

**Implementation**:
```typescript
// app/dashboard/settings/page.tsx
- Expand branding section
- Add color picker components
- Add file upload for logo
- Tier-based feature flags
- Real-time preview panel

// Prisma schema additions
model Company {
  ...
  secondaryColor String?
  backgroundColor String?
  textColor String?
  fontFamily String?
}
```

### 5. Expanded Settings Page
**Current Fields**: name, logoUrl, primaryColor, appName, license

**Add**:
1. **Company Information Section**
   - Company name
   - Address
   - Phone number
   - Email
   - Website

2. **Notification Preferences**
   - Email notifications for low stock
   - Email notifications for new part requests
   - Email notifications for order status changes
   - Frequency (immediate, daily digest, weekly)

3. **Operational Settings**
   - Default par level multiplier
   - Low stock threshold (percentage)
   - Order auto-approval rules
   - Vehicle stock submission deadline (day of week)

4. **Integration Settings** (Future)
   - API keys
   - Webhook URLs
   - Third-party integrations

**Implementation**:
```typescript
// Prisma schema additions
model CompanySettings {
  id String @id @default(cuid())
  companyId String @unique

  // Contact
  address String?
  phone String?
  email String?
  website String?

  // Notifications
  lowStockEmail Boolean @default(true)
  partRequestEmail Boolean @default(true)
  orderStatusEmail Boolean @default(false)
  emailFrequency String @default("immediate")

  // Operational
  defaultParMultiplier Float @default(1.0)
  lowStockThreshold Int @default(50)
  vehicleStockDeadline Int @default(5) // Friday = 5

  company Company @relation(...)
}

// app/dashboard/settings/page.tsx
- Tab-based navigation
- Branding | Company Info | Notifications | Operations
```

### 6. Tier Upgrade & Pricing Page
**Goal**: Self-service upgrade path

**Page**: `/dashboard/upgrade`

**Content**:
1. **Current Plan Card**
   - Show current tier (CORE, OPS, etc.)
   - Features included
   - Usage stats (branches used, etc.)

2. **Available Plans Grid**
   - CORE (Free/Trial)
     - 1 branch
     - Basic inventory
     - Up to 5 users

   - OPS ($99/mo)
     - 5 branches
     - Full branding
     - Advanced reporting
     - Part requests
     - Unlimited users

   - OPS_SCAN ($199/mo)
     - 10 branches
     - Everything in OPS
     - Barcode scanning
     - Mobile app

   - OPS_SCAN_PO ($299/mo)
     - Unlimited branches
     - Everything in OPS_SCAN
     - Purchase order management
     - Vendor integrations
     - Priority support

3. **Feature Comparison Table**
4. **Contact Sales CTA** (for custom pricing)

**Implementation**:
```typescript
// app/dashboard/upgrade/page.tsx
- Pricing cards with feature lists
- "Upgrade" buttons (link to payment/contact)
- Feature comparison matrix
- Usage indicators
- Testimonials (optional)
```

### 7. Additional Improvements

**A. Advanced Search & Filters**
- Global search across inventory, orders, users
- Advanced filters on all list pages
- Saved filter presets

**B. Export Functionality**
- Export inventory to CSV/Excel
- Export orders to CSV
- Export part requests to CSV
- PDF reports

**C. Bulk Operations**
- Bulk update inventory quantities
- Bulk create warehouse items from CSV
- Bulk assign users to branches

**D. Analytics Dashboard** (Separate from main dashboard)
- Charts and graphs
- Inventory trends over time
- Order volume trends
- Field worker performance

**E. Mobile Responsiveness**
- Ensure all pages work on mobile
- Touch-friendly UI elements
- Responsive tables (scroll or cards on mobile)

**F. Help & Documentation**
- In-app help tooltips
- User guide/documentation
- Video tutorials
- FAQ section

## 🎯 Priority Order for Implementation

1. **Part Request UI** (completes feature #7 from your list)
2. **Enhanced Admin Dashboard** (feature #2)
3. **Comprehensive Branding UI** (feature #3)
4. **Expanded Settings** (feature #4)
5. **Tier Upgrade Page** (feature #5)
6. **Additional Improvements** (feature #6)

## 📝 Notes

- All features should respect tier-based access control
- All data operations must use company-scoped queries
- Mobile-first design for field worker features
- Admin features can be desktop-focused but should be responsive
- Consider progressive enhancement (start simple, add complexity)

## 🚀 Quick Wins (Can implement quickly)

1. Add part request link to Field navigation
2. Add manage part requests link to Admin navigation
3. Create basic part request list pages
4. Add export to CSV buttons on existing pages
5. Add search bars to inventory/user pages
6. Create simple upgrade page with pricing tiers
