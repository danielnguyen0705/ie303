// UIFIVE Mock Data
// Contains all necessary data for user interfaces

// ============================================
// TYPES & INTERFACES
// ============================================

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  level: number;
  xp: number;
  coins: number;
  streak: number;
  accuracy: number;
  joinedDate: string;
  vipStatus: 'free' | 'premium' | 'elite';
}

export interface Unit {
  id: number;
  title: string;
  description: string;
  icon: string;
  progress: number;
  status: 'completed' | 'in-progress' | 'upcoming' | 'locked';
  colorScheme: 'primary' | 'secondary' | 'tertiary';
  semester: 1 | 2;
  totalLessons: number;
  completedLessons: number;
  topics: string[];
  estimatedTime: string;
}

export interface Lesson {
  id: string;
  unitId: number;
  title: string;
  type: 'pronunciation' | 'reading' | 'quiz' | 'listening' | 'grammar' | 'vocabulary';
  duration: number; // minutes
  xpReward: number;
  coinsReward: number;
  status: 'completed' | 'current' | 'locked';
  completedAt?: string;
  score?: number;
}

export interface Question {
  id: string;
  type: 'multiple-choice' | 'true-false' | 'fill-blank' | 'listening' | 'reading';
  category: 'grammar' | 'vocabulary' | 'listening' | 'reading' | 'writing' | 'speaking';
  difficulty: 'easy' | 'medium' | 'hard' | 'advanced';
  question: string;
  options?: string[];
  correctAnswer: string;
  userAnswer?: string;
  explanation: string;
  points: number;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  avatar: string;
  xp: number;
  streak: number;
  accuracy: number;
  level: number;
  league: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
}

export interface Quest {
  id: string;
  type: 'daily' | 'weekly' | 'special';
  title: string;
  description: string;
  progress: number;
  target: number;
  xpReward: number;
  coinsReward: number;
  expiresAt: string;
  status: 'active' | 'completed' | 'claimed';
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'learning' | 'social' | 'streak' | 'mastery' | 'special';
  unlockedAt?: string;
  isLocked: boolean;
  progress?: number;
  requirement?: number;
}

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  type: 'powerup' | 'cosmetic' | 'subscription' | 'boost';
  price: number;
  icon: string;
  duration?: number; // days for subscriptions
  effect?: string;
  isPurchased: boolean;
}

// ============================================
// CURRENT USER DATA
// ============================================

export const currentUser: User = {
  id: 'user-001',
  name: 'The Scholar',
  email: 'scholar@uifive.edu',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Scholar',
  level: 42,
  xp: 12450,
  coins: 1240,
  streak: 15,
  accuracy: 92,
  joinedDate: '2024-01-15',
  vipStatus: 'premium',
};

// ============================================
// UNITS DATA (Curriculum)
// ============================================

