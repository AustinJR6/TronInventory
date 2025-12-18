# Supabase Setup Instructions

Your Supabase project has been created! Here's how to complete the setup.

## Step 1: Get Your Database Password

You need to retrieve your database password from Supabase:

### Option A: Find Your Saved Password
When you created the Supabase project, you were shown a database password. If you saved it, skip to Step 2.

### Option B: Reset Your Database Password
If you didn't save the password:

1. Go to your Supabase Dashboard: [https://supabase.com/dashboard/project/ezfbixnfmmdupyyafpja](https://supabase.com/dashboard/project/ezfbixnfmmdupyyafpja)
2. Click **"Project Settings"** (gear icon in the bottom left)
3. Click **"Database"** in the left sidebar
4. Scroll down to **"Database Password"** section
5. Click **"Reset Database Password"**
6. Copy the new password (you won't be able to see it again!)

## Step 2: Update Your .env File

1. Open the `.env` file in your project root
2. Find this line:
   ```
   DATABASE_URL="postgresql://postgres.ezfbixnfmmdupyyafpja:[YOUR-PASSWORD]@aws-0-us-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
   ```
3. Replace `[YOUR-PASSWORD]` with your actual database password
4. Save the file

### Example:
If your password is `MySecurePassword123`, the line should look like:
```
DATABASE_URL="postgresql://postgres.ezfbixnfmmdupyyafpja:MySecurePassword123@aws-0-us-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
```

## Step 3: Run Database Migrations

Now that your database is configured, set up the tables:

```bash
# Generate Prisma Client
npx prisma generate

# Create all database tables
npx prisma migrate dev --name init

# Seed the database with initial data
npx prisma db seed
```

## Step 4: Start the Application

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and log in with:
- Email: `admin@tronsolar.com`
- Password: `admin123`

## Troubleshooting

### Error: "Can't reach database server"
- Double-check your password in the `.env` file
- Make sure there are no extra spaces or quotes
- Verify you're using the Session pooler connection string (port 6543)

### Error: "Invalid connection string"
- Ensure the entire connection string is on one line
- Check that you didn't accidentally delete any characters
- Make sure the password doesn't contain special characters that need URL encoding

### Connection String Variations

**Recommended (Session pooler):**
```
postgresql://postgres.ezfbixnfmmdupyyafpja:PASSWORD@aws-0-us-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true
```

**Alternative (Direct connection):**
```
postgresql://postgres.ezfbixnfmmdupyyafpja:PASSWORD@aws-0-us-west-1.pooler.supabase.com:5432/postgres
```

## Verify Connection

To test your database connection:

```bash
npx prisma db push
```

If successful, you'll see: "The database is now in sync with your Prisma schema."

## Your Supabase Project Details

- **Project URL**: https://ezfbixnfmmdupyyafpja.supabase.co
- **Project Reference**: ezfbixnfmmdupyyafpja
- **Anon Key**: Already configured in `.env`
- **Dashboard**: https://supabase.com/dashboard/project/ezfbixnfmmdupyyafpja

## What Gets Created

When you run the migrations and seed, you'll get:

### Database Tables:
- ✅ users
- ✅ warehouse_inventory (50 items)
- ✅ vehicle_inventory_items (52 items)
- ✅ orders
- ✅ order_items
- ✅ vehicle_stocks
- ✅ vehicle_stock_items

### Initial Data:
- ✅ Admin user (admin@tronsolar.com / admin123)
- ✅ All warehouse inventory from your PDF
- ✅ All vehicle inventory items from your PDF

## Security Note

⚠️ **Never commit your `.env` file to Git!**

The `.env` file contains sensitive information and is already in `.gitignore`.

## Next Steps

After successful setup:

1. ✅ Change the default admin password
2. ✅ Create user accounts for your team
3. ✅ Review inventory par levels
4. ✅ Start using the system!

## Need Help?

Common issues and solutions:

1. **Forgot your password?** - Reset it in Supabase dashboard
2. **Can't connect?** - Check the connection string format
3. **Migration errors?** - Try `npx prisma migrate reset` (WARNING: deletes data)
4. **Seed errors?** - Run `npx prisma db seed` again

## Production Deployment

When deploying to production (Vercel, etc.):

1. Use the same DATABASE_URL in your production environment variables
2. Update NEXTAUTH_URL to your production domain
3. Generate a new NEXTAUTH_SECRET for production
4. Run migrations: `npx prisma migrate deploy`
5. Seed database: `npx prisma db seed`
