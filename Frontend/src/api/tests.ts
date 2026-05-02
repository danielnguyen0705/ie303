// Tests API

import { questionBank, testResults, readingPassage } from '@/data/mockData';
import { simulateApiCall, createErrorResponse } from './client';
import type { ApiResponse, SubmitTestRequest } from './types';
import type { Question } from '@/data/mockData';

/**
 * Get test by ID
 */
export async function getTest(testId: string): Promise<
  ApiResponse<{
    id: string;
    title: string;
    description: string;
    type: 'pre-test' | 'post-test' | 'revision' | 'final';
    unitId?: number;
    questions: Question[];
    timeLimit: number; // seconds
    passingScore: number; // percentage
    totalPoints: number;
  }>
> {
  return simulateApiCall({
    id: testId,
    title: 'Unit 1 Final Test',
    description: 'Comprehensive test covering all Unit 1 topics',
    type: 'final',
    unitId: 1,
    questions: questionBank,
    timeLimit: 3600, // 60 minutes
    passingScore: 70,
    totalPoints: 100,
  });
}

/**
 * Get revision test
 */
export async function getRevisionTest(testId: string): Promise<
  ApiResponse<{
    id: string;
    title: string;
    passage: {
      title: string;
      content: string;
      imageUrl?: string;
    };
    questions: Array<{
      id: string;
      number: number;
      question: string;
      type: 'true-false-not-given' | 'multiple-choice' | 'fill-blank';
      options?: string[];
    }>;
    timeLimit: number;
    totalQuestions: number;
  }>
> {
  return simulateApiCall({
    id: testId,
    title: 'Revision Test - Reading Comprehension',
    passage: {
      title: readingPassage.title,
      content: readingPassage.content,
      imageUrl: 'https://images.unsplash.com/photo-1444464666168-49d633b86797?w=800',
    },
    questions: [
      {
        id: 'q-001',
        number: 1,
        question: 'The Comma butterfly has struggled to adapt to the warming climate in northern Britain.',
        type: 'true-false-not-given',
      },
      {
        id: 'q-002',
        number: 2,
        question: 'Specialist butterflies are more vulnerable to habitat loss than generalist species.',
        type: 'true-false-not-given',
      },
      // ... more questions
    ],
    timeLimit: 3600,
    totalQuestions: 50,
  });
}

/**
 * Submit test
 */
export async function submitTest(data: SubmitTestRequest): Promise<
  ApiResponse<{
    testId: string;
    score: number;
    totalPoints: number;
    accuracy: number;
    timeSpent: number;
    passed: boolean;
    grade: 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D' | 'F';
    correctAnswers: number;
    totalQuestions: number;
    skillBreakdown: {
      listening: number;
      reading: number;
      grammar: number;
      vocabulary: number;
      writing?: number;
      speaking?: number;
    };
    rewards: {
      xp: number;
      coins: number;
      badge?: string;
    };
  }>
> {
  const totalQuestions = data.answers.length;
  const correctAnswers = Math.floor(totalQuestions * 0.85);
  const score = 85;

  return simulateApiCall({
    testId: data.testId,
    score,
    totalPoints: 100,
    accuracy: 92,
    timeSpent: data.totalTime,
    passed: true,
    grade: 'A',
    correctAnswers,
    totalQuestions,
    skillBreakdown: {
      listening: 90,
      reading: 75,
      grammar: 85,
      vocabulary: 100,
      writing: 90,
      speaking: 70,
    },
    rewards: {
      xp: 50,
      coins: 25,
      badge: 'unit-master',
    },
  }, 1500); // Longer delay for test grading
}

/**
 * Get test results
 */
export async function getTestResults(testId: string): Promise<
  ApiResponse<typeof testResults>
> {
  return simulateApiCall(testResults);
}

/**
 * Get test review (detailed answers)
 */
export async function getTestReview(testId: string): Promise<
  ApiResponse<{
    testId: string;
    questions: Array<{
      id: string;
      number: number;
      question: string;
      type: string;
      category: string;
      userAnswer: string | null;
      correctAnswer: string;
      isCorrect: boolean;
      explanation: string;
      relatedConcepts: string[];
    }>;
    summary: {
      correctCount: number;
      incorrectCount: number;
      skippedCount: number;
      categoryStats: Record<string, { correct: number; total: number }>;
    };
  }>
> {
  return simulateApiCall({
    testId,
    questions: [
      {
        id: 'q-001',
        number: 1,
        question: 'The Comma butterfly has struggled to adapt to the warming climate.',
        type: 'true-false-not-given',
        category: 'reading',
        userAnswer: 'TRUE',
        correctAnswer: 'FALSE',
        isCorrect: false,
        explanation: 'According to the passage, generalist species like the Comma are thriving in the changing climate, not struggling.',
        relatedConcepts: ['Reading comprehension', 'Inference skills'],
      },
      {
        id: 'q-002',
        number: 2,
        question: 'Specialist butterflies are more vulnerable to habitat loss.',
        type: 'true-false-not-given',
        category: 'reading',
        userAnswer: 'TRUE',
        correctAnswer: 'TRUE',
        isCorrect: true,
        explanation: 'The passage clearly states that specialists such as the High Brown Fritillary are facing local extinctions due to habitat fragmentation.',
        relatedConcepts: ['Reading comprehension'],
      },
    ],
    summary: {
      correctCount: 42,
      incorrectCount: 6,
      skippedCount: 2,
      categoryStats: {
        grammar: { correct: 15, total: 20 },
        vocabulary: { correct: 18, total: 20 },
        reading: { correct: 9, total: 10 },
      },
    },
  });
}

/**
 * Save test progress (for later completion)
 */
export async function saveTestProgress(
  testId: string,
  answers: Array<{ questionId: string; answer: string }>,
  timeSpent: number
): Promise<ApiResponse<boolean>> {
  return simulateApiCall(true);
}

/**
 * Get saved test progress
 */
export async function getSavedTestProgress(testId: string): Promise<
  ApiResponse<{
    testId: string;
    answers: Array<{ questionId: string; answer: string }>;
    timeSpent: number;
    savedAt: string;
  } | null>
> {
  return simulateApiCall(null);
}

/**
 * Get test history
 */
export async function getTestHistory(userId?: string): Promise<
  ApiResponse<
    Array<{
      id: string;
      testId: string;
      testTitle: string;
      score: number;
      passed: boolean;
      completedAt: string;
      timeSpent: number;
    }>
  >
> {
  return simulateApiCall([
    {
      id: 'result-001',
      testId: 'test-001',
      testTitle: 'Unit 1 Final Test',
      score: 96,
      passed: true,
      completedAt: '2026-04-07T14:30:00Z',
      timeSpent: 2400,
    },
    {
      id: 'result-002',
      testId: 'test-002',
      testTitle: 'Unit 2 Post-test',
      score: 85,
      passed: true,
      completedAt: '2026-04-06T10:15:00Z',
      timeSpent: 3000,
    },
  ]);
}

/**
 * Retake test
 */
export async function retakeTest(testId: string): Promise<ApiResponse<boolean>> {
  return simulateApiCall(true);
}

/**
 * Flag question for review
 */
export async function flagQuestion(
  testId: string,
  questionId: string,
  reason?: string
): Promise<ApiResponse<boolean>> {
  return simulateApiCall(true);
}
