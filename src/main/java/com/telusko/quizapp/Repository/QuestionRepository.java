package com.telusko.quizapp.Repository;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import com.telusko.quizapp.Model.QuestionEntity;

public interface QuestionRepository extends JpaRepository<QuestionEntity, Integer>{

	List<QuestionEntity> findByCategory(String category);
	
	@Query(value = "SELECT * From question where question.category =:category ORDER BY RAND() LIMIT :numQ", nativeQuery = true)
						
	List<QuestionEntity> findRandomQuestionsByCategory(
			@Param("category") String category,
			@Param("numQ") int numQ
			);
}