export const units: Unit[] = [
  // Học kỳ 1
  {
    id: 1,
    title: 'Family Life',
    description: 'Learn vocabulary and grammar related to family relationships and daily activities',
    icon: 'family_history',
    progress: 100,
    status: 'completed',
    colorScheme: 'primary',
    semester: 1,
    totalLessons: 8,
    completedLessons: 8,
    topics: ['Family members', 'Household chores', 'Present Simple', 'Adverbs of frequency'],
    estimatedTime: '6 hours',
  },
  {
    id: 2,
    title: 'Healthy Living',
    description: 'Explore topics about health, fitness, and maintaining a healthy lifestyle',
    icon: 'vital_signs',
    progress: 65,
    status: 'in-progress',
    colorScheme: 'secondary',
    semester: 1,
    totalLessons: 8,
    completedLessons: 5,
    topics: ['Health vocabulary', 'Modal verbs', 'Giving advice', 'Healthy habits'],
    estimatedTime: '6 hours',
  },
  {
    id: 3,
    title: 'Music',
    description: 'Discover the world of music, instruments, and musical expressions',
    icon: 'music_note',
    progress: 25,
    status: 'upcoming',
    colorScheme: 'tertiary',
    semester: 1,
    totalLessons: 8,
    completedLessons: 2,
    topics: ['Musical instruments', 'Music genres', 'Compound sentences', 'Expressing preferences'],
    estimatedTime: '6 hours',
  },
  {
    id: 4,
    title: 'For a Better Community',
    description: 'Learn about charity, volunteer work, and social issues',
    icon: 'volunteer_activism',
    progress: 0,
    status: 'locked',
    colorScheme: 'primary',
    semester: 1,
    totalLessons: 8,
    completedLessons: 0,
    topics: ['Charity vocabulary', 'Past Simple vs Past Continuous', 'Social issues', 'Community service'],
    estimatedTime: '6 hours',
  },
  {
    id: 5,
    title: 'Inventions',
    description: 'Explore great inventions and their impact on society',
    icon: 'eco',
    progress: 0,
    status: 'locked',
    colorScheme: 'primary',
    semester: 1,
    totalLessons: 8,
    completedLessons: 0,
    topics: ['Technology vocabulary', 'Present Perfect', 'Passive Voice', 'Describing processes'],
    estimatedTime: '6 hours',
  },
  // Học kỳ 2
  {
    id: 6,
    title: 'Eco-friendly Living',
    description: 'Learn about environmental protection and sustainable living',
    icon: 'nature_people',
    progress: 0,
    status: 'locked',
    colorScheme: 'tertiary',
    semester: 2,
    totalLessons: 8,
    completedLessons: 0,
    topics: ['Environment vocabulary', 'Conditional sentences', 'Green living', 'Climate change'],
    estimatedTime: '6 hours',
  },
  {
    id: 7,
    title: 'Viet Nam and International Organisations',
    description: 'Understand global cooperation and international relations',
    icon: 'diversity_3',
    progress: 0,
    status: 'locked',
    colorScheme: 'primary',
    semester: 2,
    totalLessons: 8,
    completedLessons: 0,
    topics: ['International organizations', 'Comparative structures', 'Global issues', 'Diplomacy'],
    estimatedTime: '6 hours',
  },
  {
    id: 8,
    title: 'New Ways to Learn',
    description: 'Explore modern learning methods and educational technology',
    icon: 'new_releases',
    progress: 0,
    status: 'locked',
    colorScheme: 'secondary',
    semester: 2,
    totalLessons: 8,
    completedLessons: 0,
    topics: ['Education vocabulary', 'Future tenses', 'Online learning', 'Study skills'],
    estimatedTime: '6 hours',
  },
  {
    id: 9,
    title: 'Protecting the Environment',
    description: 'Focus on environmental conservation and protection strategies',
    icon: 'cloud_sync',
    progress: 0,
    status: 'locked',
    colorScheme: 'tertiary',
    semester: 2,
    totalLessons: 8,
    completedLessons: 0,
    topics: ['Conservation', 'Linking sounds', 'Environmental problems', 'Solutions'],
    estimatedTime: '6 hours',
  },
  {
    id: 10,
    title: 'Ecotourism',
    description: 'Learn about sustainable tourism and eco-friendly travel',
    icon: 'travel_explore',
    progress: 0,
    status: 'locked',
    colorScheme: 'secondary',
    semester: 2,
    totalLessons: 8,
    completedLessons: 0,
    topics: ['Tourism vocabulary', 'Conditional types', 'Sustainable travel', 'Cultural awareness'],
    estimatedTime: '6 hours',
  },
];

// ============================================
// LESSONS DATA
// ============================================

