package com.ie303.uifive.service;

import com.ie303.uifive.dto.res.CoinLeaderboardEntryResponse;
import com.ie303.uifive.dto.res.CoinLeaderboardResponse;
import com.ie303.uifive.dto.res.CollectorLeaderboardEntryResponse;
import com.ie303.uifive.dto.res.CollectorLeaderboardResponse;
import com.ie303.uifive.entity.ItemType;
import com.ie303.uifive.entity.Role;
import com.ie303.uifive.entity.User;
import com.ie303.uifive.entity.UserItem;
import com.ie303.uifive.repo.ShopItemRepo;
import com.ie303.uifive.repo.UserItemRepo;
import com.ie303.uifive.repo.UserRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.EnumSet;
import java.util.HashMap;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class LeaderboardService {

    private static final int DEFAULT_LIMIT = 10;
    private static final int MAX_LIMIT = 100;
    private static final Set<ItemType> COLLECTIBLE_TYPES = EnumSet.of(ItemType.AVATAR, ItemType.BACKGROUND);

    private final UserRepo userRepo;
    private final UserItemRepo userItemRepo;
    private final ShopItemRepo shopItemRepo;
    private final UserService userService;

    public CoinLeaderboardResponse getCoinLeaderboard(int limit) {
        int safeLimit = normalizeLimit(limit);
        List<User> users = getLeaderboardUsers();
        User currentUser = userService.getCurrentUser();

        List<CoinLeaderboardEntryResponse> rankedEntries = buildCoinEntries(users, currentUser);
        return new CoinLeaderboardResponse(
                rankedEntries.size(),
                rankedEntries.stream().limit(safeLimit).toList(),
                findCurrentCoinEntry(rankedEntries)
        );
    }

    public CollectorLeaderboardResponse getCollectorLeaderboard(int limit) {
        int safeLimit = normalizeLimit(limit);
        List<User> users = getLeaderboardUsers();
        User currentUser = userService.getCurrentUser();
        long totalCollectibleItems = shopItemRepo.countByTypeIn(COLLECTIBLE_TYPES);

        Map<Long, CollectorStats> statsByUserId = buildCollectorStats(users);
        List<CollectorLeaderboardEntryResponse> rankedEntries = buildCollectorEntries(
                users,
                statsByUserId,
                totalCollectibleItems,
                currentUser
        );

        return new CollectorLeaderboardResponse(
                rankedEntries.size(),
                totalCollectibleItems,
                rankedEntries.stream().limit(safeLimit).toList(),
                findCurrentCollectorEntry(rankedEntries)
        );
    }

    private List<User> getLeaderboardUsers() {
        return userRepo.findByRoleAndVerifiedTrueOrderByCoinDescScoreDescCreatedAtAsc(Role.USER);
    }

    private List<CoinLeaderboardEntryResponse> buildCoinEntries(List<User> users, User currentUser) {
        Comparator<User> comparator = Comparator
                .comparingInt(User::getCoin).reversed()
                .thenComparing(Comparator.comparingInt(User::getScore).reversed())
                .thenComparing(Comparator.comparingInt(User::getStreak).reversed())
                .thenComparing(User::getCreatedAt, Comparator.nullsLast(Comparator.naturalOrder()));

        List<User> sortedUsers = users.stream()
                .sorted(comparator)
                .toList();

        List<CoinLeaderboardEntryResponse> entries = new ArrayList<>();
        for (int i = 0; i < sortedUsers.size(); i++) {
            User user = sortedUsers.get(i);
            entries.add(new CoinLeaderboardEntryResponse(
                    user.getId(),
                    i + 1,
                    user.getUsername(),
                    user.getAvatar(),
                    user.getCoin(),
                    user.getScore(),
                    user.getStreak(),
                    currentUser != null && user.getId().equals(currentUser.getId())
            ));
        }

        return entries;
    }

    private Map<Long, CollectorStats> buildCollectorStats(List<User> users) {
        Map<Long, CollectorStats> statsByUserId = new HashMap<>();
        users.forEach(user -> statsByUserId.put(user.getId(), new CollectorStats()));

        List<UserItem> userItems = userItemRepo.findByUserIn(users);
        for (UserItem userItem : userItems) {
            if (userItem.getQuantity() <= 0 || userItem.getItem() == null) {
                continue;
            }

            ItemType type = userItem.getItem().getType();
            if (!COLLECTIBLE_TYPES.contains(type)) {
                continue;
            }

            CollectorStats stats = statsByUserId.computeIfAbsent(userItem.getUser().getId(), ignored -> new CollectorStats());
            stats.collectItem(type, userItem.getItem().getId());
        }

        return statsByUserId;
    }

    private List<CollectorLeaderboardEntryResponse> buildCollectorEntries(
            List<User> users,
            Map<Long, CollectorStats> statsByUserId,
            long totalCollectibleItems,
            User currentUser
    ) {
        Comparator<User> comparator = Comparator
                .comparingInt((User user) -> getStats(statsByUserId, user).getCollectibleCount()).reversed()
                .thenComparing(Comparator.comparingInt((User user) -> getStats(statsByUserId, user).getCategoryCount()).reversed())
                .thenComparing(Comparator.comparingInt((User user) -> getStats(statsByUserId, user).getAvatarCount()).reversed())
                .thenComparing(Comparator.comparingInt((User user) -> getStats(statsByUserId, user).getBackgroundCount()).reversed())
                .thenComparing(Comparator.comparingInt(User::getCoin).reversed())
                .thenComparing(User::getCreatedAt, Comparator.nullsLast(Comparator.naturalOrder()));

        List<User> sortedUsers = users.stream()
                .sorted(comparator)
                .toList();

        List<CollectorLeaderboardEntryResponse> entries = new ArrayList<>();
        for (int i = 0; i < sortedUsers.size(); i++) {
            User user = sortedUsers.get(i);
            CollectorStats stats = getStats(statsByUserId, user);
            double percent = totalCollectibleItems == 0
                    ? 0
                    : stats.getCollectibleCount() * 100.0 / totalCollectibleItems;

            entries.add(new CollectorLeaderboardEntryResponse(
                    user.getId(),
                    i + 1,
                    user.getUsername(),
                    user.getAvatar(),
                    stats.getCollectibleCount(),
                    stats.getAvatarCount(),
                    stats.getBackgroundCount(),
                    percent,
                    resolveCollectorTitle(percent, stats),
                    stats.isShowcaseReady(),
                    currentUser != null && user.getId().equals(currentUser.getId())
            ));
        }

        return entries;
    }

    private CoinLeaderboardEntryResponse findCurrentCoinEntry(List<CoinLeaderboardEntryResponse> entries) {
        return entries.stream()
                .filter(CoinLeaderboardEntryResponse::currentUser)
                .findFirst()
                .orElse(null);
    }

    private CollectorStats getStats(Map<Long, CollectorStats> statsByUserId, User user) {
        return statsByUserId.getOrDefault(user.getId(), new CollectorStats());
    }

    private CollectorLeaderboardEntryResponse findCurrentCollectorEntry(List<CollectorLeaderboardEntryResponse> entries) {
        return entries.stream()
                .filter(CollectorLeaderboardEntryResponse::currentUser)
                .findFirst()
                .orElse(null);
    }

    private String resolveCollectorTitle(double percent, CollectorStats stats) {
        if (percent >= 80) {
            return "Bao tang di dong";
        }
        if (percent >= 50) {
            return "Nha suu tam";
        }
        if (stats.isShowcaseReady()) {
            return "Tu do thoi trang";
        }
        if (stats.getCollectibleCount() > 0) {
            return "San do";
        }
        return "Nguoi moi";
    }

    private int normalizeLimit(int limit) {
        if (limit <= 0) {
            return DEFAULT_LIMIT;
        }
        return Math.min(limit, MAX_LIMIT);
    }

    private static class CollectorStats {
        private final Set<Long> avatarIds = new java.util.HashSet<>();
        private final Set<Long> backgroundIds = new java.util.HashSet<>();

        void collectItem(ItemType type, Long itemId) {
            if (type == ItemType.AVATAR) {
                avatarIds.add(itemId);
            } else if (type == ItemType.BACKGROUND) {
                backgroundIds.add(itemId);
            }
        }

        int getAvatarCount() {
            return avatarIds.size();
        }

        int getBackgroundCount() {
            return backgroundIds.size();
        }

        int getCollectibleCount() {
            return avatarIds.size() + backgroundIds.size();
        }

        int getCategoryCount() {
            int count = 0;
            if (!avatarIds.isEmpty()) {
                count++;
            }
            if (!backgroundIds.isEmpty()) {
                count++;
            }
            return count;
        }

        boolean isShowcaseReady() {
            return !avatarIds.isEmpty() && !backgroundIds.isEmpty();
        }
    }
}
