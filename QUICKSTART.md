# Quick Start Guide

Get the Tron Solar Inventory System running in 5 minutes!

## Prerequisites

- Node.js 18+ installed
- PostgreSQL database ready

## Steps

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Create a `.env` file:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/tron_inventory"
NEXTAUTH_SECRET="run: openssl rand -base64 32"
NEXTAUTH_URL="http://localhost:3000"
```

### 3. Setup Database
```bash
npx prisma migrate dev --name init
npx prisma db seed
```

### 4. Start the Server
```bash
npm run dev
```

### 5. Login
Open [http://localhost:3000](http://localhost:3000)

**Default credentials:**
- Email: `admin@tronsolar.com`
- Password: `admin123`

## What's Next?

1. Change the admin password immediately
2. Create user accounts (User Management page)
3. Review inventory levels (Warehouse page)
4. Start using the system!

For detailed setup instructions, see [SETUP.md](SETUP.md)

## Quick Reference

### User Roles
- **Admin**: Manages everything
- **Warehouse**: Handles inventory and orders
- **Field**: Submits orders and vehicle stock

### Key Features
- **Warehouse Inventory**: Track all stock levels
- **Vehicle Stock**: Weekly inventory checks with auto-reorder
- **Orders**: Request and fulfill material orders
- **User Management**: Add/manage system users (Admin only)

### Need Help?

See the full [README.md](README.md) for:
- Detailed feature documentation
- API endpoints
- Deployment guide
- Troubleshooting

## Common Commands

```bash
# Development
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# View database in browser
npx prisma studio
```

## Database Cloud Options

Don't have PostgreSQL? Use a free cloud database:

- **Neon** (neon.tech) - Recommended, generous free tier
- **Supabase** (supabase.com) - Easy setup
- **Railway** (railway.app) - Simple deployment

Just copy the connection string to your `.env` file!
