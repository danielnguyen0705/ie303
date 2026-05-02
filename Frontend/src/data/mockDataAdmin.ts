// UIFIVE Admin Mock Data
// Contains all necessary data for admin interfaces

// ============================================
// TYPES & INTERFACES
// ============================================

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: 'student' | 'teacher' | 'admin' | 'super-admin';
  status: 'active' | 'inactive' | 'suspended' | 'pending';
  vipStatus: 'free' | 'premium' | 'elite';
  level: number;
  xp: number;
  coins: number;
  streak: number;
  accuracy: number;
  joinedDate: string;
  lastActive: string;
  totalLessonsCompleted: number;
  totalTestsTaken: number;
  averageScore: number;
}

export interface ContentItem {
  id: string;
  type: 'unit' | 'lesson' | 'exercise' | 'test' | 'article';
  title: string;
  description: string;
  unitId?: number;
  lessonType?: 'pronunciation' | 'reading' | 'quiz' | 'listening' | 'grammar' | 'vocabulary';
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  status: 'draft' | 'published' | 'archived' | 'under-review';
  author: string;
  createdAt: string;
  updatedAt: string;
  views: number;
  completionRate: number;
  averageRating: number;
  totalRatings: number;
}

export interface AdminQuestion {
  id: string;
  type: 'multiple-choice' | 'true-false' | 'fill-blank' | 'listening' | 'reading' | 'essay';
  category: 'grammar' | 'vocabulary' | 'listening' | 'reading' | 'writing' | 'speaking';
  difficulty: 'easy' | 'medium' | 'hard' | 'advanced';
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
  points: number;
  tags: string[];
  unitId?: number;
  usageCount: number;
  successRate: number;
  averageTime: number; // seconds
  createdBy: string;
  createdAt: string;
  lastUsed?: string;
  status: 'active' | 'inactive' | 'needs-review';
}

export interface Report {
  id: string;
  type: 'user-progress' | 'content-performance' | 'financial' | 'engagement' | 'system';
  title: string;
  description: string;
  dateRange: {
    start: string;
    end: string;
  };
  generatedBy: string;
  generatedAt: string;
  status: 'completed' | 'processing' | 'failed';
  fileUrl?: string;
  summary: {
    totalRecords: number;
    keyMetrics: Record<string, number | string>;
  };
}

export interface VIPSubscription {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userAvatar: string;
  plan: 'premium' | 'elite';
  status: 'active' | 'expired' | 'cancelled' | 'pending';
  startDate: string;
  endDate: string;
  amount: number;
  currency: string;
  paymentMethod: 'credit-card' | 'paypal' | 'bank-transfer' | 'voucher';
  autoRenew: boolean;
  features: string[];
  lastPaymentDate?: string;
  nextBillingDate?: string;
}

export interface Notification {
  id: string;
  type: 'system' | 'update' | 'announcement' | 'maintenance' | 'alert' | 'promotion';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  title: string;
  message: string;
  targetAudience: 'all' | 'students' | 'teachers' | 'vip' | 'specific';
  targetUserIds?: string[];
  scheduledFor?: string;
  sentAt?: string;
  status: 'draft' | 'scheduled' | 'sent' | 'failed';
  createdBy: string;
  createdAt: string;
  readCount: number;
  totalRecipients: number;
  clickRate?: number;
}

export interface SystemSettings {
  id: string;
  category: 'general' | 'security' | 'email' | 'payment' | 'gamification' | 'api';
  key: string;
  value: string | number | boolean;
  displayName: string;
  description: string;
  dataType: 'string' | 'number' | 'boolean' | 'json';
  isPublic: boolean;
  lastModified: string;
  modifiedBy: string;
}

export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  newUsersThisMonth: number;
  totalLessons: number;
  totalUnits: number;
  totalQuestions: number;
  totalTests: number;
  averageCompletionRate: number;
  averageAccuracy: number;
  totalRevenue: number;
  revenueThisMonth: number;
  vipSubscriptions: {
    premium: number;
    elite: number;
    total: number;
  };
  systemHealth: {
    status: 'healthy' | 'warning' | 'critical';
    uptime: number; // percentage
    responseTime: number; // ms
    errorRate: number; // percentage
  };
}

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  target: string;
  targetId?: string;
  timestamp: string;
  ipAddress: string;
  userAgent: string;
  status: 'success' | 'failed' | 'warning';
  details?: string;
}

export interface Analytics {
  period: 'today' | 'week' | 'month' | 'year';
  userGrowth: Array<{ date: string; count: number }>;
  engagement: Array<{ date: string; activeUsers: number; totalSessions: number }>;
  revenue: Array<{ date: string; amount: number }>;
  topUnits: Array<{ unitId: number; title: string; completions: number; rating: number }>;
  topQuestions: Array<{ questionId: string; question: string; attempts: number; successRate: number }>;
  deviceBreakdown: { desktop: number; mobile: number; tablet: number };
  browserBreakdown: Record<string, number>;
}

// ============================================
// ADMIN DASHBOARD DATA
// ============================================

export const dashboardStats: DashboardStats = {
  totalUsers: 12458,
  activeUsers: 8234,
  newUsersToday: 45,
  newUsersThisWeek: 312,
  newUsersThisMonth: 1287,
  totalLessons: 240,
  totalUnits: 10,
  totalQuestions: 1856,
  totalTests: 50,
  averageCompletionRate: 68.5,
  averageAccuracy: 84.2,
  totalRevenue: 458920,
  revenueThisMonth: 34500,
  vipSubscriptions: {
    premium: 1234,
    elite: 456,
    total: 1690,
  },
  systemHealth: {
    status: 'healthy',
    uptime: 99.8,
    responseTime: 145,
    errorRate: 0.2,
  },
};

