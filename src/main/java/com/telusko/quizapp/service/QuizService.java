package com.telusko.quizapp.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.telusko.quizapp.Model.QuestionEntity;
import com.telusko.quizapp.Model.QuestionWrapperEntity;
import com.telusko.quizapp.Model.QuizEntity;
import com.telusko.quizapp.Repository.QuestionRepository;
import com.telusko.quizapp.Repository.QuizRepository;

@Service
public class QuizService {

	@Autowired
	QuizRepository quizRepository;
	@Autowired
	QuestionRepository questionRepository;

	//Create quiz
	public String createQuiz(String category, int numQ, String title) {
		List<QuestionEntity> questions = questionRepository.findRandomQuestionsByCategory(category, numQ);
		QuizEntity quiz = new QuizEntity();
		quiz.setTitle(title);
		quiz.setQuestions(questions);
		quizRepository.save(quiz);
		return "success";
	}

	public List<QuestionWrapperEntity> getQuizQuestions(Integer Id) {
	  Optional<QuizEntity> quiz = quizRepository.findById(Id);
	  List<QuestionEntity> questionsFromDb = quiz.get().getQuestions();
	  List<QuestionWrapperEntity> questionsForUser = new ArrayList<>();
	  for(QuestionEntity q : questionsFromDb) {
		  QuestionWrapperEntity qw = new QuestionWrapperEntity(q.getId(), q.getQuestiontitle(), q.getOption1(), q.getOption2(), q.getOption3(), q.getOption4()); 
			  questionsForUser.add(qw);  
	  }
	  return questionsForUser;
	}
}
