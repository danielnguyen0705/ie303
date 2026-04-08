// Shop API

import { shopItems, getAvailableShopItems, currentUser } from '@/data/mockData';
import { simulateApiCall, createErrorResponse } from './client';
import type { ApiResponse, ShopFilter, PurchaseItemRequest } from './types';
import type { ShopItem } from '@/data/mockData';

/**
 * Get all shop items
 */
export async function getAllShopItems(filter?: ShopFilter): Promise<ApiResponse<ShopItem[]>> {
  let filteredItems = [...shopItems];

  if (filter?.type) {
    filteredItems = filteredItems.filter(i => i.type === filter.type);
  }

  if (filter?.isPurchased !== undefined) {
    filteredItems = filteredItems.filter(i => i.isPurchased === filter.isPurchased);
  }

  return simulateApiCall(filteredItems);
}

/**
 * Get available shop items (not purchased)
 */
export async function getAvailableItems(): Promise<ApiResponse<ShopItem[]>> {
  const available = getAvailableShopItems();
  return simulateApiCall(available);
}

/**
 * Get shop items by type
 */
export async function getItemsByType(
  type: 'powerup' | 'cosmetic' | 'subscription' | 'boost'
): Promise<ApiResponse<ShopItem[]>> {
  const filtered = shopItems.filter(i => i.type === type);
  return simulateApiCall(filtered);
}

/**
 * Get single shop item
 */
export async function getShopItem(itemId: string): Promise<ApiResponse<ShopItem>> {
  const item = shopItems.find(i => i.id === itemId);
  
  if (!item) {
    return createErrorResponse('Item not found', 'NOT_FOUND');
  }

  return simulateApiCall(item);
}

/**
 * Purchase item
 */
export async function purchaseItem(data: PurchaseItemRequest): Promise<
  ApiResponse<{
    item: ShopItem;
    transaction: {
      id: string;
      itemId: string;
      price: number;
      timestamp: string;
    };
    newBalance: number;
  }>
> {
  const item = shopItems.find(i => i.id === data.itemId);
  
  if (!item) {
    return createErrorResponse('Item not found', 'NOT_FOUND');
  }

  if (item.isPurchased) {
    return createErrorResponse('Item already purchased', 'INVALID_STATE');
  }

  // Check balance
  if (currentUser.coins < item.price) {
    return createErrorResponse('Insufficient coins', 'INSUFFICIENT_FUNDS');
  }

  const purchasedItem: ShopItem = {
    ...item,
    isPurchased: true,
  };

  const newBalance = currentUser.coins - item.price;

  return simulateApiCall({
    item: purchasedItem,
    transaction: {
      id: `txn-${Date.now()}`,
      itemId: item.id,
      price: item.price,
      timestamp: new Date().toISOString(),
    },
    newBalance,
  });
}

/**
 * Get purchased items
 */
export async function getPurchasedItems(): Promise<ApiResponse<ShopItem[]>> {
  const purchased = shopItems.filter(i => i.isPurchased);
  return simulateApiCall(purchased);
}

/**
 * Get purchase history
 */
export async function getPurchaseHistory(): Promise<
  ApiResponse<
    Array<{
      id: string;
      itemId: string;
      itemName: string;
      price: number;
      timestamp: string;
      status: 'completed' | 'pending' | 'refunded';
    }>
  >
> {
  return simulateApiCall([
    {
      id: 'txn-001',
      itemId: 'item-002',
      itemName: 'Streak Freeze',
      price: 30,
      timestamp: '2026-04-05T10:30:00Z',
      status: 'completed',
    },
    {
      id: 'txn-002',
      itemId: 'item-006',
      itemName: 'Premium Monthly',
      price: 500,
      timestamp: '2024-03-01T12:00:00Z',
      status: 'completed',
    },
  ]);
}

/**
 * Apply powerup
 */
