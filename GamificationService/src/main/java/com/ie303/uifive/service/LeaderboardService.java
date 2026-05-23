package com.ie303.uifive.service;

import com.ie303.uifive.dto.res.CoinLeaderboardEntryResponse;
import com.ie303.uifive.dto.res.CoinLeaderboardResponse;
import com.ie303.uifive.dto.res.CollectorLeaderboardEntryResponse;
import com.ie303.uifive.dto.res.CollectorLeaderboardResponse;
import com.ie303.uifive.dto.res.ExpLeaderboardEntryResponse;
import com.ie303.uifive.dto.res.ExpLeaderboardResponse;
import com.ie303.uifive.entity.ItemType;
import com.ie303.uifive.entity.Role;
import com.ie303.uifive.entity.User;
import com.ie303.uifive.repo.ShopItemRepo;
import com.ie303.uifive.repo.UserItemRepo;
import com.ie303.uifive.repo.UserRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.EnumSet;
import java.util.HashMap;
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

    public ExpLeaderboardResponse getExpLeaderboard(int limit) {
        int safeLimit = normalizeLimit(limit);
        List<User> users = getExpLeaderboardUsers();
        User currentUser = userService.getCurrentUser();

        List<ExpLeaderboardEntryResponse> rankedEntries = buildExpEntries(users, currentUser);
        return new ExpLeaderboardResponse(
                rankedEntries.size(),
                rankedEntries.stream().limit(safeLimit).toList(),
                findCurrentExpEntry(rankedEntries)
        );
    }

    private List<User> getLeaderboardUsers() {
        return userRepo.findByRoleAndVerifiedTrueOrderByCoinDescScoreDescStreakDescCreatedAtAsc(Role.USER);
    }

    private List<User> getExpLeaderboardUsers() {
        return userRepo.findByRoleAndVerifiedTrueOrderByExpDescStreakDescCoinDescCreatedAtAsc(Role.USER);
    }

    private List<CoinLeaderboardEntryResponse> buildCoinEntries(List<User> users, User currentUser) {
        List<CoinLeaderboardEntryResponse> entries = new ArrayList<>();
        for (int i = 0; i < users.size(); i++) {
            User user = users.get(i);
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

        List<Long> userIds = users.stream().map(User::getId).toList();
        List<Object[]> rows = userItemRepo.countCollectorItemsByUserIds(userIds, List.copyOf(COLLECTIBLE_TYPES));

        for (Object[] row : rows) {
            Long userId = ((Number) row[0]).longValue();
            ItemType type = (ItemType) row[1];
            int count = ((Number) row[2]).intValue();

            CollectorStats stats = statsByUserId.computeIfAbsent(userId, ignored -> new CollectorStats());
            stats.collectItem(type, count);
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

        List<User> sortedUsers = users.stream().sorted(comparator).toList();
        List<CollectorLeaderboardEntryResponse> entries = new ArrayList<>();

        for (int i = 0; i < sortedUsers.size(); i++) {
            User user = sortedUsers.get(i);
            CollectorStats stats = getStats(statsByUserId, user);
            double percent = totalCollectibleItems == 0 ? 0 : stats.getCollectibleCount() * 100.0 / totalCollectibleItems;

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

    private List<ExpLeaderboardEntryResponse> buildExpEntries(List<User> users, User currentUser) {
        List<ExpLeaderboardEntryResponse> entries = new ArrayList<>();
        for (int i = 0; i < users.size(); i++) {
            User user = users.get(i);
            entries.add(new ExpLeaderboardEntryResponse(
                    user.getId(),
                    i + 1,
                    user.getUsername(),
                    user.getAvatar(),
                    user.getExp(),
                    user.getStreak(),
                    currentUser != null && user.getId().equals(currentUser.getId())
            ));
        }
        return entries;
    }

    private CoinLeaderboardEntryResponse findCurrentCoinEntry(List<CoinLeaderboardEntryResponse> entries) {
        return entries.stream().filter(CoinLeaderboardEntryResponse::currentUser).findFirst().orElse(null);
    }

    private CollectorLeaderboardEntryResponse findCurrentCollectorEntry(List<CollectorLeaderboardEntryResponse> entries) {
        return entries.stream().filter(CollectorLeaderboardEntryResponse::currentUser).findFirst().orElse(null);
    }

    private ExpLeaderboardEntryResponse findCurrentExpEntry(List<ExpLeaderboardEntryResponse> entries) {
        return entries.stream().filter(ExpLeaderboardEntryResponse::currentUser).findFirst().orElse(null);
    }

    private CollectorStats getStats(Map<Long, CollectorStats> statsByUserId, User user) {
        return statsByUserId.getOrDefault(user.getId(), new CollectorStats());
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
        private int avatarCount;
        private int backgroundCount;

        void collectItem(ItemType type, int count) {
            if (type == ItemType.AVATAR) {
                avatarCount += count;
            } else if (type == ItemType.BACKGROUND) {
                backgroundCount += count;
            }
        }

        int getAvatarCount() {
            return avatarCount;
        }

        int getBackgroundCount() {
            return backgroundCount;
        }

        int getCollectibleCount() {
            return avatarCount + backgroundCount;
        }

        int getCategoryCount() {
            int count = 0;
            if (avatarCount > 0) {
                count++;
            }
            if (backgroundCount > 0) {
                count++;
            }
            return count;
        }

        boolean isShowcaseReady() {
            return avatarCount > 0 && backgroundCount > 0;
        }
    }
}
