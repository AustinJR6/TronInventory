/**
 * © 2025 Lysara LLC
 * Proprietary software. Internal use by licensed parties only.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { stripe, STRIPE_PRICES } from '@/lib/stripe';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { companyName, firstName, lastName, email, password, tier } = body;

    // Validation
    if (!companyName || !firstName || !lastName || !email || !password || !tier) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    if (!['BASE', 'ELITE'].includes(tier)) {
      return NextResponse.json(
        { error: 'Invalid tier selected' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 409 }
      );
    }

    // Create company slug
    const slug = companyName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    // Check if slug exists, make unique if needed
    let uniqueSlug = slug;
    let counter = 1;
    while (
      await prisma.company.findUnique({ where: { slug: uniqueSlug } })
    ) {
      uniqueSlug = `${slug}-${counter}`;
      counter++;
    }

    // Create Stripe customer
    const customer = await stripe.customers.create({
      email,
      name: `${firstName} ${lastName}`,
      metadata: {
        companyName,
        tier,
      },
    });

    // Get tier-specific price and limits
    const tierConfig = {
      BASE: {
        priceId: STRIPE_PRICES.BASE,
        includedBranches: 1,
        includedUsers: 10,
      },
      ELITE: {
        priceId: STRIPE_PRICES.ELITE,
        includedBranches: 5,
        includedUsers: 100,
      },
    };

    const config = tierConfig[tier as 'BASE' | 'ELITE'];

    // Create Stripe Checkout Session
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customer.id,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: config.priceId,
          quantity: 1,
        },
      ],
      subscription_data: {
        trial_period_days: 14,
        metadata: {
          companyName,
          tier,
          email,
        },
      },
      metadata: {
        companyName,
        companySlug: uniqueSlug,
        firstName,
        lastName,
        email,
        hashedPassword: await bcrypt.hash(password, 10),
        tier,
        includedBranches: config.includedBranches.toString(),
        includedUsers: config.includedUsers.toString(),
      },
      success_url: `${baseUrl}/signup/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/signup?cancelled=true`,
    });

    return NextResponse.json({
      checkoutUrl: checkoutSession.url,
      sessionId: checkoutSession.id,
    });
  } catch (error: any) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
