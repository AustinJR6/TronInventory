import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import Stripe from 'stripe';
import type { BusinessModel, LicenseTier } from '@prisma/client';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-12-15.clover',
});

// Test GET handler to verify route is working
export async function GET() {
  return NextResponse.json({ message: 'Signup wizard API is working' });
}

interface SignupWizardData {
  tier: LicenseTier;
  companyName: string;
  businessModels: BusinessModel[];
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  branches: Array<{
    name: string;
    city: string;
    address?: string;
  }>;
  users: Array<{
    name: string;
    email: string;
    role: 'ADMIN' | 'WAREHOUSE' | 'FIELD' | 'SALES_REP' | 'DRIVER';
    branchName?: string;
  }>;
}

export async function POST(request: Request) {
  try {
    const data: SignupWizardData = await request.json();

    // Validation
    if (!data.companyName || !data.firstName || !data.lastName || !data.email || !data.password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (data.branches.length === 0) {
      return NextResponse.json({ error: 'At least one branch is required' }, { status: 400 });
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 400 });
    }

    // Determine business model for company
    let businessModel: BusinessModel = 'WAREHOUSE_ONLY';
    if (data.businessModels.includes('HYBRID')) {
      businessModel = 'HYBRID';
    } else if (data.businessModels.includes('DISTRIBUTION')) {
      businessModel = 'DISTRIBUTION';
    } else if (data.businessModels.includes('WAREHOUSE_ONLY')) {
      businessModel = 'WAREHOUSE_ONLY';
    }

    // Generate company slug
    const slug = data.companyName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    // Check if slug exists, add number if needed
    let uniqueSlug = slug;
    let counter = 1;
    while (await prisma.company.findUnique({ where: { slug: uniqueSlug } })) {
      uniqueSlug = `${slug}-${counter}`;
      counter++;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Calculate pricing
    const tierLimits = getTierLimits(data.tier);
    const additionalBranches = Math.max(0, data.branches.length - tierLimits.includedBranches);
    const additionalUsers = Math.max(0, data.users.length + 1 - tierLimits.includedUsers); // +1 for admin

    // Create Stripe customer
    const customer = await stripe.customers.create({
      email: data.email,
      name: `${data.firstName} ${data.lastName}`,
      metadata: {
        companyName: data.companyName,
        tier: data.tier,
        businessModel,
      },
    });

    // Get price ID based on tier
    const priceIds: Record<LicenseTier, string> = {
      BASE: process.env.STRIPE_BASE_PRICE_ID!,
      ELITE: process.env.STRIPE_ELITE_PRICE_ID!,
      DISTRIBUTION: process.env.STRIPE_DISTRIBUTION_PRICE_ID || process.env.STRIPE_ELITE_PRICE_ID!, // Fallback to ELITE if DISTRIBUTION not set
    };

    const priceId = priceIds[data.tier];

    if (!priceId) {
      throw new Error(`No Stripe price ID configured for tier: ${data.tier}`);
    }

    // Create checkout session
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
      {
        price: priceId,
        quantity: 1,
      },
    ];

    // Add additional branches if any
    if (additionalBranches > 0 && process.env.STRIPE_BRANCH_PRICE_ID) {
      lineItems.push({
        price: process.env.STRIPE_BRANCH_PRICE_ID,
        quantity: additionalBranches,
      });
    }

    // Add additional users if any
    if (additionalUsers > 0 && process.env.STRIPE_USER_PRICE_ID) {
      lineItems.push({
        price: process.env.STRIPE_USER_PRICE_ID,
        quantity: additionalUsers,
      });
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customer.id,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: lineItems,
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/signup/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/signup/wizard`,
      subscription_data: {
        trial_period_days: 14,
        metadata: {
          companyName: data.companyName,
          tier: data.tier,
          businessModel,
          setupData: JSON.stringify({
            companyName: data.companyName,
            slug: uniqueSlug,
            businessModel,
            adminUser: {
              firstName: data.firstName,
              lastName: data.lastName,
              email: data.email,
              password: hashedPassword,
            },
            branches: data.branches,
            users: data.users,
            additionalBranches,
            additionalUsers,
          }),
        },
      },
    });

    return NextResponse.json({
      checkoutUrl: checkoutSession.url,
      customerId: customer.id,
    });
  } catch (error: any) {
    console.error('Signup wizard error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create signup session' },
      { status: 500 }
    );
  }
}

function getTierLimits(tier: LicenseTier): { includedBranches: number; includedUsers: number } {
  switch (tier) {
    case 'BASE':
      return { includedBranches: 1, includedUsers: 10 };
    case 'ELITE':
      return { includedBranches: 5, includedUsers: 100 };
    case 'DISTRIBUTION':
      return { includedBranches: 10, includedUsers: 9999 };
    default:
      return { includedBranches: 1, includedUsers: 10 };
  }
}
