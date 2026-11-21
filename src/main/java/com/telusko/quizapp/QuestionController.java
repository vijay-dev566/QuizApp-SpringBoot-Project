package com.telusko.quizapp;
import com.telusko.quizapp.Model.QuestionEntity;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.List;
import com.telusko.quizapp.service.QuestionService;

@RestController
@RequestMapping("/question")
public class QuestionController {
	
	@Autowired
	QuestionService questionService;
	//Get All Questions
	@GetMapping("/allquestions")
	public List<QuestionEntity> getAllQuestions() {
		return questionService.getAllQuestions();
	}
	
	//Get Questions By Category
	@GetMapping("category/{category}")
	public List<QuestionEntity> getQuestionByCategory(@PathVariable String category){
		return questionService.getQuestionByCategory(category);
	}
	
	//Add Question
	@PostMapping("/add")
	public String addQuestion(QuestionEntity questionEntity){
		questionService.addQuestion(questionEntity);
		return "Question added";
	}
	
	//Delete question by Id
	@DeleteMapping("delete/{Id}")
	public void deleteQuestionById(@PathVariable Integer Id) {
		questionService.deleteQuestionById(Id);
	}
	
	//fetch Question By Id
	@GetMapping("fetch/{Id}")
	public QuestionEntity GetById(@PathVariable Integer Id) {
		return questionService.GetById(Id);
	}
	
	//Update Question
	@PutMapping("update/{question}")
	public String UpdateQuestionById(QuestionEntity questionEntity) {
		return questionService.UpdateQuestionById(questionEntity);
	}

}
