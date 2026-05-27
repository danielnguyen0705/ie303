package com.ie303.uifive.service;

import com.ie303.uifive.dto.res.DailyQuestClaimResponse;
import com.ie303.uifive.dto.res.DailyQuestResponse;
import com.ie303.uifive.dto.res.DailyQuestRewardItemResponse;
import com.ie303.uifive.dto.res.DailyQuestStatsResponse;
import com.ie303.uifive.dto.res.QuestBadgeResponse;
import com.ie303.uifive.dto.res.QuestRewardSummary;
import com.ie303.uifive.entity.DailyQuest;
import com.ie303.uifive.entity.DailyQuestType;
import com.ie303.uifive.entity.ItemType;
import com.ie303.uifive.entity.QuestTemplateEntity;
import com.ie303.uifive.entity.ShopItem;
import com.ie303.uifive.entity.QuestPeriod;
import com.ie303.uifive.entity.User;
import com.ie303.uifive.entity.UserItem;
import com.ie303.uifive.exception.AppException;
import com.ie303.uifive.exception.ErrorCode;
import com.ie303.uifive.repo.DailyQuestRepo;
import com.ie303.uifive.repo.ShopItemRepo;
import com.ie303.uifive.service.QuestTemplateService;
import com.ie303.uifive.repo.UserItemRepo;
import com.ie303.uifive.repo.UserRepo;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.function.Predicate;

@Service
@RequiredArgsConstructor
@Transactional
public class DailyQuestService {

    private static final ZoneId QUEST_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final String QUEST_REWARD_ITEM_NAME = "Daily Quest Skip Reward";

    private final DailyQuestRepo dailyQuestRepo;
    private final UserRepo userRepo;
    private final UserItemRepo userItemRepo;
    private final ShopItemRepo shopItemRepo;
    private final QuestTemplateService questTemplateService;
    private final UserService userService;
    private final JdbcTemplate jdbcTemplate;

    public List<DailyQuestResponse> getMyDailyQuests() {
        User user = userService.getCurrentUser();
        return ensureCurrentQuests(user).stream()
                .map(this::toResponse)
                .toList();
    }

    public DailyQuestResponse getQuest(Long questId) {
        User user = userService.getCurrentUser();
        DailyQuest quest = dailyQuestRepo.findByIdAndUserId(questId, user.getId())
                .orElseThrow(() -> new AppException(ErrorCode.INVALID_REQUEST, "Quest not found"));

        return toResponse(quest);
    }