export const lessons: Lesson[] = [
  // Unit 1 - Family Life (Completed)
  {
    id: 'lesson-1-1',
    unitId: 1,
    title: 'Getting Started - Family Members',
    type: 'vocabulary',
    duration: 30,
    xpReward: 10,
    coinsReward: 5,
    status: 'completed',
    completedAt: '2024-03-01',
    score: 95,
  },
  {
    id: 'lesson-1-2',
    unitId: 1,
    title: 'Language - Present Simple & Adverbs',
    type: 'grammar',
    duration: 45,
    xpReward: 15,
    coinsReward: 8,
    status: 'completed',
    completedAt: '2024-03-02',
    score: 88,
  },
  {
    id: 'lesson-1-3',
    unitId: 1,
    title: 'Reading - Family Values',
    type: 'reading',
    duration: 40,
    xpReward: 12,
    coinsReward: 6,
    status: 'completed',
    completedAt: '2024-03-03',
    score: 92,
  },
  {
    id: 'lesson-1-4',
    unitId: 1,
    title: 'Speaking - Describing Your Family',
    type: 'pronunciation',
    duration: 35,
    xpReward: 12,
    coinsReward: 6,
    status: 'completed',
    completedAt: '2024-03-04',
    score: 85,
  },
  {
    id: 'lesson-1-5',
    unitId: 1,
    title: 'Listening - Family Conversations',
    type: 'listening',
    duration: 30,
    xpReward: 10,
    coinsReward: 5,
    status: 'completed',
    completedAt: '2024-03-05',
    score: 90,
  },
  {
    id: 'lesson-1-6',
    unitId: 1,
    title: 'Writing - My Family Story',
    type: 'grammar',
    duration: 50,
    xpReward: 15,
    coinsReward: 8,
    status: 'completed',
    completedAt: '2024-03-06',
    score: 87,
  },
  {
    id: 'lesson-1-7',
    unitId: 1,
    title: 'Communication & Culture',
    type: 'reading',
    duration: 40,
    xpReward: 12,
    coinsReward: 6,
    status: 'completed',
    completedAt: '2024-03-07',
    score: 94,
  },
  {
    id: 'lesson-1-8',
    unitId: 1,
    title: 'Looking Back & Project',
    type: 'quiz',
    duration: 60,
    xpReward: 20,
    coinsReward: 10,
    status: 'completed',
    completedAt: '2024-03-08',
    score: 96,
  },
  // Unit 2 - Healthy Living (In Progress)
  {
    id: 'lesson-2-1',
    unitId: 2,
    title: 'Getting Started - Health Vocabulary',
    type: 'vocabulary',
    duration: 30,
    xpReward: 10,
    coinsReward: 5,
    status: 'completed',
    completedAt: '2024-03-10',
    score: 91,
  },
  {
    id: 'lesson-2-2',
    unitId: 2,
    title: 'Language - Modal Verbs',
    type: 'grammar',
    duration: 45,
    xpReward: 15,
    coinsReward: 8,
    status: 'completed',
    completedAt: '2024-03-12',
    score: 86,
  },
  {
    id: 'lesson-2-3',
    unitId: 2,
    title: 'Reading - Healthy Lifestyle',
    type: 'reading',
    duration: 40,
    xpReward: 12,
    coinsReward: 6,
    status: 'completed',
    completedAt: '2024-03-14',
    score: 89,
  },
  {
    id: 'lesson-2-4',
    unitId: 2,
    title: 'Speaking - Giving Health Advice',
    type: 'pronunciation',
    duration: 35,
    xpReward: 12,
    coinsReward: 6,
    status: 'completed',
    completedAt: '2024-03-16',
    score: 82,
  },
  {
    id: 'lesson-2-5',
    unitId: 2,
    title: 'Listening - Health Tips',
    type: 'listening',
    duration: 30,
    xpReward: 10,
    coinsReward: 5,
    status: 'completed',
    completedAt: '2024-03-18',
    score: 88,
  },
  {
    id: 'lesson-2-6',
    unitId: 2,
    title: 'Writing - Health Blog',
    type: 'grammar',
    duration: 50,
    xpReward: 15,
    coinsReward: 8,
    status: 'current',
  },
  {
    id: 'lesson-2-7',
    unitId: 2,
    title: 'Communication & Culture',
    type: 'reading',
    duration: 40,
    xpReward: 12,
    coinsReward: 6,
    status: 'locked',
  },
  {
    id: 'lesson-2-8',
    unitId: 2,
    title: 'Looking Back & Project',
    type: 'quiz',
    duration: 60,
    xpReward: 20,
    coinsReward: 10,
    status: 'locked',
  },
  // Unit 3 - Music (Upcoming)
  {
    id: 'lesson-3-1',
    unitId: 3,
    title: 'Getting Started - Music Vocabulary',
    type: 'vocabulary',
    duration: 30,
    xpReward: 10,
    coinsReward: 5,
    status: 'completed',
    completedAt: '2024-03-20',
    score: 93,
  },
  {
    id: 'lesson-3-2',
    unitId: 3,
    title: 'Language - Compound Sentences',
    type: 'grammar',
    duration: 45,
    xpReward: 15,
    coinsReward: 8,
    status: 'completed',
    completedAt: '2024-03-22',
    score: 84,
  },
  {
    id: 'lesson-3-3',
    unitId: 3,
    title: 'Reading - Music History',
    type: 'reading',
    duration: 40,
    xpReward: 12,
    coinsReward: 6,
    status: 'current',
  },
  {
    id: 'lesson-3-4',
    unitId: 3,
    title: 'Speaking - Talking About Music',
    type: 'pronunciation',
    duration: 35,
    xpReward: 12,
    coinsReward: 6,
    status: 'locked',
  },
  {
    id: 'lesson-3-5',
    unitId: 3,
    title: 'Listening - Music Genres',
    type: 'listening',
    duration: 30,
    xpReward: 10,
    coinsReward: 5,
    status: 'locked',
  },
  {
    id: 'lesson-3-6',
    unitId: 3,
    title: 'Writing - Music Review',
    type: 'grammar',
    duration: 50,
    xpReward: 15,
    coinsReward: 8,
    status: 'locked',
  },
  {
    id: 'lesson-3-7',
    unitId: 3,
    title: 'Communication & Culture',
    type: 'reading',
    duration: 40,
    xpReward: 12,
    coinsReward: 6,
    status: 'locked',
  },
  {
    id: 'lesson-3-8',
    unitId: 3,
    title: 'Looking Back & Project',
    type: 'quiz',
    duration: 60,
    xpReward: 20,
    coinsReward: 10,
    status: 'locked',
  },
];