export const analytics: Analytics = {
  period: 'month',
  userGrowth: [
    { date: '2026-03-08', count: 11890 },
    { date: '2026-03-15', count: 12045 },
    { date: '2026-03-22', count: 12198 },
    { date: '2026-03-29', count: 12356 },
    { date: '2026-04-05', count: 12458 },
  ],
  engagement: [
    { date: '2026-04-01', activeUsers: 7850, totalSessions: 15670 },
    { date: '2026-04-02', activeUsers: 8120, totalSessions: 16240 },
    { date: '2026-04-03', activeUsers: 7940, totalSessions: 15880 },
    { date: '2026-04-04', activeUsers: 8350, totalSessions: 16700 },
    { date: '2026-04-05', activeUsers: 8090, totalSessions: 16180 },
    { date: '2026-04-06', activeUsers: 7680, totalSessions: 15360 },
    { date: '2026-04-07', activeUsers: 8234, totalSessions: 16468 },
  ],
  revenue: [
    { date: '2026-03', amount: 38200 },
    { date: '2026-04', amount: 34500 },
  ],
  topUnits: [
    { unitId: 1, title: 'Family Life', completions: 8456, rating: 4.8 },
    { unitId: 2, title: 'Healthy Living', completions: 6234, rating: 4.6 },
    { unitId: 3, title: 'Music', completions: 4521, rating: 4.7 },
    { unitId: 4, title: 'For a Better Community', completions: 3123, rating: 4.5 },
    { unitId: 5, title: 'Inventions', completions: 2456, rating: 4.4 },
  ],
  topQuestions: [
    { questionId: 'q-001', question: 'Present Simple - Habits', attempts: 5678, successRate: 87.5 },
    { questionId: 'q-002', question: 'Past Perfect Continuous', attempts: 4321, successRate: 72.3 },
    { questionId: 'q-003', question: 'Health Vocabulary', attempts: 3987, successRate: 91.2 },
  ],
  deviceBreakdown: { desktop: 45, mobile: 42, tablet: 13 },
  browserBreakdown: { Chrome: 58, Safari: 23, Firefox: 12, Edge: 5, Other: 2 },
};

// ============================================
// USER MANAGEMENT DATA
// ============================================

export const adminUsers: AdminUser[] = [
  {
    id: 'user-001',
    name: 'The Scholar',
    email: 'scholar@uifive.edu',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Scholar',
    role: 'student',
    status: 'active',
    vipStatus: 'premium',
    level: 42,
    xp: 12450,
    coins: 1240,
    streak: 15,
    accuracy: 92,
    joinedDate: '2024-01-15',
    lastActive: '2026-04-07T14:30:00Z',
    totalLessonsCompleted: 24,
    totalTestsTaken: 8,
    averageScore: 87.5,
  },
  {
    id: 'user-101',
    name: 'Emma Wilson',
    email: 'emma.wilson@uifive.edu',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma',
    role: 'student',
    status: 'active',
    vipStatus: 'elite',
    level: 67,
    xp: 25680,
    coins: 3450,
    streak: 45,
    accuracy: 98,
    joinedDate: '2023-09-01',
    lastActive: '2026-04-07T16:45:00Z',
    totalLessonsCompleted: 120,
    totalTestsTaken: 35,
    averageScore: 95.2,
  },
  {
    id: 'user-102',
    name: 'Liam Chen',
    email: 'liam.chen@uifive.edu',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Liam',
    role: 'student',
    status: 'active',
    vipStatus: 'premium',
    level: 62,
    xp: 23450,
    coins: 2890,
    streak: 38,
    accuracy: 96,
    joinedDate: '2023-10-12',
    lastActive: '2026-04-07T15:20:00Z',
    totalLessonsCompleted: 98,
    totalTestsTaken: 28,
    averageScore: 93.8,
  },
  {
    id: 'teacher-001',
    name: 'Dr. Sarah Johnson',
    email: 'sarah.johnson@uifive.edu',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
    role: 'teacher',
    status: 'active',
    vipStatus: 'elite',
    level: 85,
    xp: 45000,
    coins: 0,
    streak: 120,
    accuracy: 100,
    joinedDate: '2023-01-05',
    lastActive: '2026-04-07T17:00:00Z',
    totalLessonsCompleted: 0,
    totalTestsTaken: 0,
    averageScore: 0,
  },
  {
    id: 'admin-001',
    name: 'Michael Anderson',
    email: 'michael.anderson@uifive.edu',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Michael',
    role: 'admin',
    status: 'active',
    vipStatus: 'elite',
    level: 99,
    xp: 99999,
    coins: 0,
    streak: 365,
    accuracy: 100,
    joinedDate: '2022-06-01',
    lastActive: '2026-04-07T17:30:00Z',
    totalLessonsCompleted: 0,
    totalTestsTaken: 0,
    averageScore: 0,
  },
  {
    id: 'user-103',
    name: 'Sofia Rodriguez',
    email: 'sofia.rodriguez@uifive.edu',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sofia',
    role: 'student',
    status: 'active',
    vipStatus: 'free',
    level: 58,
    xp: 21230,
    coins: 890,
    streak: 42,
    accuracy: 95,
    joinedDate: '2023-11-20',
    lastActive: '2026-04-07T13:15:00Z',
    totalLessonsCompleted: 85,
    totalTestsTaken: 24,
    averageScore: 91.3,
  },
  {
    id: 'user-104',
    name: 'Noah Kim',
    email: 'noah.kim@uifive.edu',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Noah',
    role: 'student',
    status: 'inactive',
    vipStatus: 'free',
    level: 25,
    xp: 8750,
    coins: 420,
    streak: 0,
    accuracy: 78,
    joinedDate: '2024-02-10',
    lastActive: '2026-03-15T10:30:00Z',
    totalLessonsCompleted: 18,
    totalTestsTaken: 5,
    averageScore: 76.4,
  },
  {
    id: 'user-105',
    name: 'Isabella Martinez',
    email: 'isabella.martinez@uifive.edu',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Isabella',
    role: 'student',
    status: 'suspended',
    vipStatus: 'free',
    level: 12,
    xp: 3200,
    coins: 150,
    streak: 0,
    accuracy: 65,
    joinedDate: '2024-03-05',
    lastActive: '2026-03-28T08:45:00Z',
    totalLessonsCompleted: 8,
    totalTestsTaken: 2,
    averageScore: 64.5,
  },
  {
    id: 'user-new-001',
    name: 'Alex Thompson',
    email: 'alex.thompson@uifive.edu',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
    role: 'student',
    status: 'pending',
    vipStatus: 'free',
    level: 1,
    xp: 0,
    coins: 0,
    streak: 0,
    accuracy: 0,
    joinedDate: '2026-04-07',
    lastActive: '2026-04-07T09:00:00Z',
    totalLessonsCompleted: 0,
    totalTestsTaken: 0,
    averageScore: 0,
  },
];

