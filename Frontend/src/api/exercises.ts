// Exercises API

import { questionBank } from "@/data/mockData";
import { simulateApiCall } from "./client";
import type { ApiResponse, CompleteExerciseRequest } from "./types";
import { sleep } from "./utils/async";
import type { Question } from "@/data/mockData";

const AUDIO_ANALYSIS_DELAY_MS = 1500;
const MIN_PRONUNCIATION_SCORE = 70;
const PRONUNCIATION_SCORE_RANGE = 30;
const DEFAULT_CORRECT_ANSWER_RATE = 0.85;
const POINTS_PER_QUESTION = 10;
const XP_REWARD_RATE = 0.5;
const COIN_REWARD_RATE = 0.2;

/**
 * Get exercise by lesson ID
 */
export async function getExercise(lessonId: string): Promise<
  ApiResponse<{
    lessonId: string;
    type: "pronunciation" | "reading" | "quiz" | "listening";
    title: string;
    instructions: string;
    questions: Question[];
    timeLimit?: number; // seconds
  }>
> {
  return simulateApiCall({
    lessonId,
    type: "quiz",
    title: "Grammar Practice",
    instructions: "Choose the correct answer for each question.",
    questions: questionBank,
    timeLimit: 600, // 10 minutes
  });
}

/**
 * Get pronunciation exercise
 */
export async function getPronunciationExercise(lessonId: string): Promise<
  ApiResponse<{
    words: Array<{
      id: string;
      word: string;
      phonetic: string;
      audioUrl: string;
      difficulty: "easy" | "medium" | "hard";
    }>;
    sentences: Array<{
      id: string;
      text: string;
      audioUrl: string;
    }>;
  }>
> {
  return simulateApiCall({
    words: [
      {
        id: "word-001",
        word: "pronunciation",
        phonetic: "/prəˌnʌnsiˈeɪʃən/",
        audioUrl: "/audio/pronunciation.mp3",
        difficulty: "medium" as const,
      },
      {
        id: "word-002",
        word: "vocabulary",
        phonetic: "/vəˈkæbjʊləri/",
        audioUrl: "/audio/vocabulary.mp3",
        difficulty: "easy" as const,
      },
    ],
    sentences: [
      {
        id: "sent-001",
        text: "She practices pronunciation every day.",
        audioUrl: "/audio/sentence-001.mp3",
      },
    ],
  });
}

/**
 * Submit pronunciation recording
 */
export async function submitPronunciation(
  wordId: string,
  audioBlob: Blob,
): Promise<
  ApiResponse<{
    score: number; // 0-100
    feedback: string;
    correctPhonemes: string[];
    incorrectPhonemes: string[];
  }>
> {
  // Simulate audio analysis
  await sleep(AUDIO_ANALYSIS_DELAY_MS);

  return simulateApiCall({
    score:
      Math.floor(Math.random() * PRONUNCIATION_SCORE_RANGE) +
      MIN_PRONUNCIATION_SCORE, // 70-100
    feedback:
      "Good pronunciation! Pay attention to the stress on the second syllable.",
    correctPhonemes: ["prə", "eɪʃən"],
    incorrectPhonemes: ["nʌnsi"],
  });
}

/**
 * Get reading exercise
 */
export async function getReadingExercise(lessonId: string): Promise<
  ApiResponse<{
    passage: {
      title: string;
      content: string;
      wordCount: number;
      readingTime: number; // minutes
    };
    questions: Question[];
  }>
> {
  return simulateApiCall({
    passage: {
      title: "The Impact of Climate Change",
      content: `Over the past century, the British landscape has undergone significant transformations...`,
      wordCount: 1200,
      readingTime: 8,
    },
    questions: questionBank.filter((q) => q.category === "reading"),
  });
}

/**
 * Get listening exercise
 */
export async function getListeningExercise(lessonId: string): Promise<
  ApiResponse<{
    audio: {
      url: string;
      duration: number; // seconds
      transcript?: string;
    };
    tasks: Array<{
      id: string;
      type: "word-order" | "fill-blank" | "multiple-choice";
      instruction: string;
      data: any;
    }>;
  }>
> {
  return simulateApiCall({
    audio: {
      url: "/audio/listening-exercise.mp3",
      duration: 180,
      transcript: "Longevity is linked to diet and exercise...",
    },
    tasks: [
      {
        id: "task-001",
        type: "word-order" as const,
        instruction: "Arrange the words in the correct order",
        data: {
          words: ["is", "longevity", "linked", "to", "diet", "and", "exercise"],
          correctOrder: [
            "longevity",
            "is",
            "linked",
            "to",
            "diet",
            "and",
            "exercise",
          ],
        },
      },
    ],
  });
}

/**
 * Get quiz exercise
 */
export async function getQuizExercise(lessonId: string): Promise<
  ApiResponse<{
    questions: Question[];
    config: {
      shuffleQuestions: boolean;
      shuffleOptions: boolean;
      showCorrectAnswer: boolean;
      timeLimit?: number;
    };
  }>
> {
  return simulateApiCall({
    questions: questionBank,
    config: {
      shuffleQuestions: true,
      shuffleOptions: true,
      showCorrectAnswer: true,
      timeLimit: 600,
    },
  });
}

/**
 * Submit exercise answers
 */
export async function submitExercise(payload: CompleteExerciseRequest): Promise<
  ApiResponse<{
    score: number;
    totalPoints: number;
    accuracy: number;
    timeSpent: number;
    correctAnswers: number;
    totalQuestions: number;
    results: Array<{
      questionId: string;
      isCorrect: boolean;
      userAnswer: string;
      correctAnswer: string;
      points: number;
    }>;
    rewards: {
      xp: number;
      coins: number;
    };
  }>
> {
  // Calculate results
  const totalQuestions = payload.answers.length;
  const correctAnswers = Math.floor(
    totalQuestions * DEFAULT_CORRECT_ANSWER_RATE,
  ); // 85% correct
  const totalPoints = totalQuestions * POINTS_PER_QUESTION;
  const score = Math.round((correctAnswers / totalQuestions) * 100);

  const results = payload.answers.map((answer, index) => ({
    questionId: answer.questionId,
    isCorrect: index < correctAnswers,
    userAnswer: answer.answer,
    correctAnswer: "correct answer",
    points: index < correctAnswers ? POINTS_PER_QUESTION : 0,
  }));

  return simulateApiCall({
    score,
    totalPoints,
    accuracy: score,
    timeSpent: payload.totalTime,
    correctAnswers,
    totalQuestions,
    results,
    rewards: {
      xp: Math.round(score * XP_REWARD_RATE),
      coins: Math.round(score * COIN_REWARD_RATE),
    },
  });
}

/**
 * Get exercise hint
 */
export async function getExerciseHint(questionId: string): Promise<
  ApiResponse<{
    hint: string;
    cost: number; // coins
  }>
> {
  return simulateApiCall({
    hint: "Remember to use the correct tense based on the time expression.",
    cost: 5,
  });
}

/**
 * Skip exercise question
 */
export async function skipQuestion(
  exerciseId: string,
  questionId: string,
): Promise<ApiResponse<boolean>> {
  return simulateApiCall(true);
}
