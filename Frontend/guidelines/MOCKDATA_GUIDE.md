# Mock Data Guide - UIFIVE

## 📦 Overview

File `/src/data/mockData.ts` chứa tất cả dữ liệu mẫu cần thiết cho giao diện user của UIFIVE.

---

## 📋 Contents

### 1. **Types & Interfaces**

Định nghĩa TypeScript cho tất cả entities:

```typescript
- User
- Unit
- Lesson
- Question
- LeaderboardEntry
- Quest
- Achievement
- ShopItem
```

### 2. **Data Collections**

| Collection | Count | Description |
|------------|-------|-------------|
| `currentUser` | 1 | Current logged-in user |
| `units` | 10 | All curriculum units (Học kỳ 1 & 2) |
| `lessons` | 24 | Sample lessons from Units 1-3 |
| `questionBank` | 7+ | Sample questions (grammar, vocab, reading, listening) |
| `leaderboard` | 10 | Top 10 users ranking |
| `quests` | 7 | Daily, Weekly, Special quests |
| `achievements` | 9 | Unlocked & locked achievements |
| `shopItems` | 7 | Power-ups, cosmetics, subscriptions |
| `testResults` | 1 | Sample test result data |
| `readingPassage` | 1 | Sample reading comprehension |

---

## 🎯 Usage Examples

### Import Data

```typescript
import { 
  currentUser, 
  units, 
  lessons,
  leaderboard,
  quests 
} from '@/data/mockData';
```

### Use in Components

#### Dashboard
```typescript
import { currentUser, units } from '@/data/mockData';

function Dashboard() {
  const inProgressUnits = units.filter(u => u.status === 'in-progress');
  
  return (
    <div>
      <h1>Welcome, {currentUser.name}</h1>
      <div>XP: {currentUser.xp}</div>
      <div>Coins: {currentUser.coins}</div>
      <div>Streak: {currentUser.streak} days 🔥</div>
    </div>
  );
}
```

#### Unit Selection
```typescript
import { units } from '@/data/mockData';

function UnitSelection() {
  const semester1 = units.filter(u => u.semester === 1);
  const semester2 = units.filter(u => u.semester === 2);
  
  return (
    <div>
      <h2>Học kỳ 1</h2>
      {semester1.map(unit => (
        <UnitCard key={unit.id} {...unit} />
      ))}
      
      <h2>Học kỳ 2</h2>
      {semester2.map(unit => (
        <UnitCard key={unit.id} {...unit} />
      ))}
    </div>
  );
}
```

#### Unit View
```typescript
import { getUnitById, getLessonsByUnitId } from '@/data/mockData';

function UnitView({ unitId }: { unitId: number }) {
  const unit = getUnitById(unitId);
  const lessons = getLessonsByUnitId(unitId);
  
  return (
    <div>
      <h1>{unit?.title}</h1>
      <p>{unit?.description}</p>
      <div>Progress: {unit?.progress}%</div>
      
      <div>
        {lessons.map(lesson => (
          <LessonCard key={lesson.id} {...lesson} />
        ))}
      </div>
    </div>
  );
}
```

#### Leaderboard
```typescript
import { leaderboard, currentUser } from '@/data/mockData';

function Leaderboard() {
  const currentUserRank = leaderboard.find(
    entry => entry.userId === currentUser.id
  );
  
  return (
    <div>
      <h2>Top Players</h2>
      {leaderboard.map(entry => (
        <LeaderboardRow 
          key={entry.userId} 
          {...entry}
          isCurrentUser={entry.userId === currentUser.id}
        />
      ))}
    </div>
  );
}
```

#### Quests
```typescript
import { quests, getActiveQuests } from '@/data/mockData';

function Quests() {
  const activeQuests = getActiveQuests();
  const dailyQuests = quests.filter(q => q.type === 'daily');
  const weeklyQuests = quests.filter(q => q.type === 'weekly');
  
  return (
    <div>
      <h2>Daily Quests</h2>
      {dailyQuests.map(quest => (
        <QuestCard key={quest.id} {...quest} />
      ))}
      
      <h2>Weekly Challenges</h2>
      {weeklyQuests.map(quest => (
        <QuestCard key={quest.id} {...quest} />
      ))}
    </div>
  );
}
```

