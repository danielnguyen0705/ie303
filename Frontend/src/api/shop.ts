import type {
  ApiResponse,
  BuyItemResponse,
  PurchaseItemRequest,
  ShopFilter,
  ShopItem,
  ShopItemResponse,
  ShopItemType,
  UserItemResponse,
} from "./types";
import { createError, request } from "./utils/http";

const TYPE_TO_DISPLAY: Record<ShopItemType, ShopItem["type"]> = {
  SKIP: "powerup",
  VIP: "subscription",
  AVATAR: "cosmetic",
  BACKGROUND: "cosmetic",
  EXP: "boost",
};

const TYPE_TO_ICON: Record<ShopItemType, string> = {
  SKIP: "Zap",
  VIP: "Crown",
  AVATAR: "Sparkles",
  BACKGROUND: "Palette",
  EXP: "Shield",
};

const TYPE_TO_EFFECT: Record<ShopItemType, string | undefined> = {
  SKIP: "Skip one streak break",
  VIP: "Premium benefits during subscription",
  AVATAR: "Unlock avatar cosmetic",
  BACKGROUND: "Unlock background cosmetic",
  EXP: "Increase experience gain while active",
};

const toNumberId = (value: string | number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
};

const fetchActiveShopItems = async (): Promise<
  ApiResponse<ShopItemResponse[]>
> => request<ShopItemResponse[]>("/shop-items", { method: "GET" });

const fetchMyShopItems = async (): Promise<ApiResponse<UserItemResponse[]>> =>
  request<UserItemResponse[]>("/shop-items/my-items", {
    method: "GET",
  });

const toDisplayItem = (
  item: ShopItemResponse,
  purchasedIds: Set<number>,
): ShopItem => ({
  id: String(item.id),
  backendId: item.id,
  name: item.name,
  description: item.description || "",
  type: TYPE_TO_DISPLAY[item.type],
  price: item.price,
  icon: TYPE_TO_ICON[item.type],
  duration: item.durationDays ?? undefined,
  effect: TYPE_TO_EFFECT[item.type],
  isPurchased: purchasedIds.has(item.id),
  imageUrl: item.imageUrl,
  active: item.active,
});

const getPurchasedIdSet = async (): Promise<Set<number>> => {
  const myItemsResponse = await fetchMyShopItems();

  if (!myItemsResponse.success || !myItemsResponse.data) {
    return new Set<number>();
  }

  return new Set(myItemsResponse.data.map((item) => item.shopItemId));
};

/**
 * Get all active shop items
 */
export async function getActiveShopItems(): Promise<ApiResponse<ShopItem[]>> {
  const [itemsResponse, purchasedIds] = await Promise.all([
    fetchActiveShopItems(),
    getPurchasedIdSet(),
  ]);

  if (!itemsResponse.success || !itemsResponse.data) {
    return createError(
      itemsResponse.error?.message || "Failed to fetch shop items",
      itemsResponse.error?.code || "API_ERROR",
    );
  }

  return {
    success: true,
    data: itemsResponse.data.map((item) => toDisplayItem(item, purchasedIds)),
  };
}

/**
 * Get items owned by current user
 */
export async function getMyShopItems(): Promise<
  ApiResponse<UserItemResponse[]>
> {
  const response = await fetchMyShopItems();

  if (!response.success || !response.data) {
    return createError(
      response.error?.message || "Failed to fetch owned shop items",
      response.error?.code || "API_ERROR",
    );
  }

  return {
    success: true,
    data: response.data,
  };
}

/**
 * Get all shop items
 */
export async function getAllShopItems(
  filter?: ShopFilter,
): Promise<ApiResponse<ShopItem[]>> {
  const response = await getActiveShopItems();

  if (!response.success || !response.data) {
    return createError(
      response.error?.message || "Failed to fetch shop items",
      response.error?.code || "API_ERROR",
    );
  }

  let filteredItems = [...response.data];

  if (filter?.type) {
    filteredItems = filteredItems.filter((i) => i.type === filter.type);
  }

  if (filter?.isPurchased !== undefined) {
    filteredItems = filteredItems.filter(
      (i) => i.isPurchased === filter.isPurchased,
    );
  }

  return {
    success: true,
    data: filteredItems,
  };
}

