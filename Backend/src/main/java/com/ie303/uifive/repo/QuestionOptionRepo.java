package com.ie303.uifive.repo;

import com.ie303.uifive.entity.QuestionOption;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface QuestionOptionRepo extends JpaRepository<QuestionOption, Long> {
}