import type {
  ApiResponse,
  CoinLeaderboardResponse,
  CollectorLeaderboardEntryRaw,
  CollectorLeaderboardRawResponse,
  CollectorLeaderboardEntryResponse,
  CollectorLeaderboardResponse,
} from "./types";
import { createError, request } from "./utils/http";

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

const normalizeLimit = (limit: number = DEFAULT_LIMIT): number => {
  if (!Number.isFinite(limit) || limit <= 0) {
    return DEFAULT_LIMIT;
  }

  return Math.min(MAX_LIMIT, Math.floor(limit));
};

const computeCategoryCount = (entry: {
  avatarCount: number;
  backgroundCount: number;
}): number => {
  return Number(entry.avatarCount > 0) + Number(entry.backgroundCount > 0);
};

const ensureAuthenticated = async (): Promise<ApiResponse<true>> => {
  const response = await request<{ id: number }>("/users/me", {
    method: "GET",
  });

  if (!response.success) {
    return createError(
      "Vui long dang nhap de xem bang xep hang",
      "AUTH_REQUIRED",
    );
  }

  return { success: true, data: true };
};

export async function getCoinLeaderboard(
  limit: number = DEFAULT_LIMIT,
): Promise<ApiResponse<CoinLeaderboardResponse>> {
  const authResponse = await ensureAuthenticated();
  if (!authResponse.success) {
    return createError(
      authResponse.error?.message || "Vui long dang nhap de xem bang xep hang",
      authResponse.error?.code || "AUTH_REQUIRED",
    );
  }

  const safeLimit = normalizeLimit(limit);
  const response = await request<CoinLeaderboardResponse>(
    `/leaderboards/coins?limit=${safeLimit}`,
    {
      method: "GET",
    },
  );

  if (!response.success) {
    return response;
  }

  if (!response.data) {
    return createError("Coin leaderboard data is missing", "INVALID_RESPONSE");
  }

  const sorted = [...response.data.leaderboard].sort((a, b) => {
    if (b.coin !== a.coin) return b.coin - a.coin;
    if (b.score !== a.score) return b.score - a.score;
    if (b.streak !== a.streak) return b.streak - a.streak;
    return a.rank - b.rank;
  });

  return {
    success: true,
    data: {
      ...response.data,
      leaderboard: sorted,
    },
  };
}

export async function getCollectorLeaderboard(
  limit: number = DEFAULT_LIMIT,
): Promise<ApiResponse<CollectorLeaderboardResponse>> {
  const authResponse = await ensureAuthenticated();
  if (!authResponse.success) {
    return createError(
      authResponse.error?.message || "Vui long dang nhap de xem bang xep hang",
      authResponse.error?.code || "AUTH_REQUIRED",
    );
  }

  const safeLimit = normalizeLimit(limit);
  const response = await request<CollectorLeaderboardRawResponse>(
    `/leaderboards/collectors?limit=${safeLimit}`,
    {
      method: "GET",
    },
  );

  if (!response.success) {
    return createError(
      response.error?.message || "Failed to fetch collector leaderboard",
      response.error?.code || "API_ERROR",
    );
  }

  if (!response.data) {
    return createError(
      "Collector leaderboard data is missing",
      "INVALID_RESPONSE",
    );
  }

  const enrich = (
    entry: CollectorLeaderboardEntryRaw,
  ): CollectorLeaderboardEntryResponse => ({
    ...entry,
    categoryCount: computeCategoryCount(entry),
  });

  const sorted = response.data.leaderboard.map(enrich).sort((a, b) => {
    if (b.collectibleCount !== a.collectibleCount) {
      return b.collectibleCount - a.collectibleCount;
    }

    if (b.categoryCount !== a.categoryCount) {
      return b.categoryCount - a.categoryCount;
    }

    if (b.avatarCount !== a.avatarCount) {
      return b.avatarCount - a.avatarCount;
    }

    if (b.backgroundCount !== a.backgroundCount) {
      return b.backgroundCount - a.backgroundCount;
    }

    return a.rank - b.rank;
  });

  return {
    success: true,
    data: {
      totalCollectors: response.data.totalCollectors,
      totalCollectibleItems: response.data.totalCollectibleItems,
      leaderboard: sorted,
      currentUser: response.data.currentUser
        ? enrich(response.data.currentUser)
        : null,
    },
  };
}