/**
 * Get available shop items (not purchased)
 */
export async function getAvailableItems(): Promise<ApiResponse<ShopItem[]>> {
  return getAllShopItems({ isPurchased: false });
}

/**
 * Get shop items by type
 */
export async function getItemsByType(
  type: "powerup" | "cosmetic" | "subscription" | "boost",
): Promise<ApiResponse<ShopItem[]>> {
  return getAllShopItems({ type });
}

/**
 * Get single shop item
 */
export async function getShopItem(
  itemId: string,
): Promise<ApiResponse<ShopItem>> {
  const response = await getActiveShopItems();
  if (!response.success || !response.data) {
    return createError(
      response.error?.message || "Failed to fetch shop item",
      response.error?.code || "API_ERROR",
    );
  }

  const item = response.data.find((i) => i.id === itemId);
  if (!item) {
    return createError("Item not found", "NOT_FOUND");
  }

  return {
    success: true,
    data: item,
  };
}

/**
 * Purchase item
 */
export async function buyShopItem(
  itemId: string | number,
): Promise<ApiResponse<BuyItemResponse>> {
  const parsedItemId = toNumberId(itemId);

  if (!Number.isFinite(parsedItemId) || parsedItemId <= 0) {
    return createError("Invalid item id", "VALIDATION_ERROR");
  }

  const buyResponse = await request<BuyItemResponse>(
    `/shop-items/buy/${parsedItemId}`,
    {
      method: "POST",
    },
  );

  if (!buyResponse.success || !buyResponse.data) {
    return createError(
      buyResponse.error?.message || "Purchase failed",
      buyResponse.error?.code || "API_ERROR",
    );
  }

  return {
    success: true,
    data: buyResponse.data,
  };
}

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
  const itemId = toNumberId(data.itemId);
  if (!Number.isFinite(itemId) || itemId <= 0) {
    return createError("Invalid item id", "VALIDATION_ERROR");
  }

  const buyResponse = await buyShopItem(itemId);

  if (!buyResponse.success || !buyResponse.data) {
    return createError(
      buyResponse.error?.message || "Purchase failed",
      buyResponse.error?.code || "API_ERROR",
    );
  }

  const [allItemsResponse, profileResponse] = await Promise.all([
    getAllShopItems(),
    request<{ id: number; coin: number }>("/users/me", { method: "GET" }),
  ]);

  if (!allItemsResponse.success || !allItemsResponse.data) {
    return createError(
      allItemsResponse.error?.message ||
        "Purchase succeeded but failed to reload item",
      allItemsResponse.error?.code || "API_ERROR",
    );
  }

  const purchasedItem = allItemsResponse.data.find(
    (item) => Number(item.id) === itemId,
  );
  if (!purchasedItem) {
    return createError("Purchased item not found", "NOT_FOUND");
  }

  const newBalance =
    profileResponse.success && profileResponse.data
      ? profileResponse.data.coin
      : buyResponse.data.remainingCoin;

  return {
    success: true,
    data: {
      item: purchasedItem,
      transaction: {
        id: `txn-${Date.now()}`,
        itemId: purchasedItem.id,
        price: purchasedItem.price,
        timestamp: new Date().toISOString(),
      },
      newBalance,
    },
  };
}

/**
 * Use one SKIP item by user item id
 */
export async function useSkipItem(
  userItemId: string | number,
): Promise<ApiResponse<string>> {
  const parsedUserItemId = toNumberId(userItemId);

  if (!Number.isFinite(parsedUserItemId) || parsedUserItemId <= 0) {
    return createError("Invalid user item id", "VALIDATION_ERROR");
  }

  return request<string>(`/shop-items/use-skip/${parsedUserItemId}`, {
    method: "POST",
  });
}

