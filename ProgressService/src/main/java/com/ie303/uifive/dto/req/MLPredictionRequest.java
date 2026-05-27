package com.ie303.uifive.dto.req;

import com.fasterxml.jackson.annotation.JsonProperty;

public record MLPredictionRequest(
        @JsonProperty("role") String role,
        @JsonProperty("coin") int coin,
        @JsonProperty("score") int score,
        @JsonProperty("streak") int streak,
        @JsonProperty("days_since_last_study") int daysSinceLastStudy,
        @JsonProperty("vip_days_remaining") int vipDaysRemaining,
        @JsonProperty("is_vip_active") int isVipActive,
        @JsonProperty("grade_id") Long gradeId,
        @JsonProperty("unit_progress_percent") double unitProgressPercent,
        @JsonProperty("section_progress_percent") double sectionProgressPercent,
        @JsonProperty("active_days_7d") int activeDays7d,
        @JsonProperty("active_days_14d") int activeDays14d,
        @JsonProperty("active_days_30d") int activeDays30d,
        @JsonProperty("lessons_completed_7d") int lessonsCompleted7d,
        @JsonProperty("lessons_completed_14d") int lessonsCompleted14d,
        @JsonProperty("lessons_completed_30d") int lessonsCompleted30d,
        @JsonProperty("questions_answered_7d") int questionsAnswered7d,
        @JsonProperty("questions_answered_14d") int questionsAnswered14d,
        @JsonProperty("questions_answered_30d") int questionsAnswered30d,
        @JsonProperty("accuracy_7d") double accuracy7d,
        @JsonProperty("accuracy_14d") double accuracy14d,
        @JsonProperty("accuracy_30d") double accuracy30d,
        @JsonProperty("avg_attempt_count_7d") double avgAttemptCount7d,
        @JsonProperty("coins_earned_7d") int coinsEarned7d,
        @JsonProperty("coins_earned_30d") int coinsEarned30d,
        @JsonProperty("writing_eval_count_30d") int writingEvalCount30d,
        @JsonProperty("speaking_eval_count_30d") int speakingEvalCount30d,
        @JsonProperty("avg_writing_ai_score_30d") double avgWritingAiScore30d,
        @JsonProperty("avg_speaking_ai_score_30d") double avgSpeakingAiScore30d,
        @JsonProperty("skip_item_quantity") int skipItemQuantity,
        @JsonProperty("listening_accuracy_30d") double listeningAccuracy30d,
        @JsonProperty("speaking_accuracy_30d") double speakingAccuracy30d,
        @JsonProperty("reading_accuracy_30d") double readingAccuracy30d,
        @JsonProperty("writing_accuracy_30d") double writingAccuracy30d,
        @JsonProperty("vocabulary_accuracy_30d") double vocabularyAccuracy30d,
        @JsonProperty("grammar_accuracy_30d") double grammarAccuracy30d
) {
}