// ============================================
// CONTENT MANAGEMENT DATA
// ============================================

export const contentItems: ContentItem[] = [
  {
    id: 'content-001',
    type: 'unit',
    title: 'Family Life',
    description: 'Learn vocabulary and grammar related to family relationships',
    unitId: 1,
    difficulty: 'beginner',
    status: 'published',
    author: 'Dr. Sarah Johnson',
    createdAt: '2023-08-15',
    updatedAt: '2024-01-10',
    views: 8456,
    completionRate: 92.5,
    averageRating: 4.8,
    totalRatings: 1245,
  },
  {
    id: 'content-002',
    type: 'unit',
    title: 'Healthy Living',
    description: 'Explore topics about health, fitness, and lifestyle',
    unitId: 2,
    difficulty: 'intermediate',
    status: 'published',
    author: 'Dr. Sarah Johnson',
    createdAt: '2023-09-01',
    updatedAt: '2024-02-05',
    views: 6234,
    completionRate: 85.3,
    averageRating: 4.6,
    totalRatings: 987,
  },
  {
    id: 'content-003',
    type: 'lesson',
    title: 'Present Simple & Adverbs of Frequency',
    description: 'Master the present simple tense and frequency adverbs',
    unitId: 1,
    lessonType: 'grammar',
    difficulty: 'beginner',
    status: 'published',
    author: 'Teacher Mike',
    createdAt: '2023-08-20',
    updatedAt: '2024-01-15',
    views: 5678,
    completionRate: 88.7,
    averageRating: 4.7,
    totalRatings: 856,
  },
  {
    id: 'content-004',
    type: 'exercise',
    title: 'Listening - Family Conversations',
    description: 'Practice listening skills with real family dialogues',
    unitId: 1,
    lessonType: 'listening',
    difficulty: 'beginner',
    status: 'published',
    author: 'Teacher Anna',
    createdAt: '2023-08-25',
    updatedAt: '2024-01-20',
    views: 4521,
    completionRate: 79.2,
    averageRating: 4.5,
    totalRatings: 678,
  },
  {
    id: 'content-005',
    type: 'test',
    title: 'Unit 1 Final Test',
    description: 'Comprehensive test covering all Unit 1 topics',
    unitId: 1,
    difficulty: 'beginner',
    status: 'published',
    author: 'Dr. Sarah Johnson',
    createdAt: '2023-09-05',
    updatedAt: '2024-02-01',
    views: 3987,
    completionRate: 95.8,
    averageRating: 4.9,
    totalRatings: 892,
  },
  {
    id: 'content-006',
    type: 'lesson',
    title: 'Modal Verbs for Advice',
    description: 'Learn how to give advice using modal verbs',
    unitId: 2,
    lessonType: 'grammar',
    difficulty: 'intermediate',
    status: 'published',
    author: 'Teacher Mike',
    createdAt: '2023-09-10',
    updatedAt: '2024-02-10',
    views: 3456,
    completionRate: 82.4,
    averageRating: 4.6,
    totalRatings: 567,
  },
  {
    id: 'content-007',
    type: 'article',
    title: 'Advanced Grammar Guide',
    description: 'Comprehensive guide to advanced English grammar',
    difficulty: 'advanced',
    status: 'draft',
    author: 'Dr. Emily Roberts',
    createdAt: '2026-03-15',
    updatedAt: '2026-04-05',
    views: 0,
    completionRate: 0,
    averageRating: 0,
    totalRatings: 0,
  },
  {
    id: 'content-008',
    type: 'lesson',
    title: 'Compound Sentences in Music',
    description: 'Learn compound sentences through music lyrics',
    unitId: 3,
    lessonType: 'grammar',
    difficulty: 'intermediate',
    status: 'under-review',
    author: 'Teacher Lisa',
    createdAt: '2024-01-10',
    updatedAt: '2024-03-20',
    views: 1234,
    completionRate: 75.5,
    averageRating: 4.3,
    totalRatings: 234,
  },
];

// ============================================
// QUESTION BANK DATA
// ============================================