/**
 * Equip owned avatar item
 */
export async function equipAvatar(
  shopItemId: string | number,
): Promise<ApiResponse<string>> {
  const parsedShopItemId = toNumberId(shopItemId);

  if (!Number.isFinite(parsedShopItemId) || parsedShopItemId <= 0) {
    return createError("Invalid shop item id", "VALIDATION_ERROR");
  }

  return request<string>(`/shop-items/equip/avatar/${parsedShopItemId}`, {
    method: "POST",
  });
}

/**
 * Equip owned background item
 */
export async function equipBackground(
  shopItemId: string | number,
): Promise<ApiResponse<string>> {
  const parsedShopItemId = toNumberId(shopItemId);

  if (!Number.isFinite(parsedShopItemId) || parsedShopItemId <= 0) {
    return createError("Invalid shop item id", "VALIDATION_ERROR");
  }

  return request<string>(`/shop-items/equip/background/${parsedShopItemId}`, {
    method: "POST",
  });
}

/**
 * Get purchased items
 */
export async function getPurchasedItems(): Promise<ApiResponse<ShopItem[]>> {
  const response = await getAllShopItems({ isPurchased: true });
  if (!response.success || !response.data) {
    return createError(
      response.error?.message || "Failed to fetch purchased items",
      response.error?.code || "API_ERROR",
    );
  }

  return {
    success: true,
    data: response.data,
  };
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
      status: "completed" | "pending" | "refunded";
    }>
  >
> {
  const history: Array<{
    id: string;
    itemId: string;
    itemName: string;
    price: number;
    timestamp: string;
    status: "completed" | "pending" | "refunded";
  }> = [
    {
      id: "txn-001",
      itemId: "2",
      itemName: "Shop purchase",
      price: 30,
      timestamp: new Date().toISOString(),
      status: "completed",
    },
  ];

  return {
    success: true,
    data: history,
  };
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
  return {
    success: true,
    data: {
      itemId,
      effect: "Powerup activated",
      duration: 86400,
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
      active: true,
    },
  };
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
  const ownedResponse = await fetchMyShopItems();

  if (!ownedResponse.success || !ownedResponse.data) {
    return {
      success: true,
      data: [],
    };
  }

  const now = Date.now();
  const powerups = ownedResponse.data
    .filter((item) => item.type === "SKIP" || item.type === "VIP")
    .map((item) => ({
      itemId: String(item.shopItemId),
      itemName: item.name,
      effect: item.type === "SKIP" ? "Skip one streak break" : "VIP active",
      expiresAt: new Date(now + 86400000).toISOString(),
      timeRemaining: 86400,
    }));

  return {
    success: true,
    data: powerups,
  };
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
  return {
    success: true,
    data: [],
  };
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
  return createError("Refund is not supported", "NOT_SUPPORTED");
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
  const profileResponse = await request<{ coin: number }>("/users/me", {
    method: "GET",
  });

  if (!profileResponse.success || !profileResponse.data) {
    return createError(
      profileResponse.error?.message || "Failed to fetch coin balance",
      profileResponse.error?.code || "API_ERROR",
    );
  }

  return {
    success: true,
    data: {
      balance: profileResponse.data.coin,
      earnedTotal: 0,
      spentTotal: 0,
    },
  };
}

/**
 * Get coin earning history
 */
export async function getCoinHistory(limit: number = 10): Promise<
  ApiResponse<
    Array<{
      id: string;
      type: "earned" | "spent" | "refund";
      amount: number;
      source: string;
      timestamp: string;
    }>
  >
> {
  const history: Array<{
    id: string;
    type: "earned" | "spent" | "refund";
    amount: number;
    source: string;
    timestamp: string;
  }> = [
    {
      id: "coin-001",
      type: "earned",
      amount: 10,
      source: "Completed lesson",
      timestamp: new Date().toISOString(),
    },
  ];

  return {
    success: true,
    data: history.slice(0, limit),
  };
}
