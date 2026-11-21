package com.telusko.quizapp.service;

import com.telusko.quizapp.exception.GlobalExceptionHandler;
import com.telusko.quizapp.exception.ResourceNotFoundException;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import com.telusko.quizapp.Repository.QuestionRepository;
import com.telusko.quizapp.Model.QuestionEntity;

@Service
public class QuestionService {

    private final GlobalExceptionHandler globalExceptionHandler;
	@Autowired
    QuestionRepository questionRepository;

	QuestionService(GlobalExceptionHandler globalExceptionHandler) {
		this.globalExceptionHandler = globalExceptionHandler;
	}

    public List<QuestionEntity> getAllQuestions() {
        return questionRepository.findAll();
    }
    
    public List<QuestionEntity> getQuestionByCategory(String category){
		List<QuestionEntity> questionEntity =  questionRepository.findByCategory(category);
		
		if(questionEntity.isEmpty()) {
			throw new ResourceNotFoundException("This is not Found Sorry Bhai: "+category);
		}
		
		return questionEntity;
	}
    
    public String addQuestion(QuestionEntity questionEntity){
		questionRepository.save(questionEntity);
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
	public QuestionEntity GetById(@PathVariable Integer Id) {
		return questionRepository.findById(Id).orElseThrow(() -> new ResourceNotFoundException("Question not found Bhai: " + Id));
	}
    
    public String UpdateQuestionById(QuestionEntity questionEntity) {
		QuestionEntity qust = questionRepository.findById(questionEntity.getId()).orElseThrow(() -> new ResourceNotFoundException("Question not found to Update: "+ questionEntity));
		qust.setCategory(questionEntity.getCategory());
		qust.setDifficultylevel(questionEntity.getDifficultylevel());
		qust.setQuestiontitle(questionEntity.getQuestiontitle());
		qust.setOption1(questionEntity.getOption1());
		qust.setOption2(questionEntity.getOption2());
		qust.setOption3(questionEntity.getOption3());
		qust.setOption4(questionEntity.getOption4());
		qust.setRightAnswer(questionEntity.getRightAnswer());
		questionRepository.save(qust);
		return questionEntity+"- Question Updated";
	}
    
    
    
    
    
    
   
    
    
    
    
    
    
    
    
    
    
    
    
    
}