// ============================================
// QUESTIONS BANK
// ============================================

export const questionBank: Question[] = [
  // Grammar Questions
  {
    id: 'q-001',
    type: 'multiple-choice',
    category: 'grammar',
    difficulty: 'medium',
    question: 'My father _____ the dishes every evening after dinner.',
    options: ['wash', 'washes', 'is washing', 'has washed'],
    correctAnswer: 'washes',
    explanation: 'We use Present Simple (washes) for habits and routines. The time expression "every evening" indicates a regular action.',
    points: 10,
  },
  {
    id: 'q-002',
    type: 'multiple-choice',
    category: 'grammar',
    difficulty: 'advanced',
    question: 'By the time the professor arrived, the students _____ the experimental setup for twenty minutes.',
    options: ['had been preparing', 'were preparing', 'have prepared', 'prepared'],
    correctAnswer: 'were preparing',
    explanation: 'Although the action of preparing occurred before the professor arrived, this sentence emphasizes an ongoing action at a specific moment in the past. "By the time" + Simple Past can be used with Past Continuous if emphasizing the ongoing nature of the action.',
    points: 15,
  },
  // Vocabulary Questions
  {
    id: 'q-003',
    type: 'multiple-choice',
    category: 'vocabulary',
    difficulty: 'easy',
    question: 'A person who takes care of sick people in a hospital is called a _____.',
    options: ['teacher', 'nurse', 'engineer', 'chef'],
    correctAnswer: 'nurse',
    explanation: 'A nurse is a healthcare professional who provides medical care to patients in hospitals and clinics.',
    points: 5,
  },
  {
    id: 'q-004',
    type: 'multiple-choice',
    category: 'vocabulary',
    difficulty: 'medium',
    question: 'The concert was _____ - everyone enjoyed the amazing performance.',
    options: ['boring', 'terrible', 'fantastic', 'awful'],
    correctAnswer: 'fantastic',
    explanation: 'The context "everyone enjoyed the amazing performance" indicates a positive adjective. "Fantastic" means extremely good or impressive.',
    points: 10,
  },
  // Reading Comprehension
  {
    id: 'q-005',
    type: 'true-false',
    category: 'reading',
    difficulty: 'medium',
    question: 'The Comma butterfly has struggled to adapt to the warming climate in northern Britain.',
    correctAnswer: 'FALSE',
    explanation: 'According to the passage, generalist species like the Comma are thriving in the changing climate, not struggling.',
    points: 10,
  },
  {
    id: 'q-006',
    type: 'true-false',
    category: 'reading',
    difficulty: 'medium',
    question: 'Specialist butterflies are more vulnerable to habitat loss than generalist species.',
    correctAnswer: 'TRUE',
    explanation: 'The passage states that specialists such as the High Brown Fritillary are facing local extinctions due to habitat fragmentation.',
    points: 10,
  },
  // Listening Questions
  {
    id: 'q-007',
    type: 'fill-blank',
    category: 'listening',
    difficulty: 'medium',
    question: 'Longevity is _____ to diet and exercise.',
    correctAnswer: 'linked',
    explanation: 'The audio mentions that longevity is "linked to" healthy lifestyle choices.',
    points: 10,
  },
];

