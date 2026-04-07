// Admin API Types & Interfaces

export interface AdminApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface PaginatedAdminResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface AdminApiError {
  code: string;
  message: string;
  details?: any;
}

// Request types
export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
  role: 'student' | 'teacher' | 'admin';
}

export interface UpdateUserRequest {
  name?: string;
  email?: string;
  role?: 'student' | 'teacher' | 'admin' | 'super-admin';
  status?: 'active' | 'inactive' | 'suspended' | 'pending';
  vipStatus?: 'free' | 'premium' | 'elite';
}

export interface CreateContentRequest {
  type: 'unit' | 'lesson' | 'exercise' | 'test' | 'article';
  title: string;
  description: string;
  unitId?: number;
  lessonType?: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  status?: 'draft' | 'published';
}

export interface UpdateContentRequest {
  title?: string;
  description?: string;
  status?: 'draft' | 'published' | 'archived' | 'under-review';
  difficulty?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
}

export interface CreateQuestionRequest {
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
}

export interface UpdateQuestionRequest {
  question?: string;
  options?: string[];
  correctAnswer?: string;
  explanation?: string;
  points?: number;
  tags?: string[];
  status?: 'active' | 'inactive' | 'needs-review';
  difficulty?: 'easy' | 'medium' | 'hard' | 'advanced';
}

export interface GenerateReportRequest {
  type: 'user-progress' | 'content-performance' | 'financial' | 'engagement' | 'system';
  title: string;
  description?: string;
  dateRange: {
    start: string;
    end: string;
  };
}

export interface CreateVIPSubscriptionRequest {
  userId: string;
  plan: 'premium' | 'elite';
  duration: number; // months
  amount: number;
  paymentMethod: 'credit-card' | 'paypal' | 'bank-transfer' | 'voucher';
  autoRenew?: boolean;
}

export interface UpdateVIPSubscriptionRequest {
  status?: 'active' | 'expired' | 'cancelled' | 'pending';
  endDate?: string;
  autoRenew?: boolean;
}

export interface CreateNotificationRequest {
  type: 'system' | 'update' | 'announcement' | 'maintenance' | 'alert' | 'promotion';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  title: string;
  message: string;
  targetAudience: 'all' | 'students' | 'teachers' | 'vip' | 'specific';
  targetUserIds?: string[];
  scheduledFor?: string;
}

export interface UpdateNotificationRequest {
  title?: string;
  message?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  scheduledFor?: string;
  status?: 'draft' | 'scheduled' | 'sent' | 'failed';
}

export interface UpdateSettingRequest {
  value: string | number | boolean;
}

// Filter types
export interface UserFilter {
  role?: 'student' | 'teacher' | 'admin' | 'super-admin';
  status?: 'active' | 'inactive' | 'suspended' | 'pending';
  vipStatus?: 'free' | 'premium' | 'elite';
  searchTerm?: string;
}

export interface ContentFilter {
  type?: 'unit' | 'lesson' | 'exercise' | 'test' | 'article';
  status?: 'draft' | 'published' | 'archived' | 'under-review';
  difficulty?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  unitId?: number;
}

export interface QuestionFilter {
  category?: 'grammar' | 'vocabulary' | 'listening' | 'reading' | 'writing' | 'speaking';
  difficulty?: 'easy' | 'medium' | 'hard' | 'advanced';
  status?: 'active' | 'inactive' | 'needs-review';
  unitId?: number;
  tags?: string[];
}

export interface ReportFilter {
  type?: 'user-progress' | 'content-performance' | 'financial' | 'engagement' | 'system';
  status?: 'completed' | 'processing' | 'failed';
  dateFrom?: string;
  dateTo?: string;
}

export interface VIPFilter {
  plan?: 'premium' | 'elite';
  status?: 'active' | 'expired' | 'cancelled' | 'pending';
}

export interface NotificationFilter {
  type?: 'system' | 'update' | 'announcement' | 'maintenance' | 'alert' | 'promotion';
  status?: 'draft' | 'scheduled' | 'sent' | 'failed';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
}

export interface SettingsFilter {
  category?: 'general' | 'security' | 'email' | 'payment' | 'gamification' | 'api';
}

export interface ActivityLogFilter {
  userId?: string;
  action?: string;
  status?: 'success' | 'failed' | 'warning';
  dateFrom?: string;
  dateTo?: string;
}
