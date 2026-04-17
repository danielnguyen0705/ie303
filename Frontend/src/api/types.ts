// API Types & Interfaces

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: ApiError;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export class ApiError extends Error {
  code: string;
  details?: unknown;

  constructor(code: string, message: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.details = details;
  }
}

// Request types
export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface UpdateProfileRequest {
  name?: string;
  email?: string;
  avatar?: string;
}

export interface SubmitAnswerRequest {
  questionId: string;
  answer: string;
  timeSpent: number; // seconds
}

export interface CompleteExerciseRequest {
  lessonId: string;
  answers: SubmitAnswerRequest[];
  totalTime: number;
}

export interface SubmitTestRequest {
  testId: string;
  answers: SubmitAnswerRequest[];
  totalTime: number;
}

export interface PurchaseItemRequest {
  itemId: string;
  quantity?: number;
}

export interface ClaimQuestRequest {
  questId: string;
}

// Filter & Sort types
export interface LeaderboardFilter {
  period?: "daily" | "weekly" | "monthly" | "all-time";
  league?: "bronze" | "silver" | "gold" | "platinum" | "diamond";
}

export interface QuestFilter {
  type?: "daily" | "weekly" | "special";
  status?: "active" | "completed" | "claimed";
}

export interface ShopFilter {
  type?: "powerup" | "cosmetic" | "subscription" | "boost";
  isPurchased?: boolean;
}

export type ShopItemType = "SKIP" | "VIP" | "AVATAR" | "BACKGROUND" | "EXP";

export interface ShopItemResponse {
  id: number;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  type: ShopItemType;
  durationDays: number | null;
  expMultiplier: number | null;
  active: boolean;
}

export interface ShopItemUpsertRequest {
  name: string;
  description?: string;
  price: number;
  type: ShopItemType;
  durationDays?: number | null;
  expMultiplier?: number | null;
  active?: boolean;
  imageFile?: File;
  imageUrl?: string;
}

export interface UserItemResponse {
  userItemId: number;
  shopItemId: number;
  name: string;
  imageUrl: string;
  type: ShopItemType;
  quantity: number;
  equipped: boolean;
  purchasedAt: string;
}

export interface BuyItemResponse {
  message: string;
  remainingCoin: number;
}

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  type: "powerup" | "cosmetic" | "subscription" | "boost";
  price: number;
  icon: string;
  duration?: number;
  effect?: string;
  isPurchased: boolean;
  imageUrl?: string;
  backendId?: number;
  active?: boolean;
}

// Topup page types
export type TopupBillingCycle = "monthly" | "annual";

export interface TopupVipPlan {
  id: "month" | "year" | "half-year";
  title: string;
  subtitle: string;
  monthlyPrice: number;
  annualPrice?: number;
  note?: string;
  features: string[];
  highlighted?: boolean;
}

export type TopupCoinPackIcon = "wallet" | "coins" | "gem" | "sparkles";

export interface TopupCoinPack {
  id: string;
  label: string;
  coins: number;
  priceUsd: number;
  icon: TopupCoinPackIcon;
  highlighted?: boolean;
}

// Payment domain types
export type PaymentOfferType = "VIP" | "COIN";

export type PaymentProvider = "MOCK" | "MOMO" | "VNPAY" | "BANK";

export type PaymentTransactionStatus =
  | "PENDING"
  | "SUCCESS"
  | "FAILED"
  | "CANCELLED";

export interface PaymentOffer {
  id: number;
  name: string;
  description?: string;
  type: PaymentOfferType;
  price: number;
  coinAmount?: number | null;
  durationDays?: number | null;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface PaymentOfferUpsertRequest {
  name: string;
  description?: string;
  type: PaymentOfferType;
  price: number;
  coinAmount?: number | null;
  durationDays?: number | null;
  active?: boolean;
}

export interface PaymentCheckoutRequest {
  provider: PaymentProvider;
  returnUrl: string;
}

export interface PaymentCheckoutResponse {
  transactionId?: number;
  transactionCode: string;
  paymentUrl: string;
  status?: PaymentTransactionStatus;
}

export interface PaymentWebhookRequest {
  transactionCode: string;
  provider: PaymentProvider;
  status: Extract<PaymentTransactionStatus, "SUCCESS" | "FAILED">;
  providerTransactionId?: string;
  signature?: string;
}

export interface PaymentTransaction {
  id: number;
  transactionCode: string;
  userId?: number;
  offerId?: number;
  provider: PaymentProvider;
  status: PaymentTransactionStatus;
  amount?: number;
  providerTransactionId?: string;
  paymentUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Leaderboard domain types
export type LeaderboardLeague =
  | "bronze"
  | "silver"
  | "gold"
  | "platinum"
  | "diamond";

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  avatar: string;
  xp: number;
  streak: number;
  accuracy: number;
  level: number;
  league: LeaderboardLeague;
}

export interface CoinLeaderboardEntryResponse {
  userId: number;
  rank: number;
  username: string;
  avatar: string;
  coin: number;
  score: number;
  streak: number;
  currentUser: boolean;
}

export interface CoinLeaderboardResponse {
  totalPlayers: number;
  leaderboard: CoinLeaderboardEntryResponse[];
  currentUser: CoinLeaderboardEntryResponse | null;
}

export interface ExpLeaderboardEntryResponse {
  userId: number;
  rank: number;
  username: string;
  avatar: string | null;
  exp: number;
  streak: number;
  currentUser: boolean;
}

export interface ExpLeaderboardResponse {
  totalPlayers: number;
  leaderboard: ExpLeaderboardEntryResponse[];
  currentUser: ExpLeaderboardEntryResponse | null;
}

export interface CollectorLeaderboardEntryRaw {
  userId: number;
  rank: number;
  username: string;
  avatar: string;
  collectibleCount: number;
  avatarCount: number;
  backgroundCount: number;
  collectionPercent: number;
  title: string;
  showcaseReady: boolean;
  currentUser: boolean;
}

export interface CollectorLeaderboardRawResponse {
  totalCollectors: number;
  totalCollectibleItems: number;
  leaderboard: CollectorLeaderboardEntryRaw[];
  currentUser: CollectorLeaderboardEntryRaw | null;
}

export interface CollectorLeaderboardEntryResponse extends CollectorLeaderboardEntryRaw {
  categoryCount: number;
}

export interface CollectorLeaderboardResponse {
  totalCollectors: number;
  totalCollectibleItems: number;
  leaderboard: CollectorLeaderboardEntryResponse[];
  currentUser: CollectorLeaderboardEntryResponse | null;
}