export const adminQuestions: AdminQuestion[] = [
  {
    id: 'q-admin-001',
    type: 'multiple-choice',
    category: 'grammar',
    difficulty: 'easy',
    question: 'My father _____ the dishes every evening after dinner.',
    options: ['wash', 'washes', 'is washing', 'has washed'],
    correctAnswer: 'washes',
    explanation: 'We use Present Simple (washes) for habits and routines.',
    points: 10,
    tags: ['present-simple', 'habits', 'family-life'],
    unitId: 1,
    usageCount: 5678,
    successRate: 87.5,
    averageTime: 12,
    createdBy: 'Dr. Sarah Johnson',
    createdAt: '2023-08-20',
    lastUsed: '2026-04-07',
    status: 'active',
  },
  {
    id: 'q-admin-002',
    type: 'multiple-choice',
    category: 'grammar',
    difficulty: 'hard',
    question: 'By the time the professor arrived, the students _____ for twenty minutes.',
    options: ['had been preparing', 'were preparing', 'have prepared', 'prepared'],
    correctAnswer: 'had been preparing',
    explanation: 'Past Perfect Continuous shows an action that was ongoing before another past action.',
    points: 15,
    tags: ['past-perfect-continuous', 'complex-grammar'],
    usageCount: 4321,
    successRate: 68.3,
    averageTime: 25,
    createdBy: 'Teacher Mike',
    createdAt: '2023-10-05',
    lastUsed: '2026-04-06',
    status: 'active',
  },
  {
    id: 'q-admin-003',
    type: 'multiple-choice',
    category: 'vocabulary',
    difficulty: 'easy',
    question: 'A person who takes care of sick people in a hospital is called a _____.',
    options: ['teacher', 'nurse', 'engineer', 'chef'],
    correctAnswer: 'nurse',
    explanation: 'A nurse is a healthcare professional who provides medical care.',
    points: 5,
    tags: ['health-vocabulary', 'professions', 'healthy-living'],
    unitId: 2,
    usageCount: 3987,
    successRate: 94.2,
    averageTime: 8,
    createdBy: 'Teacher Anna',
    createdAt: '2023-09-15',
    lastUsed: '2026-04-07',
    status: 'active',
  },
  {
    id: 'q-admin-004',
    type: 'true-false',
    category: 'reading',
    difficulty: 'medium',
    question: 'The Comma butterfly has struggled to adapt to warming climate.',
    correctAnswer: 'false',
    explanation: 'According to the passage, generalist species like the Comma are thriving.',
    points: 10,
    tags: ['reading-comprehension', 'climate-change', 'nature'],
    usageCount: 2456,
    successRate: 76.8,
    averageTime: 45,
    createdBy: 'Dr. Emily Roberts',
    createdAt: '2024-01-10',
    lastUsed: '2026-04-05',
    status: 'active',
  },
  {
    id: 'q-admin-005',
    type: 'fill-blank',
    category: 'listening',
    difficulty: 'medium',
    question: 'Longevity is _____ to diet and exercise.',
    correctAnswer: 'linked',
    explanation: 'The audio mentions that longevity is "linked to" healthy lifestyle.',
    points: 10,
    tags: ['listening', 'health', 'collocations'],
    unitId: 2,
    usageCount: 1823,
    successRate: 82.5,
    averageTime: 30,
    createdBy: 'Teacher Anna',
    createdAt: '2023-11-20',
    lastUsed: '2026-04-04',
    status: 'active',
  },
  {
    id: 'q-admin-006',
    type: 'multiple-choice',
    category: 'vocabulary',
    difficulty: 'medium',
    question: 'The concert was _____ - everyone enjoyed the performance.',
    options: ['boring', 'terrible', 'fantastic', 'awful'],
    correctAnswer: 'fantastic',
    explanation: 'Context indicates a positive adjective. "Fantastic" means extremely good.',
    points: 10,
    tags: ['music-vocabulary', 'adjectives', 'context-clues'],
    unitId: 3,
    usageCount: 2987,
    successRate: 89.3,
    averageTime: 10,
    createdBy: 'Teacher Lisa',
    createdAt: '2024-01-25',
    lastUsed: '2026-04-06',
    status: 'active',
  },
  {
    id: 'q-admin-007',
    type: 'essay',
    category: 'writing',
    difficulty: 'advanced',
    question: 'Write an essay about the impact of technology on modern education (250 words).',
    correctAnswer: '',
    explanation: 'Essay should include: introduction, main points, examples, and conclusion.',
    points: 30,
    tags: ['writing', 'essay', 'technology', 'education'],
    usageCount: 567,
    successRate: 72.4,
    averageTime: 900,
    createdBy: 'Dr. Emily Roberts',
    createdAt: '2024-02-01',
    lastUsed: '2026-04-03',
    status: 'active',
  },
  {
    id: 'q-admin-008',
    type: 'multiple-choice',
    category: 'grammar',
    difficulty: 'medium',
    question: 'If I _____ you, I would study harder for the exam.',
    options: ['am', 'was', 'were', 'be'],
    correctAnswer: 'were',
    explanation: 'Second conditional uses "were" for all persons in the if-clause.',
    points: 10,
    tags: ['conditionals', 'subjunctive', 'hypothetical'],
    usageCount: 345,
    successRate: 65.2,
    averageTime: 15,
    createdBy: 'Teacher Mike',
    createdAt: '2024-03-10',
    status: 'needs-review',
  },
];

// ============================================
// REPORTS DATA
// ============================================

