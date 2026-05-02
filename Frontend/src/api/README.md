# UIFIVE API Documentation

## 📚 Overview

API layer for UIFIVE user interfaces. All API calls are currently mocked with data from `/src/data/mockData.ts` and include simulated network delays.

## 🏗️ Structure

```
src/api/
├── index.ts              # Central exports
├── types.ts              # Shared TypeScript types
├── client.ts             # Base API utilities
├── auth.ts               # Authentication
├── users.ts              # User profile & stats
├── units.ts              # Units & curriculum
├── lessons.ts            # Lessons
├── exercises.ts          # Exercises (pronunciation, reading, quiz, listening)
├── tests.ts              # Tests & results
├── quests.ts             # Quests & achievements
├── leaderboard.ts        # Leaderboard & rankings
├── shop.ts               # Shop & purchases
└── notifications.ts      # User notifications
```

## 🚀 Quick Start

### Import

```typescript
// Import all APIs
import * as api from '@/api';

// Or import specific modules
import { authApi, userApi, unitApi } from '@/api';

// Or import individual functions
import { login, getCurrentUser, getAllUnits } from '@/api';
```

### Usage Example

```typescript
import { login, getAllUnits, getLeaderboard } from '@/api';

// Login
const loginResult = await login({
  email: 'user@example.com',
  password: 'password123',
});

if (loginResult.success) {
  console.log('Logged in:', loginResult.data);
}

// Get units
const unitsResult = await getAllUnits();
const units = unitsResult.data;

// Get leaderboard
const leaderboardResult = await getLeaderboard();
const topPlayers = leaderboardResult.data.data;
```

## 📖 API Modules

### 1. Authentication (`auth.ts`)

**Functions:**
- `login(credentials)` - Login user
- `register(data)` - Register new user
- `logout()` - Logout user
- `getCurrentUser()` - Get current user
- `refreshToken()` - Refresh auth token
- `resetPassword(email)` - Request password reset
- `changePassword(oldPass, newPass)` - Change password

**Example:**
```typescript
import { login, register } from '@/api';

// Login
const result = await login({
  email: 'scholar@uifive.edu',
  password: 'password123',
});

// Register
const newUser = await register({
  name: 'John Doe',
  email: 'john@example.com',
  password: 'securepass',
});
```

---

### 2. Users (`users.ts`)

**Functions:**
- `getUserProfile(userId?)` - Get user profile
- `updateUserProfile(data)` - Update profile
- `uploadAvatar(file)` - Upload avatar image
- `getUserStats()` - Get learning statistics
- `getUserHistory(limit)` - Get learning history
- `updatePreferences(prefs)` - Update preferences
- `deleteAccount(password)` - Delete account

**Example:**
```typescript
import { getUserProfile, updateUserProfile, getUserStats } from '@/api';

// Get profile
const profile = await getUserProfile();

// Update profile
await updateUserProfile({
  name: 'New Name',
  email: 'newemail@example.com',
});

// Get stats
const stats = await getUserStats();
console.log('Total XP:', stats.data.totalXP);
```

---

### 3. Units (`units.ts`)

**Functions:**
- `getAllUnits()` - Get all units
- `getUnitsBySemester(semester)` - Filter by semester
- `getUnit(unitId)` - Get single unit
- `getUnitProgress(unitId)` - Get progress
- `startUnit(unitId)` - Start a unit
- `completeUnit(unitId)` - Complete unit & get rewards
- `getCurriculumOverview()` - Get overview stats
- `getNextUnit()` - Get next recommended unit

**Example:**
```typescript
import { getAllUnits, getUnit, getUnitProgress } from '@/api';

// Get all units
const units = await getAllUnits();

// Get specific unit
const unit1 = await getUnit(1);

// Get progress
const progress = await getUnitProgress(1);
console.log('Progress:', progress.data.progress + '%');
```

---

### 4. Lessons (`lessons.ts`)

**Functions:**
- `getLessonsByUnit(unitId)` - Get unit's lessons
- `getLesson(lessonId)` - Get single lesson
- `getLessonContent(lessonId)` - Get full content
- `startLesson(lessonId)` - Start lesson
- `completeLesson(lessonId, score, time)` - Complete & get rewards
- `getLessonProgress(lessonId)` - Get progress
- `saveLessonProgress(lessonId, progress)` - Save for resume
- `getSavedProgress(lessonId)` - Get saved progress

**Example:**
```typescript
import { getLessonsByUnit, completeLesson } from '@/api';

// Get lessons for unit 1
const lessons = await getLessonsByUnit(1);

// Complete lesson
const result = await completeLesson('lesson-1-1', 92, 1800);
console.log('XP gained:', result.data.rewards.xp);
console.log('Next lesson:', result.data.nextLesson?.title);
```

