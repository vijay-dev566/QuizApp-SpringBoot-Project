package com.telusko.quizapp.Repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.telusko.quizapp.Model.QuizEntity;

public interface QuizRepository extends
			JpaRepository<QuizEntity, Integer>{

}