export const reports: Report[] = [
  {
    id: 'report-001',
    type: 'user-progress',
    title: 'Monthly User Progress Report - March 2026',
    description: 'Comprehensive analysis of user learning progress throughout March',
    dateRange: {
      start: '2026-03-01',
      end: '2026-03-31',
    },
    generatedBy: 'admin-001',
    generatedAt: '2026-04-01T09:00:00Z',
    status: 'completed',
    fileUrl: '/reports/user-progress-march-2026.pdf',
    summary: {
      totalRecords: 12171,
      keyMetrics: {
        'Average Completion Rate': '68.5%',
        'Total Lessons Completed': 145678,
        'Average Score': '84.2%',
        'Active Users': 8234,
      },
    },
  },
  {
    id: 'report-002',
    type: 'content-performance',
    title: 'Q1 2026 Content Performance Analysis',
    description: 'Performance metrics for all content items in Q1',
    dateRange: {
      start: '2026-01-01',
      end: '2026-03-31',
    },
    generatedBy: 'admin-001',
    generatedAt: '2026-04-02T10:30:00Z',
    status: 'completed',
    fileUrl: '/reports/content-performance-q1-2026.pdf',
    summary: {
      totalRecords: 240,
      keyMetrics: {
        'Top Unit': 'Family Life (92.5%)',
        'Average Rating': '4.6/5.0',
        'Total Views': 234567,
        'Completion Rate': '85.3%',
      },
    },
  },
  {
    id: 'report-003',
    type: 'financial',
    title: 'Revenue Report - March 2026',
    description: 'Financial summary including subscriptions and transactions',
    dateRange: {
      start: '2026-03-01',
      end: '2026-03-31',
    },
    generatedBy: 'admin-001',
    generatedAt: '2026-04-01T14:00:00Z',
    status: 'completed',
    fileUrl: '/reports/revenue-march-2026.pdf',
    summary: {
      totalRecords: 1287,
      keyMetrics: {
        'Total Revenue': '$38,200',
        'New Subscriptions': 287,
        'Renewals': 1000,
        'Churn Rate': '3.2%',
      },
    },
  },
  {
    id: 'report-004',
    type: 'engagement',
    title: 'Weekly Engagement Report - Week 14',
    description: 'User engagement metrics for week of Apr 1-7, 2026',
    dateRange: {
      start: '2026-04-01',
      end: '2026-04-07',
    },
    generatedBy: 'admin-001',
    generatedAt: '2026-04-07T17:00:00Z',
    status: 'processing',
    summary: {
      totalRecords: 8234,
      keyMetrics: {
        'Daily Active Users': '8,234',
        'Average Session Time': '42 minutes',
        'Total Sessions': '16,468',
        'Bounce Rate': '12.3%',
      },
    },
  },
  {
    id: 'report-005',
    type: 'system',
    title: 'System Health Report - April 2026',
    description: 'Server performance, uptime, and error logs',
    dateRange: {
      start: '2026-04-01',
      end: '2026-04-07',
    },
    generatedBy: 'system',
    generatedAt: '2026-04-07T00:00:00Z',
    status: 'completed',
    fileUrl: '/reports/system-health-april-2026.pdf',
    summary: {
      totalRecords: 168,
      keyMetrics: {
        'Uptime': '99.8%',
        'Avg Response Time': '145ms',
        'Error Rate': '0.2%',
        'Peak Load': '12,450 concurrent users',
      },
    },
  },
];

// ============================================
// VIP MANAGEMENT DATA
// ============================================

export const vipSubscriptions: VIPSubscription[] = [
  {
    id: 'vip-001',
    userId: 'user-001',
    userName: 'The Scholar',
    userEmail: 'scholar@uifive.edu',
    userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Scholar',
    plan: 'premium',
    status: 'active',
    startDate: '2024-03-01',
    endDate: '2025-03-01',
    amount: 500,
    currency: 'USD',
    paymentMethod: 'credit-card',
    autoRenew: true,
    features: ['Ad-free', 'Exclusive content', 'Priority support', 'Progress tracking'],
    lastPaymentDate: '2024-03-01',
    nextBillingDate: '2025-03-01',
  },
  {
    id: 'vip-002',
    userId: 'user-101',
    userName: 'Emma Wilson',
    userEmail: 'emma.wilson@uifive.edu',
    userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma',
    plan: 'elite',
    status: 'active',
    startDate: '2023-09-01',
    endDate: '2024-09-01',
    amount: 5000,
    currency: 'USD',
    paymentMethod: 'bank-transfer',
    autoRenew: true,
    features: [
      'All Premium features',
      'Personal tutor',
      'Certificates',
      'Offline access',
      'Custom learning path',
    ],
    lastPaymentDate: '2023-09-01',
    nextBillingDate: '2024-09-01',
  },
  {
    id: 'vip-003',
    userId: 'user-102',
    userName: 'Liam Chen',
    userEmail: 'liam.chen@uifive.edu',
    userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Liam',
    plan: 'premium',
    status: 'active',
    startDate: '2024-01-15',
    endDate: '2025-01-15',
    amount: 500,
    currency: 'USD',
    paymentMethod: 'paypal',
    autoRenew: true,
    features: ['Ad-free', 'Exclusive content', 'Priority support', 'Progress tracking'],
    lastPaymentDate: '2024-01-15',
    nextBillingDate: '2025-01-15',
  },
  {
    id: 'vip-004',
    userId: 'user-110',
    userName: 'Oliver Brown',
    userEmail: 'oliver.brown@uifive.edu',
    userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Oliver',
    plan: 'premium',
    status: 'expired',
    startDate: '2023-06-01',
    endDate: '2024-06-01',
    amount: 500,
    currency: 'USD',
    paymentMethod: 'credit-card',
    autoRenew: false,
    features: ['Ad-free', 'Exclusive content', 'Priority support', 'Progress tracking'],
    lastPaymentDate: '2023-06-01',
  },
  {
    id: 'vip-005',
    userId: 'user-111',
    userName: 'Sophia Taylor',
    userEmail: 'sophia.taylor@uifive.edu',
    userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sophia',
    plan: 'elite',
    status: 'cancelled',
    startDate: '2024-02-01',
    endDate: '2024-08-01',
    amount: 5000,
    currency: 'USD',
    paymentMethod: 'credit-card',
    autoRenew: false,
    features: [
      'All Premium features',
      'Personal tutor',
      'Certificates',
      'Offline access',
      'Custom learning path',
    ],
    lastPaymentDate: '2024-02-01',
  },
  {
    id: 'vip-006',
    userId: 'user-112',
    userName: 'William Davis',
    userEmail: 'william.davis@uifive.edu',
    userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=William',
    plan: 'premium',
    status: 'pending',
    startDate: '2026-04-07',
    endDate: '2027-04-07',
    amount: 500,
    currency: 'USD',
    paymentMethod: 'voucher',
    autoRenew: false,
    features: ['Ad-free', 'Exclusive content', 'Priority support', 'Progress tracking'],
  },
];

