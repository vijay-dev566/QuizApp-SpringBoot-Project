package com.telusko.quizapp;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.telusko.quizapp.Model.QuestionEntity;
import com.telusko.quizapp.Model.QuestionWrapperEntity;
import com.telusko.quizapp.Model.QuizEntity;
import com.telusko.quizapp.Model.ResponseClass;
import com.telusko.quizapp.service.QuizService;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/quiz")
public class QuizController {

	@Autowired
	QuizService quizService;

	// Create Quiz
	@PostMapping("/create")
	public String createQuiz(@RequestParam String category, @RequestParam int numQ, @RequestParam String title){
		return quizService.createQuiz(category, numQ, title);
	}
	
	// Get All Quizzes
	@GetMapping("/all")
	public List<QuizEntity> getAllQuizzes(){
		return quizService.getAllQuizzes();
	}

	//Get Quiz Questions
	@GetMapping("get/{Id}")
	public List<QuestionWrapperEntity> getQuizQuestions(@PathVariable Integer Id){
		return quizService.getQuizQuestions(Id);
	}

	//Quiz Result sending
	@PostMapping("submit/{id}")
	public Integer result(@PathVariable Integer id, @RequestBody List<ResponseClass> responses) {
		return quizService.result(id, responses);
	}
}
