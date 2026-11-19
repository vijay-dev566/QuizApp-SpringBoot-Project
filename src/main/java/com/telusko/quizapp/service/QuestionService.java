package com.telusko.quizapp.service;

import com.telusko.quizapp.exception.GlobalExceptionHandler;
import com.telusko.quizapp.exception.ResourceNotFoundException;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.GetMapping;
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
    
    public String addQuestion(Question question){
		questionRepository.save(question);
		return "Question added";
	}
    
    public String deleteQuestionById(@PathVariable Integer Id) {
    	
    	if (!questionRepository.existsById(Id)) {
    		throw new ResourceNotFoundException("This is not Found Sorry Bhai: "+Id);
    	}
		questionRepository.deleteById(Id);
		return "Question Deleted";
	}

    @GetMapping("fetch/{Id}")
	public Question GetById(@PathVariable Integer Id) {
		return questionRepository.findById(Id).orElseThrow(() -> new ResourceNotFoundException("Question not found Bhai: " + Id));
		
	}
}