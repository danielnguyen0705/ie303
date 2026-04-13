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

export type ShopItemType = "SKIP" | "VIP" | "AVATAR" | "BACKGROUND";

export interface ShopItemResponse {
  id: number;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  type: ShopItemType;
  durationDays: number | null;
  active: boolean;
}

export interface ShopItemUpsertRequest {
  name: string;
  description?: string;
  price: number;
  type: ShopItemType;
  durationDays?: number | null;
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