export async function applyPowerup(itemId: string): Promise<
  ApiResponse<{
    itemId: string;
    effect: string;
    duration: number; // seconds
    expiresAt: string;
    active: boolean;
  }>
> {
  const item = shopItems.find(i => i.id === itemId);
  
  if (!item) {
    return createErrorResponse('Item not found', 'NOT_FOUND');
  }

  if (!item.isPurchased) {
    return createErrorResponse('Item not purchased', 'FORBIDDEN');
  }

  if (item.type !== 'powerup' && item.type !== 'boost') {
    return createErrorResponse('Item is not a powerup', 'INVALID_TYPE');
  }

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + (item.duration || 1));

  return simulateApiCall({
    itemId,
    effect: item.effect || '',
    duration: (item.duration || 1) * 86400, // days to seconds
    expiresAt: expiresAt.toISOString(),
    active: true,
  });
}

/**
 * Get active powerups
 */
export async function getActivePowerups(): Promise<
  ApiResponse<
    Array<{
      itemId: string;
      itemName: string;
      effect: string;
      expiresAt: string;
      timeRemaining: number; // seconds
    }>
  >
> {
  return simulateApiCall([
    {
      itemId: 'item-002',
      itemName: 'Streak Freeze',
      effect: 'Protects streak for 1 day',
      expiresAt: '2026-04-08T10:30:00Z',
      timeRemaining: 72000,
    },
  ]);
}

/**
 * Get special offers
 */
export async function getSpecialOffers(): Promise<
  ApiResponse<
    Array<{
      id: string;
      itemId: string;
      item: ShopItem;
      originalPrice: number;
      discountPrice: number;
      discountPercentage: number;
      expiresAt: string;
      limited: boolean;
    }>
  >
> {
  return simulateApiCall([
    {
      id: 'offer-001',
      itemId: 'item-001',
      item: shopItems[0],
      originalPrice: 50,
      discountPrice: 35,
      discountPercentage: 30,
      expiresAt: '2026-04-10T00:00:00Z',
      limited: true,
    },
  ]);
}

/**
 * Refund item
 */
export async function refundItem(itemId: string): Promise<
  ApiResponse<{
    itemId: string;
    refundAmount: number;
    newBalance: number;
  }>
> {
  const item = shopItems.find(i => i.id === itemId);
  
  if (!item) {
    return createErrorResponse('Item not found', 'NOT_FOUND');
  }

  if (!item.isPurchased) {
    return createErrorResponse('Item not purchased', 'INVALID_STATE');
  }

  // Refund 80% of original price
  const refundAmount = Math.floor(item.price * 0.8);
  const newBalance = currentUser.coins + refundAmount;

  return simulateApiCall({
    itemId,
    refundAmount,
    newBalance,
  });
}

/**
 * Get coin balance
 */
export async function getCoinBalance(): Promise<
  ApiResponse<{
    balance: number;
    earnedTotal: number;
    spentTotal: number;
  }>
> {
  return simulateApiCall({
    balance: currentUser.coins,
    earnedTotal: 1680,
    spentTotal: 440,
  });
}

/**
 * Get coin earning history
 */
export async function getCoinHistory(limit: number = 10): Promise<
  ApiResponse<
    Array<{
      id: string;
      type: 'earned' | 'spent' | 'refund';
      amount: number;
      source: string;
      timestamp: string;
    }>
  >
> {
  return simulateApiCall([
    {
      id: 'coin-001',
      type: 'earned',
      amount: 10,
      source: 'Completed lesson',
      timestamp: '2026-04-07T14:30:00Z',
    },
    {
      id: 'coin-002',
      type: 'spent',
      amount: -30,
      source: 'Purchased Streak Freeze',
      timestamp: '2026-04-05T10:30:00Z',
    },
    {
      id: 'coin-003',
      type: 'earned',
      amount: 25,
      source: 'Completed test',
      timestamp: '2026-04-04T16:20:00Z',
    },
  ].slice(0, limit));
}