#### Shop
```typescript
import { shopItems, getAvailableShopItems } from '@/data/mockData';

function Shop() {
  const availableItems = getAvailableShopItems();
  const powerups = shopItems.filter(i => i.type === 'powerup');
  const subscriptions = shopItems.filter(i => i.type === 'subscription');
  
  return (
    <div>
      <div>Your Balance: {currentUser.coins} coins</div>
      
      <h2>Power-ups</h2>
      {powerups.map(item => (
        <ShopItemCard key={item.id} {...item} />
      ))}
      
      <h2>Subscriptions</h2>
      {subscriptions.map(item => (
        <ShopItemCard key={item.id} {...item} />
      ))}
    </div>
  );
}
```

---

## 🔧 Helper Functions

### `getUserById(userId: string)`
Get user details by ID.

```typescript
const user = getUserById('user-101');
// Returns: User object or undefined
```

### `getUnitById(unitId: number)`
Get unit details by ID.

```typescript
const unit = getUnitById(1);
// Returns: Unit 1 - Family Life
```

### `getLessonsByUnitId(unitId: number)`
Get all lessons for a specific unit.

```typescript
const unit1Lessons = getLessonsByUnitId(1);
// Returns: Array of 8 lessons
```

### `getActiveQuests()`
Get only active quests (not completed or claimed).

```typescript
const active = getActiveQuests();
// Returns: Array of quests with status 'active'
```

### `getUnlockedAchievements()`
Get achievements that have been unlocked.

```typescript
const unlocked = getUnlockedAchievements();
// Returns: Array of unlocked achievements
```

### `getAvailableShopItems()`
Get shop items that haven't been purchased.

```typescript
const available = getAvailableShopItems();
// Returns: Array of unpurchased items
```

### `calculateNextLevelXP(currentLevel: number)`
Calculate XP needed for next level.

```typescript
const nextLevelXP = calculateNextLevelXP(42);
// Returns: 12600 (42 * 300)
```

### `getLeagueColor(league: string)`
Get color code for league badge.

```typescript
const color = getLeagueColor('diamond');
// Returns: '#B9F2FF'
```

---

## 📊 Data Specifications

### Current User Stats
```typescript
{
  level: 42,
  xp: 12450,
  coins: 1240,
  streak: 15 days,
  accuracy: 92%,
  vipStatus: 'premium'
}
```

### Units Progress
- **Unit 1**: 100% ✅ (Completed - 8/8 lessons)
- **Unit 2**: 65% 🔄 (In Progress - 5/8 lessons)
- **Unit 3**: 25% 🔜 (Upcoming - 2/8 lessons)
- **Units 4-10**: 0% 🔒 (Locked)

### Lesson Types
```typescript
'pronunciation' | 'reading' | 'quiz' | 'listening' | 'grammar' | 'vocabulary'
```

### Question Categories
```typescript
'grammar' | 'vocabulary' | 'listening' | 'reading' | 'writing' | 'speaking'
```

### Quest Types
```typescript
'daily' | 'weekly' | 'special'
```

### Achievement Categories
```typescript
'learning' | 'social' | 'streak' | 'mastery' | 'special'
```

### Shop Item Types
```typescript
'powerup' | 'cosmetic' | 'subscription' | 'boost'
```

---

## 🎨 League System

```typescript
bronze   → #CD7F32 (Beginner)
silver   → #C0C0C0 (Intermediate)
gold     → #FFD700 (Advanced)
platinum → #E5E4E2 (Expert)
diamond  → #B9F2FF (Master)
```

---

## 📈 Progress States

### Units
```typescript
'completed'   → 100% done, green checkmark
'in-progress' → 1-99% done, blue progress bar
'upcoming'    → 0-25% started, yellow highlight
'locked'      → Not accessible yet, gray + lock icon
```

### Lessons
```typescript
'completed' → Finished with score
'current'   → Currently active
'locked'    → Not yet available
```

### Quests
```typescript
'active'    → In progress
'completed' → Finished but not claimed
'claimed'   → Rewards collected
```

---

## 🔄 Update Mock Data