// ============================================
// NOTIFICATIONS DATA
// ============================================

export const notifications: Notification[] = [
  {
    id: 'notif-001',
    type: 'announcement',
    priority: 'high',
    title: 'New Units Released!',
    message: 'Units 6-8 are now available for Học kỳ 2. Start learning today!',
    targetAudience: 'all',
    scheduledFor: '2026-04-08T09:00:00Z',
    status: 'scheduled',
    createdBy: 'admin-001',
    createdAt: '2026-04-07T15:00:00Z',
    readCount: 0,
    totalRecipients: 12458,
  },
  {
    id: 'notif-002',
    type: 'system',
    priority: 'urgent',
    title: 'Scheduled Maintenance',
    message: 'System maintenance on April 10, 2026 from 2:00 AM to 4:00 AM UTC. Services may be unavailable.',
    targetAudience: 'all',
    scheduledFor: '2026-04-09T12:00:00Z',
    status: 'scheduled',
    createdBy: 'admin-001',
    createdAt: '2026-04-07T14:00:00Z',
    readCount: 0,
    totalRecipients: 12458,
  },
  {
    id: 'notif-003',
    type: 'promotion',
    priority: 'medium',
    title: '50% Off Premium Subscriptions!',
    message: 'Upgrade to Premium and save 50% this week only. Limited time offer!',
    targetAudience: 'students',
    sentAt: '2026-04-05T10:00:00Z',
    status: 'sent',
    createdBy: 'admin-001',
    createdAt: '2026-04-04T16:00:00Z',
    readCount: 3456,
    totalRecipients: 10567,
    clickRate: 12.5,
  },
  {
    id: 'notif-004',
    type: 'update',
    priority: 'low',
    title: 'New Features: Test Review',
    message: 'Check out our new Test Review feature to learn from your mistakes and improve faster!',
    targetAudience: 'all',
    sentAt: '2026-04-01T09:00:00Z',
    status: 'sent',
    createdBy: 'admin-001',
    createdAt: '2026-03-31T10:00:00Z',
    readCount: 8234,
    totalRecipients: 12171,
    clickRate: 28.3,
  },
  {
    id: 'notif-005',
    type: 'alert',
    priority: 'high',
    title: 'Your Streak is at Risk!',
    message: 'You haven\'t completed any activities today. Keep your streak alive!',
    targetAudience: 'specific',
    targetUserIds: ['user-104', 'user-105'],
    sentAt: '2026-04-06T20:00:00Z',
    status: 'sent',
    createdBy: 'system',
    createdAt: '2026-04-06T20:00:00Z',
    readCount: 1,
    totalRecipients: 2,
    clickRate: 50.0,
  },
  {
    id: 'notif-006',
    type: 'announcement',
    priority: 'medium',
    title: 'Leaderboard Season Ends Soon',
    message: 'Only 3 days left in the current season. Push for that top spot!',
    targetAudience: 'all',
    status: 'draft',
    createdBy: 'admin-001',
    createdAt: '2026-04-07T11:00:00Z',
    readCount: 0,
    totalRecipients: 12458,
  },
];

// ============================================
// SYSTEM SETTINGS DATA
// ============================================

