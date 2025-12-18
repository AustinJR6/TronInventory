# Database Setup - Quick Guide

## ⚠️ IMPORTANT: Get Your Database Password First!

Before continuing, you need your Supabase database password.

### Get Your Password:

1. Go to: https://supabase.com/dashboard/project/ezfbixnfmmdupyyafpja/settings/database
2. Scroll to "Database Password" section
3. If you didn't save it during project creation, click "Reset Database Password"
4. **COPY THE PASSWORD** - you won't see it again!

---

## Step-by-Step Setup

### 1. Update `.env` File

Open `c:\Users\raust\Tron Inventory\.env` and find this line:

```
DATABASE_URL="postgresql://postgres.ezfbixnfmmdupyyafpja:[YOUR-PASSWORD]@aws-0-us-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
```

Replace `[YOUR-PASSWORD]` with your actual database password.

**Example:** If your password is `Abc123XyzSecure!`, it should look like:
```
DATABASE_URL="postgresql://postgres.ezfbixnfmmdupyyafpja:Abc123XyzSecure!@aws-0-us-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
```

### 2. Generate Prisma Client

Open terminal in this folder and run:

```bash
npx prisma generate
```

You should see: "✔ Generated Prisma Client"

### 3. Create Database Tables

Run the migration:

```bash
npx prisma migrate dev --name init
```

This creates all the tables for your inventory system.

### 4. Seed Initial Data

Load the warehouse and vehicle inventory:

```bash
npx prisma db seed
```

This creates:
- Admin user (admin@tronsolar.com / admin123)
- 50 warehouse inventory items
- 52 vehicle inventory items

### 5. Start the Application

```bash
npm run dev
```

### 6. Login!

Open http://localhost:3000

Login with:
- **Email**: admin@tronsolar.com
- **Password**: admin123

⚠️ **Change this password immediately after first login!**

---

## Verify Everything Works

After logging in:

1. ✅ Click "Warehouse Inventory" - should see all items
2. ✅ Create a test field worker user
3. ✅ Log in as that field worker
4. ✅ Try submitting an order
5. ✅ Check vehicle stock form

---

## Troubleshooting

### "Can't reach database server"
- Check your password in `.env` - is it correct?
- No spaces or extra quotes around the password
- Password must be URL-encoded if it has special characters

### "Migration failed"
Try resetting:
```bash
npx prisma migrate reset
```
(Warning: This deletes all data)

### "Seed failed"
Run it again:
```bash
npx prisma db seed
```

### Still Having Issues?

1. Check your Supabase dashboard - is the project active?
2. Try the direct connection instead (port 5432)
3. Verify your password is correct

---

## Next Steps After Setup

1. **Change admin password** in User Management
2. **Create warehouse users**
3. **Create field worker users** (with vehicle numbers)
4. **Review inventory par levels**
5. **Train your team**

---

## Connection String Reference

Your Supabase connection details:

- **Project Ref**: ezfbixnfmmdupyyafpja
- **Project URL**: https://ezfbixnfmmdupyyafpja.supabase.co
- **Region**: US West 1
- **Session Pooler Port**: 6543 (recommended)
- **Direct Connection Port**: 5432 (alternative)

---

## Quick Commands Reference

```bash
# Test database connection
npx prisma db push

# View database in browser
npx prisma studio

# Reset database (deletes all data!)
npx prisma migrate reset

# Re-seed database
npx prisma db seed

# Start app
npm run dev

# Build for production
npm run build
```

---

**Ready to go? Just add your password to `.env` and run the commands above!**