    public DailyQuestClaimResponse claimQuest(Long questId) {
        User user = userService.getCurrentUser();
        DailyQuest quest = dailyQuestRepo.findByIdAndUserId(questId, user.getId())
                .orElseThrow(() -> new AppException(ErrorCode.INVALID_REQUEST, "Quest not found"));

        LocalDate today = LocalDate.now(QUEST_ZONE);
        if (!isQuestActiveToday(quest, today)) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "This quest has expired");
        }

        if (quest.getClaimedAt() != null) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "Quest reward already claimed");
        }

        int progress = resolveProgress(quest, quest.getQuestDate());
        if (progress < quest.getTargetAmount()) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "Quest is not completed yet");
        }

        user.setCoin(user.getCoin() + quest.getCoinsReward());
        user.setExp(user.getExp() + quest.getExpReward());
        userRepo.save(user);

        List<DailyQuestRewardItemResponse> rewardItems = grantRewardItems(user, quest);

        quest.setClaimedAt(LocalDateTime.now(QUEST_ZONE));
        dailyQuestRepo.save(quest);

        DailyQuestResponse questResponse = toResponse(quest);
        return new DailyQuestClaimResponse(
                questResponse,
                new QuestRewardSummary(quest.getExpReward(), quest.getCoinsReward(), rewardItems)
        );
    }

    public DailyQuestStatsResponse getQuestStats() {
        User user = userService.getCurrentUser();
        List<DailyQuest> quests = dailyQuestRepo.findByUserIdAndClaimedAtIsNotNullOrderByClaimedAtAsc(user.getId());

        long totalCompleted = quests.size();
        long totalActive = ensureCurrentQuests(user).stream()
                .filter(quest -> quest.getClaimedAt() == null)
                .count();
        long totalXPEarned = quests.stream()
                .mapToLong(DailyQuest::getExpReward)
                .sum();
        long totalCoinsEarned = quests.stream()
                .mapToLong(DailyQuest::getCoinsReward)
                .sum();
        long streakDays = quests.stream()
                .map(DailyQuest::getQuestDate)
                .distinct()
                .count();
        double completionRate = quests.isEmpty()
                ? 0.0
                : (totalCompleted * 100.0 / quests.size());

        return new DailyQuestStatsResponse(
                totalCompleted,
                totalActive,
                totalXPEarned,
                totalCoinsEarned,
                streakDays,
                completionRate
        );
    }

    public List<QuestBadgeResponse> getBadges() {
        User user = userService.getCurrentUser();
        List<DailyQuest> claimedQuests = dailyQuestRepo.findByUserIdAndClaimedAtIsNotNullOrderByClaimedAtAsc(user.getId());

        int totalClaimed = claimedQuests.size();
        int dailyClaimed = (int) claimedQuests.stream()
                .filter(quest -> quest.getQuestPeriod() != QuestPeriod.WEEKLY)
                .count();
        int weeklyClaimed = (int) claimedQuests.stream()
                .filter(quest -> quest.getQuestPeriod() == QuestPeriod.WEEKLY)
                .count();
        int totalCoins = claimedQuests.stream()
                .mapToInt(DailyQuest::getCoinsReward)
                .sum();
        int totalExp = claimedQuests.stream()
                .mapToInt(DailyQuest::getExpReward)
                .sum();

        return List.of(
                buildBadge(
                        "first-quest",
                        "First Claim",
                        "Claim your first quest reward.",
                        "gift",
                        "special",
                        totalClaimed,
                        1,
                        findUnlockTimeByCount(claimedQuests, quest -> true, 1)
                ),
                buildBadge(
                        "daily-starter",
                        "Daily Starter",
                        "Claim 5 daily quests.",
                        "calendar-check",
                        "streak",
                        dailyClaimed,
                        5,
                        findUnlockTimeByCount(claimedQuests, quest -> quest.getQuestPeriod() != QuestPeriod.WEEKLY, 5)
                ),
                buildBadge(
                        "weekly-challenger",
                        "Weekly Challenger",
                        "Claim 1 weekly quest.",
                        "badge-check",
                        "mastery",
                        weeklyClaimed,
                        1,
                        findUnlockTimeByCount(claimedQuests, quest -> quest.getQuestPeriod() == QuestPeriod.WEEKLY, 1)
                ),
                buildBadge(
                        "coin-collector",
                        "Coin Collector",
                        "Earn 500 coins from quests.",
                        "coins",
                        "special",
                        totalCoins,
                        500,
                        findUnlockTimeByCumulative(claimedQuests, 500, true)
                ),
                buildBadge(
                        "xp-hunter",
                        "XP Hunter",
                        "Earn 1000 XP from quests.",
                        "zap",
                        "learning",
                        totalExp,
                        1000,
                        findUnlockTimeByCumulative(claimedQuests, 1000, false)
                )
        );
    }

    private List<DailyQuest> ensureCurrentQuests(User user) {
        LocalDate today = LocalDate.now(QUEST_ZONE);
        LocalDate weekStart = today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));

        List<DailyQuest> quests = new ArrayList<>();
        quests.addAll(ensureQuestsForTemplates(
                user,
                today,
                QuestPeriod.DAILY,
                questTemplateService.getActiveTemplates(QuestPeriod.DAILY)
        ));
        quests.addAll(ensureQuestsForTemplates(
                user,
                weekStart,
                QuestPeriod.WEEKLY,
                questTemplateService.getActiveTemplates(QuestPeriod.WEEKLY)
        ));
        quests.sort(Comparator
                .comparing((DailyQuest quest) -> quest.getQuestPeriod() == QuestPeriod.WEEKLY)
                .thenComparing(DailyQuest::getSortOrder));

        return quests;
    }

    private List<DailyQuest> ensureQuestsForTemplates(
            User user,
            LocalDate questDate,
            QuestPeriod questPeriod,
            List<QuestTemplateEntity> templates
    ) {
        List<DailyQuest> quests = dailyQuestRepo.findByUserIdAndQuestDateAndQuestPeriodOrderBySortOrderAsc(
                user.getId(),
                questDate,
                questPeriod
        );
        final List<DailyQuest> questsSnapshot = quests;

        List<DailyQuest> missing = templates.stream()
                .filter(template -> questsSnapshot.stream().noneMatch(quest -> quest.getQuestType() == template.getQuestType()))
                .map(template -> buildQuest(user, questDate, questPeriod, template))
                .toList();

        if (!missing.isEmpty()) {
            dailyQuestRepo.saveAll(missing);
            quests = dailyQuestRepo.findByUserIdAndQuestDateAndQuestPeriodOrderBySortOrderAsc(
                    user.getId(),
                    questDate,
                    questPeriod
            );
        }

        return quests;
    }

    private DailyQuest buildQuest(User user, LocalDate questDate, QuestPeriod questPeriod, QuestTemplateEntity template) {
        DailyQuest quest = new DailyQuest();
        quest.setUser(user);
        quest.setQuestDate(questDate);
        quest.setQuestType(template.getQuestType());
        quest.setQuestPeriod(questPeriod);
        quest.setTitle(template.getTitle());
        quest.setDescription(template.getDescription());
        quest.setTargetAmount(template.getTargetAmount());
        quest.setCoinsReward(template.getCoinsReward());
        quest.setExpReward(template.getExpReward());
        quest.setRewardItemType(template.getRewardItemType());
        quest.setRewardItemQuantity(template.getRewardItemQuantity());
        quest.setSortOrder(template.getSortOrder());
        return quest;
    }

    private DailyQuestResponse toResponse(DailyQuest quest) {
        int progress = resolveProgress(quest, quest.getQuestDate());
        String status = resolveStatus(quest, progress);
        return new DailyQuestResponse(
                String.valueOf(quest.getId()),
                quest.getTitle(),
                quest.getDescription(),
                quest.getQuestPeriod() == QuestPeriod.WEEKLY ? "weekly" : "daily",
                quest.getQuestType(),
                progress,
                quest.getTargetAmount(),
                quest.getExpReward(),
                quest.getCoinsReward(),
                getQuestEndDate(quest).atStartOfDay(QUEST_ZONE).toLocalDateTime().toString(),
                status,
                buildRewardItems(quest)
        );
    }

    private String resolveStatus(DailyQuest quest, int progress) {
        if (quest.getClaimedAt() != null) {
            return "claimed";
        }

        if (progress >= quest.getTargetAmount()) {
            return "completed";
        }

        return "active";
    }

    private boolean isQuestActiveToday(DailyQuest quest, LocalDate today) {
        LocalDate start = quest.getQuestDate();
        LocalDate end = getQuestEndDate(quest);
        return !today.isBefore(start) && today.isBefore(end);
    }

    private LocalDate getQuestEndDate(DailyQuest quest) {
        return quest.getQuestDate().plusDays(quest.getQuestPeriod() == QuestPeriod.WEEKLY ? 7 : 1);
    }

    private int resolveProgress(DailyQuest quest, LocalDate questDate) {
        LocalDateTime from = questDate.atStartOfDay();
        LocalDateTime to = getQuestEndDate(quest).atStartOfDay();

        return switch (quest.getQuestType()) {
            case LESSON_COMPLETION ->
                    countCompletedLessons(quest.getUser().getId(), from, to);
            case QUESTION_ANSWERING ->
                    countAnsweredQuestions(quest.getUser().getId(), from, to);
            case SKIP_USAGE ->
                    countUsedSkips(quest.getUser().getId(), from, to);
        };
    }

    private int countCompletedLessons(Long userId, LocalDateTime from, LocalDateTime to) {
        Integer count = jdbcTemplate.queryForObject(
                """
                select count(*)
                from user_lesson_progress
                where user_id = ?
                  and completed = true
                  and completed_at >= ?
                  and completed_at < ?
                """,
                Integer.class,
                userId,
                java.sql.Timestamp.valueOf(from),
                java.sql.Timestamp.valueOf(to)
        );

        return count == null ? 0 : count;
    }

    private int countAnsweredQuestions(Long userId, LocalDateTime from, LocalDateTime to) {
        Integer count = jdbcTemplate.queryForObject(
                """
                select count(*)
                from user_question_history
                where user_id = ?
                  and answered_at >= ?
                  and answered_at < ?
                """,
                Integer.class,
                userId,
                java.sql.Timestamp.valueOf(from),
                java.sql.Timestamp.valueOf(to)
        );

        return count == null ? 0 : count;
    }

    private int countUsedSkips(Long userId, LocalDateTime from, LocalDateTime to) {
        Integer count = jdbcTemplate.queryForObject(
                """
                select count(*)
                from skip_usage_logs
                where user_id = ?
                  and used_at >= ?
                  and used_at < ?
                """,
                Integer.class,
                userId,
                java.sql.Timestamp.valueOf(from),
                java.sql.Timestamp.valueOf(to)
        );

        return count == null ? 0 : count;
    }

    private List<DailyQuestRewardItemResponse> buildRewardItems(DailyQuest quest) {
        if (quest.getRewardItemType() == null || quest.getRewardItemQuantity() <= 0) {
            return List.of();
        }

        ShopItem rewardItem = resolveQuestRewardItem(quest.getRewardItemType());
        return List.of(new DailyQuestRewardItemResponse(
                rewardItem.getId(),
                rewardItem.getName(),
                rewardItem.getImageUrl(),
                rewardItem.getType(),
                quest.getRewardItemQuantity()
        ));
    }

    private List<DailyQuestRewardItemResponse> grantRewardItems(User user, DailyQuest quest) {
        if (quest.getRewardItemType() == null || quest.getRewardItemQuantity() <= 0) {
            return List.of();
        }

        ShopItem rewardItem = resolveQuestRewardItem(quest.getRewardItemType());
        UserItem userItem = userItemRepo.findByUserAndItem(user, rewardItem)
                .orElseGet(() -> {
                    UserItem created = new UserItem();
                    created.setUser(user);
                    created.setItem(rewardItem);
                    created.setQuantity(0);
                    created.setEquipped(false);
                    return created;
                });

        userItem.setQuantity(userItem.getQuantity() + quest.getRewardItemQuantity());
        userItemRepo.save(userItem);

        return List.of(new DailyQuestRewardItemResponse(
                rewardItem.getId(),
                rewardItem.getName(),
                rewardItem.getImageUrl(),
                rewardItem.getType(),
                quest.getRewardItemQuantity()
        ));
    }

    private ShopItem resolveQuestRewardItem(ItemType itemType) {
        return shopItemRepo.findFirstByNameAndType(QUEST_REWARD_ITEM_NAME, itemType)
                .orElseGet(() -> {
                    ShopItem item = new ShopItem();
                    item.setName(QUEST_REWARD_ITEM_NAME);
                    item.setDescription("A hidden reward item granted by quests.");
                    item.setPrice(0);
                    item.setImageUrl("");
                    item.setType(itemType);
                    item.setDurationDays(null);
                    item.setExpMultiplier(null);
                    item.setActive(false);
                    return shopItemRepo.save(item);
                });
    }

    private QuestBadgeResponse buildBadge(
            String id,
            String title,
            String description,
            String icon,
            String category,
            int progress,
            int requirement,
            LocalDateTime unlockedAt
    ) {
        return new QuestBadgeResponse(
                id,
                title,
                description,
                icon,
                category,
                progress < requirement,
                progress,
                requirement,
                unlockedAt == null ? null : unlockedAt.toString()
        );
    }

    private LocalDateTime findUnlockTimeByCount(
            List<DailyQuest> claimedQuests,
            Predicate<DailyQuest> filter,
            int requirement
    ) {
        int count = 0;
        for (DailyQuest quest : claimedQuests) {
            if (filter.test(quest)) {
                count++;
                if (count >= requirement) {
                    return quest.getClaimedAt();
                }
            }
        }
        return null;
    }

    private LocalDateTime findUnlockTimeByCumulative(
            List<DailyQuest> claimedQuests,
            int requirement,
            boolean useCoins
    ) {
        int total = 0;
        for (DailyQuest quest : claimedQuests) {
            total += useCoins ? quest.getCoinsReward() : quest.getExpReward();
            if (total >= requirement) {
                return quest.getClaimedAt();
            }
        }
        return null;
    }

}
