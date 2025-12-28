/**
 * © 2025 Lysara LLC
 * Proprietary software. Internal use by licensed parties only.
 */

import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not defined in environment variables');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-12-15.clover',
  typescript: true,
});

/**
 * Stripe Price IDs for subscription plans
 * You'll need to create these products in your Stripe Dashboard
 */
export const STRIPE_PRICES = {
  BASE: process.env.STRIPE_PRICE_BASE || 'price_base', // $49.99/mo
  ELITE: process.env.STRIPE_PRICE_ELITE || 'price_elite', // $99.99/mo
  BRANCH_ADDON: process.env.STRIPE_PRICE_BRANCH || 'price_branch', // $19.99/branch
  USER_ADDON: process.env.STRIPE_PRICE_USER || 'price_user', // $1.00/user
};

/**
 * Calculate total subscription cost based on tier and add-ons
 */
export function calculateSubscriptionCost(
  tier: 'BASE' | 'ELITE',
  additionalBranches: number = 0,
  additionalUsers: number = 0
): number {
  const basePrices = {
    BASE: 49.99,
    ELITE: 99.99,
  };

  const basePrice = basePrices[tier];
  const branchCost = additionalBranches * 19.99;
  const userCost = additionalUsers * 1.0;

  return basePrice + branchCost + userCost;
}

/**
 * Get tier details including what's included
 */
export function getTierDetails(tier: 'BASE' | 'ELITE') {
  if (tier === 'BASE') {
    return {
      name: 'BASE',
      price: 49.99,
      includedBranches: 1,
      includedUsers: 10,
      features: [
        'Inventory Tracking',
        'Order Management',
        'Vehicle Stock',
        'QR Code Scanning',
        'Part Requests',
        'Supplier Management',
        'Inventory Thresholds',
      ],
      excludedFeatures: ['PO System', 'AI BOM Builder', 'Lana AI Assistant'],
    };
  } else {
    return {
      name: 'ELITE',
      price: 99.99,
      includedBranches: 5,
      includedUsers: 100,
      features: [
        'All BASE Features',
        'PO System',
        'AI BOM Builder',
        'Lana AI Assistant',
        '5 Branches Included',
        '100 Users Included',
      ],
      excludedFeatures: [],
    };
  }
}
