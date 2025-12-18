# Tron Solar Inventory Management System

A comprehensive inventory management system for Tron Solar, designed to track warehouse inventory, vehicle stock levels, and manage material orders between field workers and warehouse staff.

## Features

### Role-Based Access Control
- **Admin**: Full system access including user management, inventory, and orders
- **Warehouse**: Manage warehouse inventory and process field worker orders
- **Field**: Submit orders, update vehicle stock, and track order status

### Core Functionality

#### Warehouse Management
- Track inventory levels for all warehouse items
- Real-time stock level monitoring with visual indicators (Critical/Low/Good)
- Update inventory quantities as items are received or pulled
- Category-based organization (PVC, EMT, Wire, etc.)

#### Vehicle Stock Management
- Weekly vehicle inventory tracking
- Par level comparison (expected vs actual quantities)
- Automatic order generation for items below par levels
- Mobile-friendly interface for easy field updates

#### Order System
- **Ad-hoc Orders**: Field workers can request materials anytime
- **Weekly Stock Orders**: Automatically generated from vehicle stock submissions
- Order status tracking: Submitted → In Progress → Ready → Completed
- Real-time status updates visible to field workers

#### Warehouse Order Fulfillment
- View all incoming orders from field workers
- Process orders with actual pulled quantities
- Automatic inventory deduction when items are pulled
- Mark orders as ready for pickup

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js with credential-based login
- **Deployment**: Vercel-ready (or any Node.js hosting)

## Getting Started

### Prerequisites

- Node.js 18+ installed
- PostgreSQL database (local or cloud)
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
cd "c:\\Users\\raust\\Tron Inventory"
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env` file in the root directory:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/tron_inventory"
NEXTAUTH_SECRET="your-secret-key-here-change-in-production"
NEXTAUTH_URL="http://localhost:3000"
```

To generate a secure NEXTAUTH_SECRET:
```bash
openssl rand -base64 32
```

4. Set up the database:
```bash
# Run Prisma migrations
npx prisma migrate dev --name init

# Seed the database with initial inventory data
npx prisma db seed
```

5. Start the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

### Default Admin Account

After seeding, you can log in with:
- **Email**: admin@tronsolar.com
- **Password**: admin123

**⚠️ IMPORTANT: Change this password immediately after first login!**

## Database Schema

The system includes the following main models:

- **User**: System users with roles (ADMIN, WAREHOUSE, FIELD)
- **WarehouseInventory**: Warehouse stock items with par levels
- **VehicleInventoryItem**: Standard vehicle loadout items
- **VehicleStock**: Weekly vehicle inventory submissions
- **Order**: Material orders from field to warehouse
- **OrderItem**: Individual items in each order

## Usage Guide

### For Admin Users

1. **User Management**: Navigate to User Management to add new users
   - Assign roles (Admin, Warehouse, or Field)
   - For field workers, assign a vehicle number
   - Activate/deactivate user accounts

2. **System Overview**: Dashboard shows key metrics
   - Total orders
   - Pending orders
   - Low stock items
   - Active users

### For Warehouse Staff

1. **Manage Inventory**:
   - View current stock levels by category
   - Update quantities as stock is received
   - Monitor low stock alerts

2. **Process Orders**:
   - View all incoming orders from field workers
   - Mark orders as "In Progress" when starting
   - Pull items and update quantities
   - Mark as "Ready" when order is complete
   - Inventory is automatically updated when items are pulled

### For Field Workers

1. **Submit Orders**:
   - Browse warehouse inventory
   - Select items and quantities needed
   - Add notes for special instructions
   - Submit order to warehouse

2. **Weekly Vehicle Stock**:
   - Review vehicle par levels
   - Enter actual quantities on hand
   - Submit form - system automatically generates orders for shortages
   - Week-ending date defaults to next Sunday

3. **Track Orders**:
   - View all your orders
   - See real-time status updates
   - Filter by status (Submitted, In Progress, Ready, Completed)

## Inventory Data

The system is pre-loaded with:

### Warehouse Inventory
- 2" PVC/Rigid components (13 items)
- 3/4" EMT components (10 items)
- 1" EMT components (7 items)
- Wire and conductors (13 items)
- Small goods and grounding (7 items)

### Vehicle Standard Loadout
- Complete van inventory based on par levels
- Organized by same categories as warehouse
- Automatic restock calculations

## API Endpoints

- `/api/auth/[...nextauth]` - Authentication
- `/api/inventory` - Warehouse inventory management
- `/api/orders` - Order creation and management
- `/api/vehicle-stock` - Vehicle inventory submissions
- `/api/users` - User management (Admin only)

## Deployment

### Database Setup

1. Create a PostgreSQL database (recommended: Neon, Supabase, or Railway)
2. Update DATABASE_URL in your environment variables
3. Run migrations: `npx prisma migrate deploy`
4. Run seed: `npx prisma db seed`

### Vercel Deployment

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Other Platforms

The app can be deployed to any platform that supports Next.js:
- Railway
- Render
- DigitalOcean
- AWS/Azure/GCP

## Future Enhancements

Potential features for future development:
- Email notifications for weekly stock reminders
- Order history and analytics
- Barcode scanning for inventory management
- Mobile app (React Native)
- Inventory forecasting and automatic reordering
- Integration with accounting systems
- PDF export for orders and reports

## Support

For issues or questions, contact your system administrator.

## License

Proprietary - Tron Solar Internal Use Only