---

### 5. Exercises (`exercises.ts`)

**Functions:**
- `getExercise(lessonId)` - Get general exercise
- `getPronunciationExercise(lessonId)` - Get pronunciation
- `submitPronunciation(wordId, audioBlob)` - Submit recording
- `getReadingExercise(lessonId)` - Get reading passage
- `getListeningExercise(lessonId)` - Get listening audio
- `getQuizExercise(lessonId)` - Get quiz questions
- `submitExercise(data)` - Submit answers
- `getExerciseHint(questionId)` - Get hint (costs coins)
- `skipQuestion(exerciseId, questionId)` - Skip question

**Example:**
```typescript
import { getQuizExercise, submitExercise } from '@/api';

// Get quiz
const quiz = await getQuizExercise('lesson-1-2');

// Submit answers
const result = await submitExercise({
  lessonId: 'lesson-1-2',
  answers: [
    { questionId: 'q-001', answer: 'washes', timeSpent: 15 },
    { questionId: 'q-002', answer: 'nurse', timeSpent: 10 },
  ],
  totalTime: 300,
});

console.log('Score:', result.data.score + '%');
console.log('Rewards:', result.data.rewards);
```

---

### 6. Tests (`tests.ts`)

**Functions:**
- `getTest(testId)` - Get test
- `getRevisionTest(testId)` - Get revision test
- `submitTest(data)` - Submit test answers
- `getTestResults(testId)` - Get results
- `getTestReview(testId)` - Get detailed review
- `saveTestProgress(testId, answers, time)` - Save progress
- `getSavedTestProgress(testId)` - Get saved progress
- `getTestHistory(userId?)` - Get test history
- `retakeTest(testId)` - Retake test
- `flagQuestion(testId, questionId, reason?)` - Flag question

**Example:**
```typescript
import { getTest, submitTest, getTestReview } from '@/api';

// Get test
const test = await getTest('test-unit-1');

// Submit test
const result = await submitTest({
  testId: 'test-unit-1',
  answers: [/* ... */],
  totalTime: 3000,
});

console.log('Passed:', result.data.passed);
console.log('Grade:', result.data.grade);

// Get review
const review = await getTestReview('test-unit-1');
console.log('Correct:', review.data.summary.correctCount);
```

---

### 7. Quests & Achievements (`quests.ts`)

**Functions:**
- `getAllQuests(filter?)` - Get all quests
- `getActiveQuestsApi()` - Get active quests
- `getDailyQuests()` - Get daily quests
- `getWeeklyQuests()` - Get weekly quests
- `getQuest(questId)` - Get single quest
- `updateQuestProgress(questId, progress)` - Update progress
- `claimQuestReward(data)` - Claim rewards
- `getQuestStats()` - Get statistics
- `getAllAchievements()` - Get all achievements
- `getUnlockedAchievementsApi()` - Get unlocked
- `getAchievementsByCategory(category)` - Filter by category
- `unlockAchievement(achievementId)` - Unlock achievement
- `getAchievementProgress(achievementId)` - Get progress
- `getAchievementStats()` - Get statistics

**Example:**
```typescript
import { getDailyQuests, claimQuestReward, getAllAchievements } from '@/api';

// Get daily quests
const daily = await getDailyQuests();
console.log('Daily quests:', daily.data.length);

// Claim reward
const claimed = await claimQuestReward({ questId: 'quest-daily-1' });
console.log('XP:', claimed.data.rewards.xp);

// Get achievements
const achievements = await getAllAchievements();
const unlocked = achievements.data.filter(a => !a.isLocked);
```

---

### 8. Leaderboard (`leaderboard.ts`)

**Functions:**
- `getLeaderboard(filter?, page?, pageSize?)` - Get paginated leaderboard
- `getTopPlayers(limit)` - Get top N players
- `getUserRank(userId?)` - Get user's rank
- `getNearbyPlayers(userId?, range)` - Get nearby players
- `getLeagueLeaderboard(league)` - Get league leaderboard
- `getLeagueInfo(userId?)` - Get league info
- `getWeeklyLeaderboard()` - Get weekly rankings
- `getMonthlyLeaderboard()` - Get monthly rankings
- `getFriendsLeaderboard()` - Get friends rankings
- `getLeaderboardStats()` - Get statistics
- `getSeasonInfo()` - Get current season info

**Example:**
```typescript
import { getTopPlayers, getUserRank, getLeagueInfo } from '@/api';

// Get top 10
const top = await getTopPlayers(10);

// Get my rank
const rank = await getUserRank();
console.log('My rank:', rank.data.rank);
console.log('Percentile:', rank.data.percentile + '%');

// Get league info
const league = await getLeagueInfo();
console.log('League:', league.data.currentLeague);
console.log('Promotion zone:', league.data.promotionZone);
```