### Add New Unit
```typescript
const newUnit: Unit = {
  id: 11,
  title: 'Advanced Grammar',
  description: 'Master complex grammar structures',
  icon: 'school',
  progress: 0,
  status: 'locked',
  colorScheme: 'primary',
  semester: 2,
  totalLessons: 8,
  completedLessons: 0,
  topics: ['Advanced tenses', 'Conditionals', 'Subjunctive'],
  estimatedTime: '7 hours',
};

units.push(newUnit);
```

### Add New Achievement
```typescript
const newAchievement: Achievement = {
  id: 'ach-010',
  title: 'Speed Demon',
  description: 'Complete a lesson in under 10 minutes',
  icon: '⚡',
  category: 'special',
  isLocked: true,
};

achievements.push(newAchievement);
```

### Update User Progress
```typescript
currentUser.xp += 50;
currentUser.coins += 25;
currentUser.streak += 1;
currentUser.level = Math.floor(currentUser.xp / 300);
```

---

## 🧪 Testing Data

### Sample Test Scenarios

#### Scenario 1: New User
```typescript
const newUser: User = {
  ...currentUser,
  id: 'user-new',
  name: 'New Student',
  level: 1,
  xp: 0,
  coins: 0,
  streak: 0,
  accuracy: 0,
  vipStatus: 'free',
};
```

#### Scenario 2: Complete Unit
```typescript
const completeUnit = (unitId: number) => {
  const unit = getUnitById(unitId);
  if (unit) {
    unit.progress = 100;
    unit.status = 'completed';
    unit.completedLessons = unit.totalLessons;
  }
};
```

#### Scenario 3: Unlock Next Unit
```typescript
const unlockUnit = (unitId: number) => {
  const unit = getUnitById(unitId);
  if (unit && unit.status === 'locked') {
    unit.status = 'upcoming';
  }
};
```

---

## 📱 Responsive Data

All data structures support responsive display:

- **Desktop**: Full data display
- **Tablet**: Condensed info
- **Mobile**: Essential stats only

Example:
```typescript
// Desktop: Show full leaderboard (10 entries)
const desktopLeaderboard = leaderboard;

// Mobile: Show top 5 + current user
const mobileLeaderboard = leaderboard.slice(0, 5);
if (!mobileLeaderboard.find(e => e.userId === currentUser.id)) {
  const currentUserEntry = leaderboard.find(e => e.userId === currentUser.id);
  if (currentUserEntry) mobileLeaderboard.push(currentUserEntry);
}
```

---

## 🔒 Data Validation

### Type Safety
All data is fully typed with TypeScript interfaces. Use them for type checking:

```typescript
import type { Unit, Lesson, Quest } from '@/data/mockData';

// Compiler will catch type errors
const unit: Unit = getUnitById(1)!;
const lessons: Lesson[] = getLessonsByUnitId(1);
```

### Data Integrity
- All IDs are unique
- Foreign keys reference valid entities
- Dates are in ISO format
- Percentages are 0-100
- Status values match enum types

---

## 🚀 Best Practices

1. **Import only what you need**
   ```typescript
   import { units, currentUser } from '@/data/mockData';
   ```

2. **Use helper functions**
   ```typescript
   // Good ✅
   const unit = getUnitById(1);
   
   // Avoid ❌
   const unit = units.find(u => u.id === 1);
   ```

3. **Type your variables**
   ```typescript
   const unit: Unit | undefined = getUnitById(1);
   ```

4. **Filter data efficiently**
   ```typescript
   const activeQuests = quests.filter(q => q.status === 'active');
   ```

5. **Calculate derived data**
   ```typescript
   const totalXP = lessons
     .filter(l => l.status === 'completed')
     .reduce((sum, l) => sum + l.xpReward, 0);
   ```

---

## 📖 Related Files

- `/src/data/mockData.ts` - Main mock data file
- `/USER_GUIDE.md` - User interface guide
- `/ROUTES_SUMMARY.md` - Routes reference
- `/README.md` - Project documentation

---

## 🔮 Future Enhancements

Planned additions to mock data:

- [ ] More reading passages (10+)
- [ ] Writing prompts
- [ ] Speaking exercises
- [ ] Multiplayer quiz data
- [ ] Friend list
- [ ] Chat messages
- [ ] Notifications
- [ ] Study statistics
- [ ] Certificate data

---

**Last Updated:** April 7, 2026  
**Version:** 1.0.0