// ============================================
// LEADERBOARD DATA
// ============================================

export const leaderboard: LeaderboardEntry[] = [
  {
    rank: 1,
    userId: 'user-101',
    name: 'Emma Wilson',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma',
    xp: 25680,
    streak: 45,
    accuracy: 98,
    level: 67,
    league: 'diamond',
  },
  {
    rank: 2,
    userId: 'user-102',
    name: 'Liam Chen',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Liam',
    xp: 23450,
    streak: 38,
    accuracy: 96,
    level: 62,
    league: 'diamond',
  },
  {
    rank: 3,
    userId: 'user-103',
    name: 'Sofia Rodriguez',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sofia',
    xp: 21230,
    streak: 42,
    accuracy: 95,
    level: 58,
    league: 'platinum',
  },
  {
    rank: 4,
    userId: 'user-104',
    name: 'Noah Kim',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Noah',
    xp: 19880,
    streak: 30,
    accuracy: 94,
    level: 55,
    league: 'platinum',
  },
  {
    rank: 5,
    userId: 'user-105',
    name: 'Olivia Patel',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Olivia',
    xp: 18560,
    streak: 28,
    accuracy: 93,
    level: 52,
    league: 'platinum',
  },
  {
    rank: 6,
    userId: 'user-106',
    name: 'James Anderson',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=James',
    xp: 17340,
    streak: 25,
    accuracy: 92,
    level: 49,
    league: 'gold',
  },
  {
    rank: 7,
    userId: 'user-107',
    name: 'Mia Thompson',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mia',
    xp: 16120,
    streak: 22,
    accuracy: 91,
    level: 46,
    league: 'gold',
  },
  {
    rank: 8,
    userId: 'user-108',
    name: 'Lucas Garcia',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lucas',
    xp: 14890,
    streak: 20,
    accuracy: 90,
    level: 43,
    league: 'gold',
  },
  {
    rank: 9,
    userId: 'user-001',
    name: 'The Scholar',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Scholar',
    xp: 12450,
    streak: 15,
    accuracy: 92,
    level: 42,
    league: 'gold',
  },
  {
    rank: 10,
    userId: 'user-109',
    name: 'Ava Martinez',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ava',
    xp: 11230,
    streak: 18,
    accuracy: 89,
    level: 38,
    league: 'silver',
  },
];