export const systemSettings: SystemSettings[] = [
  // General Settings
  {
    id: 'setting-001',
    category: 'general',
    key: 'site_name',
    value: 'UIFIVE',
    displayName: 'Site Name',
    description: 'Name of the platform displayed to users',
    dataType: 'string',
    isPublic: true,
    lastModified: '2023-06-01',
    modifiedBy: 'admin-001',
  },
  {
    id: 'setting-002',
    category: 'general',
    key: 'site_description',
    value: 'English Learning Platform with Gamification',
    displayName: 'Site Description',
    description: 'Short description for SEO and marketing',
    dataType: 'string',
    isPublic: true,
    lastModified: '2023-06-01',
    modifiedBy: 'admin-001',
  },
  {
    id: 'setting-003',
    category: 'general',
    key: 'maintenance_mode',
    value: false,
    displayName: 'Maintenance Mode',
    description: 'Enable to show maintenance page to all users',
    dataType: 'boolean',
    isPublic: false,
    lastModified: '2026-04-01',
    modifiedBy: 'admin-001',
  },
  // Security Settings
  {
    id: 'setting-004',
    category: 'security',
    key: 'session_timeout',
    value: 3600,
    displayName: 'Session Timeout (seconds)',
    description: 'Auto logout after this period of inactivity',
    dataType: 'number',
    isPublic: false,
    lastModified: '2024-01-10',
    modifiedBy: 'admin-001',
  },
  {
    id: 'setting-005',
    category: 'security',
    key: 'max_login_attempts',
    value: 5,
    displayName: 'Max Login Attempts',
    description: 'Lock account after this many failed login attempts',
    dataType: 'number',
    isPublic: false,
    lastModified: '2024-01-10',
    modifiedBy: 'admin-001',
  },
  {
    id: 'setting-006',
    category: 'security',
    key: 'require_email_verification',
    value: true,
    displayName: 'Require Email Verification',
    description: 'Users must verify email before accessing platform',
    dataType: 'boolean',
    isPublic: false,
    lastModified: '2023-06-01',
    modifiedBy: 'admin-001',
  },
  // Email Settings
  {
    id: 'setting-007',
    category: 'email',
    key: 'smtp_host',
    value: 'smtp.uifive.edu',
    displayName: 'SMTP Host',
    description: 'Email server hostname',
    dataType: 'string',
    isPublic: false,
    lastModified: '2023-06-01',
    modifiedBy: 'admin-001',
  },
  {
    id: 'setting-008',
    category: 'email',
    key: 'smtp_port',
    value: 587,
    displayName: 'SMTP Port',
    description: 'Email server port',
    dataType: 'number',
    isPublic: false,
    lastModified: '2023-06-01',
    modifiedBy: 'admin-001',
  },
  {
    id: 'setting-009',
    category: 'email',
    key: 'from_email',
    value: 'noreply@uifive.edu',
    displayName: 'From Email Address',
    description: 'Email address shown as sender',
    dataType: 'string',
    isPublic: false,
    lastModified: '2023-06-01',
    modifiedBy: 'admin-001',
  },
  // Payment Settings
  {
    id: 'setting-010',
    category: 'payment',
    key: 'premium_monthly_price',
    value: 500,
    displayName: 'Premium Monthly Price',
    description: 'Price in coins for monthly premium subscription',
    dataType: 'number',
    isPublic: true,
    lastModified: '2024-01-01',
    modifiedBy: 'admin-001',
  },
  {
    id: 'setting-011',
    category: 'payment',
    key: 'elite_yearly_price',
    value: 5000,
    displayName: 'Elite Yearly Price',
    description: 'Price in coins for yearly elite subscription',
    dataType: 'number',
    isPublic: true,
    lastModified: '2024-01-01',
    modifiedBy: 'admin-001',
  },
  // Gamification Settings
  {
    id: 'setting-012',
    category: 'gamification',
    key: 'xp_per_level',
    value: 300,
    displayName: 'XP Per Level',
    description: 'Base XP required per level (multiplied by level number)',
    dataType: 'number',
    isPublic: true,
    lastModified: '2023-08-01',
    modifiedBy: 'admin-001',
  },
  {
    id: 'setting-013',
    category: 'gamification',
    key: 'streak_freeze_price',
    value: 30,
    displayName: 'Streak Freeze Price',
    description: 'Cost in coins to buy streak freeze',
    dataType: 'number',
    isPublic: true,
    lastModified: '2024-02-01',
    modifiedBy: 'admin-001',
  },
  {
    id: 'setting-014',
    category: 'gamification',
    key: 'daily_goal_xp',
    value: 50,
    displayName: 'Daily Goal XP',
    description: 'Minimum XP to maintain streak',
    dataType: 'number',
    isPublic: true,
    lastModified: '2023-08-01',
    modifiedBy: 'admin-001',
  },
  // API Settings
  {
    id: 'setting-015',
    category: 'api',
    key: 'api_rate_limit',
    value: 100,
    displayName: 'API Rate Limit',
    description: 'Max requests per minute per user',
    dataType: 'number',
    isPublic: false,
    lastModified: '2024-01-15',
    modifiedBy: 'admin-001',
  },
];

// ============================================
// ACTIVITY LOGS DATA
// ============================================

export const activityLogs: ActivityLog[] = [
  {
    id: 'log-001',
    userId: 'admin-001',
    userName: 'Michael Anderson',
    action: 'Updated system setting',
    target: 'maintenance_mode',
    targetId: 'setting-003',
    timestamp: '2026-04-07T17:30:00Z',
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    status: 'success',
    details: 'Changed value from true to false',
  },
  {
    id: 'log-002',
    userId: 'admin-001',
    userName: 'Michael Anderson',
    action: 'Created notification',
    target: 'New Units Released!',
    targetId: 'notif-001',
    timestamp: '2026-04-07T15:00:00Z',
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    status: 'success',
    details: 'Scheduled for 2026-04-08T09:00:00Z',
  },
  {
    id: 'log-003',
    userId: 'teacher-001',
    userName: 'Dr. Sarah Johnson',
    action: 'Published content',
    target: 'Unit 1 Final Test',
    targetId: 'content-005',
    timestamp: '2026-04-07T14:20:00Z',
    ipAddress: '192.168.1.105',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    status: 'success',
    details: 'Changed status from draft to published',
  },
  {
    id: 'log-004',
    userId: 'admin-001',
    userName: 'Michael Anderson',
    action: 'Generated report',
    target: 'Weekly Engagement Report',
    targetId: 'report-004',
    timestamp: '2026-04-07T17:00:00Z',
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    status: 'success',
    details: 'Date range: 2026-04-01 to 2026-04-07',
  },
  {
    id: 'log-005',
    userId: 'admin-001',
    userName: 'Michael Anderson',
    action: 'Suspended user',
    target: 'Isabella Martinez',
    targetId: 'user-105',
    timestamp: '2026-04-06T10:30:00Z',
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    status: 'success',
    details: 'Reason: Policy violation',
  },
  {
    id: 'log-006',
    userId: 'teacher-001',
    userName: 'Dr. Sarah Johnson',
    action: 'Added question',
    target: 'Grammar - Conditionals',
    targetId: 'q-admin-008',
    timestamp: '2026-04-05T16:45:00Z',
    ipAddress: '192.168.1.105',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    status: 'success',
    details: 'Added to question bank with needs-review status',
  },
  {
    id: 'log-007',
    userId: 'admin-001',
    userName: 'Michael Anderson',
    action: 'Failed login attempt',
    target: 'Admin panel',
    timestamp: '2026-04-04T08:15:00Z',
    ipAddress: '203.0.113.42',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    status: 'failed',
    details: 'Incorrect password',
  },
];

