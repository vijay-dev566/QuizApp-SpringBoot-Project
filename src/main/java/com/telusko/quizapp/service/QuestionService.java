package com.telusko.quizapp.service;

import com.telusko.quizapp.exception.GlobalExceptionHandler;
import com.telusko.quizapp.exception.ResourceNotFoundException;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.PathVariable;

import com.telusko.quizapp.Repository.QuestionRepository;
import com.telusko.quizapp.Model.Question;

@Service
public class QuestionService {

    private final GlobalExceptionHandler globalExceptionHandler;
	@Autowired
    QuestionRepository questionRepository;

	QuestionService(GlobalExceptionHandler globalExceptionHandler) {
		this.globalExceptionHandler = globalExceptionHandler;
	}

    public List<Question> getAllQuestions() {
        return questionRepository.findAll();
    }
    
    public List<Question> getQuestionByCategory(String category){
		List<Question> question =  questionRepository.findByCategory(category);
		
		if(question.isEmpty()) {
			throw new ResourceNotFoundException("This is not Found Sorry Bhai: "+category);
		}
		
		return question;
	}
}