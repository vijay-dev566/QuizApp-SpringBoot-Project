package com.telusko.quizapp.Repository;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import com.telusko.quizapp.Model.Question;

public interface QuestionRepository extends JpaRepository<Question, Integer>{

	List<Question> findByCategory(String category);
	
}