// ============================================
// QUESTS DATA
// ============================================

export const quests: Quest[] = [
  // Daily Quests
  {
    id: 'quest-daily-1',
    type: 'daily',
    title: 'Complete 3 Lessons',
    description: 'Finish any 3 lessons to earn rewards',
    progress: 2,
    target: 3,
    xpReward: 30,
    coinsReward: 15,
    expiresAt: '2026-04-08T00:00:00Z',
    status: 'active',
  },
  {
    id: 'quest-daily-2',
    type: 'daily',
    title: 'Practice Listening',
    description: 'Complete 1 listening exercise',
    progress: 1,
    target: 1,
    xpReward: 20,
    coinsReward: 10,
    expiresAt: '2026-04-08T00:00:00Z',
    status: 'completed',
  },
  {
    id: 'quest-daily-3',
    type: 'daily',
    title: 'Maintain Your Streak',
    description: 'Login and complete at least 1 activity today',
    progress: 1,
    target: 1,
    xpReward: 15,
    coinsReward: 8,
    expiresAt: '2026-04-08T00:00:00Z',
    status: 'completed',
  },
  // Weekly Quests
  {
    id: 'quest-weekly-1',
    type: 'weekly',
    title: 'Unit Master',
    description: 'Complete an entire unit this week',
    progress: 0,
    target: 1,
    xpReward: 100,
    coinsReward: 50,
    expiresAt: '2026-04-13T00:00:00Z',
    status: 'active',
  },
  {
    id: 'quest-weekly-2',
    type: 'weekly',
    title: 'Perfect Week',
    description: 'Get 90% or higher on 5 exercises',
    progress: 3,
    target: 5,
    xpReward: 80,
    coinsReward: 40,
    expiresAt: '2026-04-13T00:00:00Z',
    status: 'active',
  },
  {
    id: 'quest-weekly-3',
    type: 'weekly',
    title: 'Vocabulary Builder',
    description: 'Learn 50 new words this week',
    progress: 32,
    target: 50,
    xpReward: 60,
    coinsReward: 30,
    expiresAt: '2026-04-13T00:00:00Z',
    status: 'active',
  },
  // Special Quest
  {
    id: 'quest-special-1',
    type: 'special',
    title: 'Semester Champion',
    description: 'Complete all Học kỳ 1 units',
    progress: 1,
    target: 5,
    xpReward: 500,
    coinsReward: 250,
    expiresAt: '2026-06-30T00:00:00Z',
    status: 'active',
  },
];

// ============================================
// ACHIEVEMENTS DATA
// ============================================

export const achievements: Achievement[] = [
  // Learning Achievements
  {
    id: 'ach-001',
    title: 'First Steps',
    description: 'Complete your first lesson',
    icon: '🎯',
    category: 'learning',
    unlockedAt: '2024-03-01',
    isLocked: false,
  },
  {
    id: 'ach-002',
    title: 'Unit Master',
    description: 'Complete an entire unit with 90% average',
    icon: '📚',
    category: 'learning',
    unlockedAt: '2024-03-08',
    isLocked: false,
  },
  {
    id: 'ach-003',
    title: 'Perfect Score',
    description: 'Get 100% on any exercise',
    icon: '💯',
    category: 'mastery',
    isLocked: true,
    progress: 96,
    requirement: 100,
  },
  // Streak Achievements
  {
    id: 'ach-004',
    title: 'Week Warrior',
    description: 'Maintain a 7-day streak',
    icon: '🔥',
    category: 'streak',
    unlockedAt: '2024-03-10',
    isLocked: false,
  },
  {
    id: 'ach-005',
    title: 'Month Master',
    description: 'Maintain a 30-day streak',
    icon: '🏆',
    category: 'streak',
    isLocked: true,
    progress: 15,
    requirement: 30,
  },
  // Social Achievements
  {
    id: 'ach-006',
    title: 'Rising Star',
    description: 'Reach Top 10 on the leaderboard',
    icon: '⭐',
    category: 'social',
    unlockedAt: '2024-03-15',
    isLocked: false,
  },
  {
    id: 'ach-007',
    title: 'Champion',
    description: 'Reach #1 on the leaderboard',
    icon: '👑',
    category: 'social',
    isLocked: true,
    progress: 9,
    requirement: 1,
  },
  // Special Achievements
  {
    id: 'ach-008',
    title: 'Early Bird',
    description: 'Complete a lesson before 8 AM',
    icon: '🌅',
    category: 'special',
    unlockedAt: '2024-03-12',
    isLocked: false,
  },
  {
    id: 'ach-009',
    title: 'Night Owl',
    description: 'Complete a lesson after 10 PM',
    icon: '🦉',
    category: 'special',
    isLocked: true,
  },
];