// ============================================
// HELPER FUNCTIONS
// ============================================

export const getAdminUserById = (userId: string): AdminUser | undefined => {
  return adminUsers.find(u => u.id === userId);
};

export const getContentById = (contentId: string): ContentItem | undefined => {
  return contentItems.find(c => c.id === contentId);
};

export const getContentByUnit = (unitId: number): ContentItem[] => {
  return contentItems.filter(c => c.unitId === unitId);
};

export const getQuestionById = (questionId: string): AdminQuestion | undefined => {
  return adminQuestions.find(q => q.id === questionId);
};

export const getQuestionsByCategory = (category: string): AdminQuestion[] => {
  return adminQuestions.filter(q => q.category === category);
};

export const getQuestionsByDifficulty = (difficulty: string): AdminQuestion[] => {
  return adminQuestions.filter(q => q.difficulty === difficulty);
};

export const getActiveVipSubscriptions = (): VIPSubscription[] => {
  return vipSubscriptions.filter(v => v.status === 'active');
};

export const getVipByUserId = (userId: string): VIPSubscription | undefined => {
  return vipSubscriptions.find(v => v.userId === userId);
};

export const getScheduledNotifications = (): Notification[] => {
  return notifications.filter(n => n.status === 'scheduled');
};

export const getSentNotifications = (): Notification[] => {
  return notifications.filter(n => n.status === 'sent');
};

export const getSettingsByCategory = (category: string): SystemSettings[] => {
  return systemSettings.filter(s => s.category === category);
};

export const getSettingValue = (key: string): string | number | boolean | undefined => {
  const setting = systemSettings.find(s => s.key === key);
  return setting?.value;
};

export const getRecentActivityLogs = (limit: number = 10): ActivityLog[] => {
  return activityLogs
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limit);
};

export const getUserStatsSummary = () => {
  return {
    total: adminUsers.length,
    active: adminUsers.filter(u => u.status === 'active').length,
    inactive: adminUsers.filter(u => u.status === 'inactive').length,
    suspended: adminUsers.filter(u => u.status === 'suspended').length,
    pending: adminUsers.filter(u => u.status === 'pending').length,
    students: adminUsers.filter(u => u.role === 'student').length,
    teachers: adminUsers.filter(u => u.role === 'teacher').length,
    admins: adminUsers.filter(u => u.role === 'admin' || u.role === 'super-admin').length,
  };
};

export const getVipStatsSummary = () => {
  const activeVips = vipSubscriptions.filter(v => v.status === 'active');
  const cancelledVips = vipSubscriptions.filter(v => v.status === 'cancelled');
  const expiredVips = vipSubscriptions.filter(v => v.status === 'expired');
  const premiumVips = activeVips.filter(v => v.plan === 'premium');
  const eliteVips = activeVips.filter(v => v.plan === 'elite');
  
  // Calculate expiring soon (within 30 days)
  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const expiringSoon = activeVips.filter(v => {
    const endDate = new Date(v.endDate);
    return endDate <= thirtyDaysFromNow && endDate > now;
  });

  // Calculate monthly revenue
  const monthlyRevenue = activeVips.reduce((sum, v) => {
    const price = v.plan === 'premium' ? 49.99 : 99.99;
    return sum + price;
  }, 0);

  // Calculate conversion rate (assuming 10% of total users have VIP)
  const totalUsers = adminUsers.length;
  const conversionRate = (activeVips.length / totalUsers) * 100;

  return {
    totalSubscriptions: vipSubscriptions.length,
    activeSubscriptions: activeVips.length,
    cancelledSubscriptions: cancelledVips.length,
    expiredSubscriptions: expiredVips.length,
    activePremium: premiumVips.length,
    activeElite: eliteVips.length,
    expiringSoon: expiringSoon.length,
    monthlyRevenue,
    conversionRate,
  };
};

export const getContentStatsSummary = () => {
  return {
    total: contentItems.length,
    published: contentItems.filter(c => c.status === 'published').length,
    draft: contentItems.filter(c => c.status === 'draft').length,
    underReview: contentItems.filter(c => c.status === 'under-review').length,
    archived: contentItems.filter(c => c.status === 'archived').length,
    units: contentItems.filter(c => c.type === 'unit').length,
    lessons: contentItems.filter(c => c.type === 'lesson').length,
    exercises: contentItems.filter(c => c.type === 'exercise').length,
    tests: contentItems.filter(c => c.type === 'test').length,
  };
};

export const getQuestionStatsSummary = () => {
  return {
    total: adminQuestions.length,
    active: adminQuestions.filter(q => q.status === 'active').length,
    inactive: adminQuestions.filter(q => q.status === 'inactive').length,
    needsReview: adminQuestions.filter(q => q.status === 'needs-review').length,
    grammar: adminQuestions.filter(q => q.category === 'grammar').length,
    vocabulary: adminQuestions.filter(q => q.category === 'vocabulary').length,
    listening: adminQuestions.filter(q => q.category === 'listening').length,
    reading: adminQuestions.filter(q => q.category === 'reading').length,
    writing: adminQuestions.filter(q => q.category === 'writing').length,
  };
};

export const calculateRevenue = (subscriptions: VIPSubscription[]): number => {
  return subscriptions
    .filter(s => s.status === 'active')
    .reduce((sum, s) => sum + s.amount, 0);
};