---

### 9. Shop (`shop.ts`)

**Functions:**
- `getAllShopItems(filter?)` - Get all items
- `getAvailableItems()` - Get available items
- `getItemsByType(type)` - Filter by type
- `getShopItem(itemId)` - Get single item
- `purchaseItem(data)` - Purchase item
- `getPurchasedItems()` - Get purchased items
- `getPurchaseHistory()` - Get purchase history
- `applyPowerup(itemId)` - Apply powerup
- `getActivePowerups()` - Get active powerups
- `getSpecialOffers()` - Get special offers
- `refundItem(itemId)` - Refund item
- `getCoinBalance()` - Get coin balance
- `getCoinHistory(limit)` - Get coin history

**Example:**
```typescript
import { getAvailableItems, purchaseItem, getCoinBalance } from '@/api';

// Get available items
const items = await getAvailableItems();

// Check balance
const balance = await getCoinBalance();
console.log('Balance:', balance.data.balance);

// Purchase item
try {
  const purchase = await purchaseItem({ itemId: 'item-001' });
  console.log('Purchased:', purchase.data.item.name);
  console.log('New balance:', purchase.data.newBalance);
} catch (error) {
  console.error('Purchase failed:', error);
}
```

---

### 10. Notifications (`notifications.ts`)

**Functions:**
- `getNotifications(limit?, unreadOnly?)` - Get notifications
- `getUnreadCount()` - Get unread count
- `markAsRead(notificationId)` - Mark as read
- `markAllAsRead()` - Mark all as read
- `deleteNotification(notificationId)` - Delete one
- `deleteAllNotifications()` - Delete all
- `getNotificationPreferences()` - Get preferences
- `updateNotificationPreferences(prefs)` - Update preferences
- `subscribeToPush(subscription)` - Subscribe to push
- `unsubscribeFromPush()` - Unsubscribe

**Example:**
```typescript
import { getNotifications, getUnreadCount, markAsRead } from '@/api';

// Get unread count
const count = await getUnreadCount();
console.log('Unread:', count.data);

// Get notifications
const notifs = await getNotifications(10);

// Mark as read
await markAsRead('notif-001');
```

---

## 🔧 Utilities

### API Response Type

```typescript
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}
```

### Error Handling

```typescript
import { handleApiError } from '@/api';

try {
  const result = await login({ email, password });
  console.log('Success:', result.data);
} catch (error) {
  const apiError = handleApiError(error);
  console.error('Error:', apiError.message);
  console.error('Code:', apiError.code);
}
```

### Network Delay

All API calls simulate network delay (default 500ms):

```typescript
// Change delay for specific call
import { simulateApiCall } from '@/api/client';

const result = await simulateApiCall(data, 1000); // 1 second delay
```

## 📝 Best Practices

### 1. Always handle errors

```typescript
try {
  const result = await someApiCall();
  // Handle success
} catch (error) {
  // Handle error
  console.error(error);
}
```

### 2. Use TypeScript types

```typescript
import type { Unit, Lesson } from '@/data/mockData';
import type { ApiResponse } from '@/api';

const result: ApiResponse<Unit[]> = await getAllUnits();
```

### 3. Check success status

```typescript
const result = await login(credentials);

if (result.success) {
  // Success path
  console.log(result.data);
} else {
  // Error path
  console.error(result.error);
}
```

### 4. Use async/await

```typescript
// Good ✅
const units = await getAllUnits();

// Avoid ❌
getAllUnits().then(units => {
  // ...
});
```

## 🧪 Testing

### Mock API calls in tests

```typescript
import { simulateApiCall } from '@/api/client';

// Test with custom delay
test('loads units', async () => {
  const result = await simulateApiCall(mockUnits, 0); // No delay in tests
  expect(result.data).toHaveLength(10);
});
```

## 🔄 Migration to Real API

When migrating to a real backend:

1. Replace `simulateApiCall` with actual `fetch` or `axios` calls
2. Update base URL in a config file
3. Add authentication headers
4. Update error handling for real HTTP errors
5. Types remain the same!

```typescript
// Future implementation
async function getAllUnits(): Promise<ApiResponse<Unit[]>> {
  const response = await fetch(`${API_BASE_URL}/units`);
  const data = await response.json();
  return data;
}
```

## 📚 Related Documentation

- `/src/data/mockData.ts` - Mock data source
- `/MOCKDATA_GUIDE.md` - Mock data guide
- `/USER_GUIDE.md` - User interface guide

---

**Last Updated:** April 7, 2026  
**Version:** 1.0.0