// ============================================
// SHOP ITEMS DATA
// ============================================

export const shopItems: ShopItem[] = [
  // Power-ups
  {
    id: 'item-001',
    name: 'XP Boost',
    description: 'Double XP for 24 hours',
    type: 'boost',
    price: 50,
    icon: '⚡',
    duration: 1,
    effect: '2x XP for all activities',
    isPurchased: false,
  },
  {
    id: 'item-002',
    name: 'Streak Freeze',
    description: 'Protect your streak for 1 day',
    type: 'powerup',
    price: 30,
    icon: '🧊',
    effect: 'Prevents streak loss for 1 day',
    isPurchased: true,
  },
  {
    id: 'item-003',
    name: 'Coin Multiplier',
    description: 'Earn 50% more coins for 3 days',
    type: 'boost',
    price: 80,
    icon: '💰',
    duration: 3,
    effect: '1.5x coins on all rewards',
    isPurchased: false,
  },
  // Cosmetics
  {
    id: 'item-004',
    name: 'Golden Avatar Frame',
    description: 'Show off your premium status',
    type: 'cosmetic',
    price: 200,
    icon: '🎨',
    effect: 'Decorative avatar border',
    isPurchased: false,
  },
  {
    id: 'item-005',
    name: 'Rainbow Theme',
    description: 'Colorful interface theme',
    type: 'cosmetic',
    price: 150,
    icon: '🌈',
    effect: 'Changes app color scheme',
    isPurchased: false,
  },
  // Subscriptions
  {
    id: 'item-006',
    name: 'Premium Monthly',
    description: 'Unlock all premium features',
    type: 'subscription',
    price: 500,
    icon: '👑',
    duration: 30,
    effect: 'Ad-free, exclusive content, priority support',
    isPurchased: true,
  },
  {
    id: 'item-007',
    name: 'Elite Yearly',
    description: 'Ultimate learning experience',
    type: 'subscription',
    price: 5000,
    icon: '💎',
    duration: 365,
    effect: 'All Premium features + personal tutor + certificates',
    isPurchased: false,
  },
];

// ============================================
// TEST RESULTS DATA
// ============================================

export const testResults = {
  testId: 'test-unit-8-final',
  unitId: 8,
  unitName: 'Global Warming',
  score: 85,
  totalPoints: 100,
  timeSpent: 765, // seconds (12:45)
  accuracy: 92,
  xpGained: 50,
  coinsGained: 25,
  completedAt: '2024-04-07T14:30:00Z',
  skills: {
    listening: 90,
    reading: 75,
    grammar: 85,
    vocabulary: 100,
    writing: 90,
    speaking: 70,
  },
  detailedStats: [
    {
      skillArea: 'Writing',
      score: '18/20',
      speed: 'Fast',
      status: 'Mastered',
    },
    {
      skillArea: 'Speaking',
      score: '14/20',
      speed: 'Average',
      status: 'Improving',
    },
  ],
};

// ============================================
// READING PASSAGE DATA
// ============================================

