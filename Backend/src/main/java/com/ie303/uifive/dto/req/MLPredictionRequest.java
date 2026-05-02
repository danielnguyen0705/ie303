package com.ie303.uifive.dto.req;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class MLPredictionRequest {
    private String role;
    private int coin;
    private int score;
    private int streak;
    private int days_since_last_study;
    private int vip_days_remaining;
    private int is_vip_active;
    private Long grade_id;
    private double unit_progress_percent;
    private double section_progress_percent;
    private int active_days_7d;
    private int active_days_14d;
    private int active_days_30d;
    private int lessons_completed_7d;
    private int lessons_completed_14d;
    private int lessons_completed_30d;
    private int questions_answered_7d;
    private int questions_answered_14d;
    private int questions_answered_30d;
    private double accuracy_7d;
    private double accuracy_14d;
    private double accuracy_30d;
    private double avg_attempt_count_7d;
    private int coins_earned_7d;
    private int coins_earned_30d;
    private int writing_eval_count_30d;
    private int speaking_eval_count_30d;
    private double avg_writing_ai_score_30d;
    private double avg_speaking_ai_score_30d;
    private int skip_item_quantity;
    private double listening_accuracy_30d;
    private double speaking_accuracy_30d;
    private double reading_accuracy_30d;
    private double writing_accuracy_30d;
    private double vocabulary_accuracy_30d;
    private double grammar_accuracy_30d;
}
