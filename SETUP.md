# Tron Solar Inventory - Setup Guide

This guide will walk you through setting up the Tron Solar Inventory Management System from scratch.

## Prerequisites Checklist

Before you begin, ensure you have:

- [ ] Node.js version 18 or higher installed
- [ ] A PostgreSQL database (local or cloud-hosted)
- [ ] Git installed (if cloning from a repository)
- [ ] A code editor (VS Code recommended)
- [ ] Terminal/Command Prompt access

## Step-by-Step Setup

### 1. Database Setup

You have several options for PostgreSQL:

#### Option A: Local PostgreSQL
1. Download and install PostgreSQL from [postgresql.org](https://www.postgresql.org/download/)
2. Create a new database:
```sql
CREATE DATABASE tron_inventory;
```

#### Option B: Cloud Database (Recommended)
Use a cloud provider like:
- **Neon** (neon.tech) - Free tier available
- **Supabase** (supabase.com) - Free tier available
- **Railway** (railway.app) - Pay as you go

After creating your database, you'll receive a connection string like:
```
postgresql://username:password@host:5432/database_name
```

### 2. Project Setup

1. Navigate to the project directory:
```bash
cd "c:\Users\raust\Tron Inventory"
```

2. Install all dependencies:
```bash
npm install
```

This will install:
- Next.js and React
- Prisma (database ORM)
- NextAuth (authentication)
- Tailwind CSS (styling)
- And all other required packages

### 3. Environment Configuration

1. Copy the example environment file:
```bash
copy .env.example .env
```

2. Open `.env` and update with your values:
```env
# Database connection string from Step 1
DATABASE_URL="postgresql://username:password@host:5432/tron_inventory"

# Generate this secret using: openssl rand -base64 32
NEXTAUTH_SECRET="your-generated-secret-here"

# Your application URL (use localhost for development)
NEXTAUTH_URL="http://localhost:3000"
```

To generate a secure NEXTAUTH_SECRET on Windows:
```powershell
# Using PowerShell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})
```

Or on Mac/Linux:
```bash
openssl rand -base64 32
```

### 4. Database Migration

Run the Prisma migrations to create all database tables:

```bash
npx prisma migrate dev --name init
```

This will create:
- users table
- warehouse_inventory table
- vehicle_inventory_items table
- vehicle_stocks table
- orders table
- order_items table

### 5. Seed Initial Data

Populate the database with initial inventory items and admin user:

```bash
npx prisma db seed
```

This creates:
- Default admin user (admin@tronsolar.com / admin123)
- 50 warehouse inventory items
- 52 vehicle inventory par level items

### 6. Start the Development Server

```bash
npm run dev
```

The application will start at [http://localhost:3000](http://localhost:3000)

### 7. First Login

1. Open [http://localhost:3000](http://localhost:3000)
2. You'll be redirected to the login page
3. Log in with:
   - Email: `admin@tronsolar.com`
   - Password: `admin123`

**⚠️ IMPORTANT**: Immediately create a new admin user with a secure password and deactivate the default admin account!

## Creating Your First Users

After logging in as admin:

1. Click "User Management" in the navigation
2. Click "Add User"
3. Fill in the form:
   - For Warehouse users: Name, Email, Password, Role = Warehouse
   - For Field users: Name, Email, Password, Role = Field, Vehicle Number

### Example Field Worker:
- Name: John Smith
- Email: john.smith@tronsolar.com
- Password: SecurePassword123
- Role: Field Worker
- Vehicle Number: V101

### Example Warehouse User:
- Name: Jane Doe
- Email: jane.doe@tronsolar.com
- Password: SecurePassword123
- Role: Warehouse

## Verifying the Setup

### Test as Field Worker:
1. Log out from admin
2. Log in as a field worker
3. Try submitting a new order
4. Try updating vehicle stock

### Test as Warehouse:
1. Log in as warehouse user
2. View the submitted order
3. Try updating warehouse inventory
4. Process the order

## Common Issues and Solutions

### Issue: "Cannot connect to database"
**Solution**:
- Verify your DATABASE_URL is correct
- Ensure your database is running
- Check firewall rules allow connection

### Issue: "prisma command not found"
**Solution**:
```bash
npm install -g prisma
```

### Issue: "Module not found" errors
**Solution**:
```bash
rm -rf node_modules
npm install
```

### Issue: Prisma client errors
**Solution**:
```bash
npx prisma generate
```

### Issue: Can't log in
**Solution**:
- Verify you seeded the database
- Check that NEXTAUTH_SECRET is set in .env
- Clear browser cookies and try again

## Production Deployment

### Deploying to Vercel (Recommended)

1. Push your code to GitHub:
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/tron-inventory.git
git push -u origin main
```

2. Go to [vercel.com](https://vercel.com)
3. Import your GitHub repository
4. Add environment variables:
   - DATABASE_URL
   - NEXTAUTH_SECRET
   - NEXTAUTH_URL (set to your production URL)
5. Deploy!

### Post-Deployment Steps

1. Run migrations on production:
```bash
npx prisma migrate deploy
```

2. Seed production database:
```bash
npx prisma db seed
```

3. Create production users
4. Test all functionality

## Updating Inventory Data

If you need to modify the initial inventory items:

1. Edit `prisma/seed.ts`
2. Reset the database:
```bash
npx prisma migrate reset
```
3. This will drop all data and re-seed

## Backup and Maintenance

### Database Backups

For cloud databases, enable automatic backups in your provider's dashboard.

For local PostgreSQL:
```bash
pg_dump -U username tron_inventory > backup.sql
```

To restore:
```bash
psql -U username tron_inventory < backup.sql
```

### Regular Maintenance Tasks

- [ ] Weekly: Review low stock items
- [ ] Weekly: Verify all orders are processed
- [ ] Monthly: Audit user accounts
- [ ] Monthly: Review and update par levels
- [ ] Quarterly: Database backup verification

## Getting Help

For technical issues:
1. Check the [README.md](README.md) for usage instructions
2. Review error messages in the browser console
3. Check server logs in the terminal
4. Verify environment variables are correct

## Next Steps

Now that your system is set up:

1. [ ] Change the default admin password
2. [ ] Create warehouse user accounts
3. [ ] Create field worker accounts with vehicle numbers
4. [ ] Review and adjust inventory par levels
5. [ ] Train users on the system
6. [ ] Set up regular backup schedule
7. [ ] Plan deployment to production

## Security Checklist

Before going to production:

- [ ] Changed default admin password
- [ ] All passwords are strong (8+ characters, mixed case, numbers)
- [ ] NEXTAUTH_SECRET is randomly generated
- [ ] Database has proper access controls
- [ ] SSL/HTTPS is enabled in production
- [ ] Environment variables are secured
- [ ] Inactive users are deactivated

## Support

For questions or issues with the setup process, contact your system administrator or development team.