export const readingPassage = {
  id: 'reading-001',
  title: 'The impact of climate change on butterflies in Britain',
  category: 'Environment',
  difficulty: 'intermediate',
  wordCount: 1200,
  estimatedTime: 8, // minutes
  content: `Over the past century, the British landscape has undergone significant transformations. Recent studies conducted by the University of York suggest that the distribution of many butterfly species is shifting northwards at a rate of roughly 20 kilometres per decade. This movement is a direct response to warming temperatures. While some generalist species like the Comma are thriving, specialists such as the High Brown Fritillary are facing local extinctions due to habitat fragmentation.

Moreover, the phenology—or timing of biological events—is changing. Butterflies are emerging earlier in the spring, which creates a potential "mismatch" with the flowering plants they depend on for nectar. This ecological synchrony is vital for the survival of fragile larvae during the first weeks of development.

Conservationists argue that creating "resilient landscapes" is the only path forward. This involves not just protecting existing nature reserves, but also restoring corridors of wild land that allow species to travel across an increasingly urbanised Britain. The success of the Large Blue reintroduction serves as a beacon of hope in an otherwise challenging era for British lepidoptera.`,
  questions: [
    {
      id: 'rq-001',
      number: 1,
      question: 'The Comma butterfly has struggled to adapt to the warming climate in northern Britain.',
      type: 'true-false-not-given',
      correctAnswer: 'FALSE',
      userAnswer: 'TRUE',
      isCorrect: false,
    },
    {
      id: 'rq-002',
      number: 2,
      question: 'Specialist butterflies are more vulnerable to habitat loss than generalist species.',
      type: 'true-false-not-given',
      correctAnswer: 'TRUE',
      userAnswer: 'TRUE',
      isCorrect: true,
    },
    {
      id: 'rq-003',
      number: 3,
      question: 'The High Brown Fritillary is currently thriving in urbanised areas of London.',
      type: 'true-false-not-given',
      correctAnswer: 'FALSE',
      userAnswer: null,
      isCorrect: false,
    },
    {
      id: 'rq-004',
      number: 4,
      question: 'Spring emergence timing for butterflies is remaining constant despite global warming.',
      type: 'true-false-not-given',
      correctAnswer: 'FALSE',
      userAnswer: null,
      isCorrect: false,
      flagged: true,
    },
  ],
};

// ============================================
// HELPER FUNCTIONS
// ============================================

export const getUserById = (userId: string): User | undefined => {
  if (userId === currentUser.id) return currentUser;
  const entry = leaderboard.find(e => e.userId === userId);
  if (!entry) return undefined;
  return {
    id: entry.userId,
    name: entry.name,
    email: `${entry.name.toLowerCase().replace(' ', '.')}@uifive.edu`,
    avatar: entry.avatar,
    level: entry.level,
    xp: entry.xp,
    coins: 0,
    streak: entry.streak,
    accuracy: entry.accuracy,
    joinedDate: '2024-01-01',
    vipStatus: 'free',
  };
};

export const getUnitById = (unitId: number): Unit | undefined => {
  return units.find(u => u.id === unitId);
};

export const getLessonsByUnitId = (unitId: number): Lesson[] => {
  return lessons.filter(l => l.unitId === unitId);
};

export const getActiveQuests = (): Quest[] => {
  return quests.filter(q => q.status === 'active');
};

export const getUnlockedAchievements = (): Achievement[] => {
  return achievements.filter(a => !a.isLocked);
};

export const getAvailableShopItems = (): ShopItem[] => {
  return shopItems.filter(i => !i.isPurchased);
};

export const calculateNextLevelXP = (currentLevel: number): number => {
  return currentLevel * 300; // Simple formula: level * 300
};

export const getLeagueColor = (league: string): string => {
  const colors: Record<string, string> = {
    bronze: '#CD7F32',
    silver: '#C0C0C0',
    gold: '#FFD700',
    platinum: '#E5E4E2',
    diamond: '#B9F2FF',
  };
  return colors[league] || '#999999';
};
