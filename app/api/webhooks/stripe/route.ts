/**
 * © 2025 Lysara LLC
 * Proprietary software. Internal use by licensed parties only.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';
import Stripe from 'stripe';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature')!;

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

/**
 * Handle successful checkout - create company, branch, license, and admin user
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const metadata = session.metadata!;

  try {
    // Check if company already exists
    const existingCompany = await prisma.company.findUnique({
      where: { slug: metadata.companySlug },
    });

    if (existingCompany) {
      console.log('Company already exists, skipping creation');
      return;
    }

    const subscription = await stripe.subscriptions.retrieve(
      session.subscription as string
    );

    // Create company
    const company = await prisma.company.create({
      data: {
        name: metadata.companyName,
        slug: metadata.companySlug,
        appName: 'Manifest',
      },
    });

    // Create default branch
    const branch = await prisma.branch.create({
      data: {
        companyId: company.id,
        name: 'Main Branch',
        city: 'Default',
        active: true,
      },
    });

    // Create admin user
    await prisma.user.create({
      data: {
        companyId: company.id,
        email: metadata.email,
        name: `${metadata.firstName} ${metadata.lastName}`,
        password: metadata.hashedPassword,
        role: 'ADMIN',
        branchId: branch.id,
        active: true,
      },
    });

    // Create license
    await prisma.license.create({
      data: {
        companyId: company.id,
        status: 'TRIAL',
        tier: metadata.tier as 'BASE' | 'ELITE',
        stripeCustomerId: session.customer as string,
        stripeSubscriptionId: session.subscription as string,
        stripePriceId: subscription.items.data[0].price.id,
        includedBranches: parseInt(metadata.includedBranches),
        includedUsers: parseInt(metadata.includedUsers),
        additionalBranches: 0,
        additionalUsers: 0,
        startsAt: new Date(),
        expiresAt: null,
      },
    });

    console.log(`Successfully created company: ${company.slug}`);
  } catch (error: any) {
    console.error('Error creating company:', error);
    throw error;
  }
}

/**
 * Handle subscription updates (tier changes, add-ons)
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  try {
    const license = await prisma.license.findUnique({
      where: { stripeSubscriptionId: subscription.id },
    });

    if (!license) {
      console.log('License not found for subscription:', subscription.id);
      return;
    }

    // Determine status based on subscription status
    let status: 'ACTIVE' | 'TRIAL' | 'SUSPENDED' | 'EXPIRED' = 'ACTIVE';
    if (subscription.status === 'trialing') {
      status = 'TRIAL';
    } else if (['past_due', 'unpaid'].includes(subscription.status)) {
      status = 'SUSPENDED';
    } else if (['canceled', 'incomplete_expired'].includes(subscription.status)) {
      status = 'EXPIRED';
    }

    // Update license
    await prisma.license.update({
      where: { id: license.id },
      data: {
        status,
        stripePriceId: subscription.items.data[0].price.id,
      },
    });

    console.log(`Updated license status to: ${status}`);
  } catch (error: any) {
    console.error('Error updating subscription:', error);
    throw error;
  }
}

/**
 * Handle subscription deletion
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  try {
    const license = await prisma.license.findUnique({
      where: { stripeSubscriptionId: subscription.id },
    });

    if (!license) {
      console.log('License not found for subscription:', subscription.id);
      return;
    }

    await prisma.license.update({
      where: { id: license.id },
      data: {
        status: 'EXPIRED',
        expiresAt: new Date(),
      },
    });

    console.log('Subscription deleted, license expired');
  } catch (error: any) {
    console.error('Error deleting subscription:', error);
    throw error;
  }
}

/**
 * Handle successful payment
 */
async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  try {
    const subscription = (invoice as any).subscription;
    const subscriptionId = typeof subscription === 'string'
      ? subscription
      : subscription?.id;

    if (!subscriptionId) return;

    const license = await prisma.license.findUnique({
      where: { stripeSubscriptionId: subscriptionId },
    });

    if (!license) {
      console.log('License not found for invoice:', invoice.id);
      return;
    }

    // If it was suspended due to payment failure, reactivate
    if (license.status === 'SUSPENDED') {
      await prisma.license.update({
        where: { id: license.id },
        data: { status: 'ACTIVE' },
      });
      console.log('License reactivated after payment');
    }
  } catch (error: any) {
    console.error('Error handling payment success:', error);
    throw error;
  }
}

/**
 * Handle failed payment
 */
async function handlePaymentFailed(invoice: Stripe.Invoice) {
  try {
    const subscription = (invoice as any).subscription;
    const subscriptionId = typeof subscription === 'string'
      ? subscription
      : subscription?.id;

    if (!subscriptionId) return;

    const license = await prisma.license.findUnique({
      where: { stripeSubscriptionId: subscriptionId },
    });

    if (!license) {
      console.log('License not found for invoice:', invoice.id);
      return;
    }

    // Suspend license on payment failure
    await prisma.license.update({
      where: { id: license.id },
      data: { status: 'SUSPENDED' },
    });

    console.log('License suspended due to payment failure');
  } catch (error: any) {
    console.error('Error handling payment failure:', error);
    throw error;
  }
}
