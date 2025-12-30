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

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
  
  try {
    // Check if this is from the wizard (has setupData) or old signup flow
    const isWizardSignup = subscription.metadata?.setupData !== undefined;

    if (isWizardSignup) {
      await handleWizardCheckout(session, subscription);
    } else {
      await handleLegacyCheckout(session, subscription);
    }
  } catch (error: any) {
    console.error('Error in checkout completion:', error);
    throw error;
  }
}

async function handleWizardCheckout(session: Stripe.Checkout.Session, subscription: Stripe.Subscription) {
  const setupData = JSON.parse(subscription.metadata.setupData || '{}');

  const existingCompany = await prisma.company.findUnique({
    where: { slug: setupData.slug },
  });

  if (existingCompany) {
    console.log('Company already exists, skipping creation');
    return;
  }

  const company = await prisma.company.create({
    data: {
      name: setupData.companyName,
      slug: setupData.slug,
      appName: 'Manifest',
      businessModel: setupData.businessModel || 'WAREHOUSE_ONLY',
    },
  });

  const branchMap = new Map();
  for (const branchData of setupData.branches) {
    const branch = await prisma.branch.create({
      data: {
        companyId: company.id,
        name: branchData.name,
        city: branchData.city,
        address: branchData.address || null,
        active: true,
      },
    });
    branchMap.set(branchData.name, branch.id);
  }

  const firstBranchId = Array.from(branchMap.values())[0];
  await prisma.user.create({
    data: {
      companyId: company.id,
      email: setupData.adminUser.email,
      name: `${setupData.adminUser.firstName} ${setupData.adminUser.lastName}`,
      password: setupData.adminUser.password,
      role: 'ADMIN',
      branchId: firstBranchId,
      active: true,
    },
  });

  const bcrypt = await import('bcryptjs');
  for (const userData of setupData.users || []) {
    const branchId = userData.branchName ? branchMap.get(userData.branchName) : firstBranchId;
    await prisma.user.create({
      data: {
        companyId: company.id,
        email: userData.email,
        name: userData.name,
        password: await bcrypt.hash(Math.random().toString(36), 10),
        role: userData.role,
        branchId: branchId || firstBranchId,
        active: true,
      },
    });
  }

  const tierLimits = getTierLimitsForWebhook(subscription.metadata.tier);
  await prisma.license.create({
    data: {
      companyId: company.id,
      status: 'TRIAL',
      tier: subscription.metadata.tier as any,
      stripeCustomerId: session.customer as string,
      stripeSubscriptionId: session.subscription as string,
      stripePriceId: subscription.items.data[0].price.id,
      includedBranches: tierLimits.includedBranches,
      includedUsers: tierLimits.includedUsers,
      additionalBranches: setupData.additionalBranches || 0,
      additionalUsers: setupData.additionalUsers || 0,
      startsAt: new Date(),
      expiresAt: null,
    },
  });

  console.log(`Successfully created company from wizard: ${company.slug}`);
}

async function handleLegacyCheckout(session: Stripe.Checkout.Session, subscription: Stripe.Subscription) {
  const metadata = session.metadata!;
  
  const existingCompany = await prisma.company.findUnique({
    where: { slug: metadata.companySlug },
  });

  if (existingCompany) {
    console.log('Company already exists, skipping creation');
    return;
  }

  const company = await prisma.company.create({
    data: {
      name: metadata.companyName,
      slug: metadata.companySlug,
      appName: 'Manifest',
      businessModel: 'WAREHOUSE_ONLY',
    },
  });

  const branch = await prisma.branch.create({
    data: {
      companyId: company.id,
      name: 'Main Branch',
      city: 'Default',
      active: true,
    },
  });

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

  await prisma.license.create({
    data: {
      companyId: company.id,
      status: 'TRIAL',
      tier: (metadata.tier as any) || 'BASE',
      stripeCustomerId: session.customer as string,
      stripeSubscriptionId: session.subscription as string,
      stripePriceId: subscription.items.data[0].price.id,
      includedBranches: parseInt(metadata.includedBranches || '1'),
      includedUsers: parseInt(metadata.includedUsers || '10'),
      additionalBranches: 0,
      additionalUsers: 0,
      startsAt: new Date(),
      expiresAt: null,
    },
  });

  console.log(`Successfully created company (legacy): ${company.slug}`);
}

function getTierLimitsForWebhook(tier: string): { includedBranches: number; includedUsers: number } {
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
