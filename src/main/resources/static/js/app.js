/**
 * QuizApp - Clean, Modular Frontend Controller
 */

// Configuration & State
const CONFIG = {
  API_BASE: window.location.origin.includes('http') && !window.location.origin.includes('file:')
    ? window.location.origin
    : 'http://localhost:8080'
};

const state = {
  backendConnected: false,
  questions: [],
  quizzes: [],
  categories: new Set(['All']),
  activeTab: 'take-quiz',
  
  // Quiz Player State
  currentQuiz: null,
  currentQuestionIndex: 0,
  userResponses: {}, // { questionId: selectedAnswer }
  quizSubmitted: false,
  finalScore: null,

  // Question Bank View State
  selectedCategoryFilter: 'All',
  searchQuery: ''
};

// Realistic mock data for offline / demo mode
const DEMO_QUESTIONS = [
  {
    id: 101,
    questiontitle: "Which of the following is not a Java primitive data type?",
    option1: "int",
    option2: "boolean",
    option3: "String",
    option4: "double",
    rightAnswer: "String",
    difficultylevel: "Easy",
    category: "Java"
  },
  {
    id: 102,
    questiontitle: "What is the default port for Spring Boot embedded Tomcat?",
    option1: "8000",
    option2: "8080",
    option3: "3000",
    option4: "9090",
    rightAnswer: "8080",
    difficultylevel: "Easy",
    category: "Java"
  },
  {
    id: 103,
    questiontitle: "Which annotation in Spring Boot is used to mark a class as a REST Controller?",
    option1: "@Controller",
    option2: "@Service",
    option3: "@RestController",
    option4: "@Component",
    rightAnswer: "@RestController",
    difficultylevel: "Medium",
    category: "Java"
  },
  {
    id: 104,
    questiontitle: "Which HTTP method is typically used to create a new resource in a REST API?",
    option1: "GET",
    option2: "PUT",
    option3: "POST",
    option4: "DELETE",
    rightAnswer: "POST",
    difficultylevel: "Easy",
    category: "Web"
  },
  {
    id: 105,
    questiontitle: "In Python, which keyword is used to create a function?",
    option1: "function",
    option2: "def",
    option3: "fun",
    option4: "define",
    rightAnswer: "def",
    difficultylevel: "Easy",
    category: "Python"
  },
  {
    id: 106,
    questiontitle: "What does JVM stand for?",
    option1: "Java Virtual Machine",
    option2: "Java Variable Memory",
    option3: "Java Verified Module",
    option4: "Java Visual Monitor",
    rightAnswer: "Java Virtual Machine",
    difficultylevel: "Easy",
    category: "Java"
  }
];

const DEMO_QUIZZES = [
  {
    id: 1,
    title: "Java Fundamentals Challenge",
    questions: DEMO_QUESTIONS.filter(q => q.category === 'Java')
  },
  {
    id: 2,
    title: "Web & Tech Quick Quiz",
    questions: DEMO_QUESTIONS.slice(0, 4)
  }
];

// ==========================================================================
// Initialization
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  checkBackendStatus();
});

function setupEventListeners() {
  // Navigation Tabs
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.getAttribute('data-tab');
      switchTab(tabId);
    });
  });

  // Backend Status Banner / Pill Retry
  const retryBtn = document.getElementById('retryConnectionBtn');
  if (retryBtn) retryBtn.addEventListener('click', checkBackendStatus);

  const statusPill = document.getElementById('backendStatusPill');
  if (statusPill) statusPill.addEventListener('click', checkBackendStatus);

  // Take Quiz Form
  const loadQuizBtn = document.getElementById('btnLoadQuizById');
  if (loadQuizBtn) {
    loadQuizBtn.addEventListener('click', () => {
      const input = document.getElementById('quizIdInput');
      const id = parseInt(input.value.trim());
      if (id) {
        startQuizById(id);
      } else {
        showToast('Please enter a valid Quiz ID', 'error');
      }
    });
  }

  // Quiz Navigation Buttons
  document.getElementById('prevQuestionBtn')?.addEventListener('click', prevQuestion);
  document.getElementById('nextQuestionBtn')?.addEventListener('click', nextQuestion);
  document.getElementById('submitQuizBtn')?.addEventListener('click', submitQuiz);

  // Retake / Reset
  document.getElementById('retakeQuizBtn')?.addEventListener('click', () => {
    if (state.currentQuiz) {
      startQuizSession(state.currentQuiz);
    }
  });

  document.getElementById('exitQuizBtn')?.addEventListener('click', () => {
    state.currentQuiz = null;
    showQuizStarterView();
  });

  // Create Quiz Form
  const createQuizForm = document.getElementById('createQuizForm');
  if (createQuizForm) {
    createQuizForm.addEventListener('submit', handleCreateQuizSubmit);
  }

  // Add Question Form & Modal
  const openAddModalBtn = document.getElementById('openAddQuestionModal');
  const modal = document.getElementById('addQuestionModal');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const cancelModalBtn = document.getElementById('cancelModalBtn');

  if (openAddModalBtn && modal) {
    openAddModalBtn.addEventListener('click', () => modal.classList.add('open'));
  }

  const closeModal = () => modal?.classList.remove('open');
  if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
  if (cancelModalBtn) cancelModalBtn.addEventListener('click', closeModal);

  const addQuestionForm = document.getElementById('addQuestionForm');
  if (addQuestionForm) {
    addQuestionForm.addEventListener('submit', handleAddQuestionSubmit);
  }

  // Search & Filter
  const searchInput = document.getElementById('questionSearchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      state.searchQuery = e.target.value.toLowerCase();
      renderQuestionsList();
    });
  }
}

// ==========================================================================
// Tab Switching
// ==========================================================================
function switchTab(tabId) {
  state.activeTab = tabId;

  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
  });

  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.toggle('active', content.id === tabId);
  });

  if (tabId === 'take-quiz') {
    renderAvailableQuizzesQuickSelect();
  } else if (tabId === 'manage-questions') {
    renderQuestionsList();
    renderCategoryFilters();
  } else if (tabId === 'quizzes-list') {
    renderQuizzesTab();
  } else if (tabId === 'create-quiz') {
    updateCreateQuizCategoryOptions();
  }
}

// ==========================================================================
// Backend Connectivity & Synchronization
// ==========================================================================
async function checkBackendStatus() {
  const pill = document.getElementById('backendStatusPill');
  const pillText = document.getElementById('statusText');
  const banner = document.getElementById('demoModeBanner');

  if (pillText) pillText.textContent = 'Checking...';

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    const response = await fetch(`${CONFIG.API_BASE}/question/allquestions`, {
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      state.backendConnected = true;
      if (pill) {
        pill.className = 'status-pill online';
        pill.title = `Connected to ${CONFIG.API_BASE} (Click to refresh)`;
      }
      if (pillText) pillText.textContent = 'Backend Online';
      if (banner) banner.classList.add('hidden');
      
      showToast('Connected to Spring Boot backend!', 'success');
      await syncDataFromBackend();
      return;
    }
  } catch (err) {
    // Backend offline / not reachable
  }

  // Fallback to Demo Mode
  state.backendConnected = false;
  if (pill) {
    pill.className = 'status-pill demo';
    pill.title = 'Spring Boot backend is offline. Running in Demo Mode. (Click to retry)';
  }
  if (pillText) pillText.textContent = 'Demo Mode (Offline)';
  if (banner) banner.classList.remove('hidden');

  loadDemoData();
}

async function syncDataFromBackend() {
  try {
    // 1. Fetch questions
    const qRes = await fetch(`${CONFIG.API_BASE}/question/allquestions`);
    if (qRes.ok) {
      const qData = await qRes.json();
      state.questions = Array.isArray(qData) && qData.length > 0 ? qData : DEMO_QUESTIONS;
    }

    // 2. Fetch Quizzes
    try {
      const quizRes = await fetch(`${CONFIG.API_BASE}/quiz/all`);
      if (quizRes.ok) {
        const quizData = await quizRes.json();
        state.quizzes = Array.isArray(quizData) ? quizData : [];
      }
    } catch {
      // Endpoint might not exist yet or empty
    }

    updateCategories();
    renderAllViews();
  } catch (err) {
    console.error('Failed to sync data:', err);
    loadDemoData();
  }
}

function loadDemoData() {
  state.questions = [...DEMO_QUESTIONS];
  state.quizzes = [...DEMO_QUIZZES];
  updateCategories();
  renderAllViews();
}

function updateCategories() {
  const cats = new Set(['All']);
  state.questions.forEach(q => {
    if (q.category) cats.add(q.category);
  });
  state.categories = cats;
}

function renderAllViews() {
  updateCounts();
  renderQuestionsList();
  renderCategoryFilters();
  renderAvailableQuizzesQuickSelect();
  renderQuizzesTab();
  updateCreateQuizCategoryOptions();
}

function updateCounts() {
  const qCountBadge = document.getElementById('questionsCountBadge');
  if (qCountBadge) qCountBadge.textContent = state.questions.length;

  const quizCountBadge = document.getElementById('quizzesCountBadge');
  if (quizCountBadge) quizCountBadge.textContent = state.quizzes.length;
}

// ==========================================================================
// Quiz Flow (Take / Play Quiz)
// ==========================================================================
async function startQuizById(quizId) {
  if (state.backendConnected) {
    try {
      showToast('Fetching quiz from server...', 'info');
      const res = await fetch(`${CONFIG.API_BASE}/quiz/get/${quizId}`);
      if (!res.ok) throw new Error('Quiz not found');
      const questions = await res.json();
      
      if (!questions || questions.length === 0) {
        showToast('This quiz has no questions available.', 'error');
        return;
      }

      // Find title if available from quizzes list
      const matched = state.quizzes.find(q => q.id === quizId);
      const title = matched ? matched.title : `Quiz #${quizId}`;

      startQuizSession({ id: quizId, title, questions });
      return;
    } catch (err) {
      showToast(`Could not load Quiz #${quizId} from backend.`, 'error');
    }
  }

  // Demo fallback
  const demoQuiz = state.quizzes.find(q => q.id === quizId) || {
    id: quizId,
    title: `Quiz #${quizId}`,
    questions: state.questions.slice(0, 5)
  };
  startQuizSession(demoQuiz);
}

function startQuizSession(quiz) {
  state.currentQuiz = quiz;
  state.currentQuestionIndex = 0;
  state.userResponses = {};
  state.quizSubmitted = false;
  state.finalScore = null;

  // Show play container, hide starter and results
  document.getElementById('quizStarterContainer').style.display = 'none';
  document.getElementById('quizResultContainer').style.display = 'none';
  document.getElementById('quizPlayContainer').style.display = 'block';

  document.getElementById('currentQuizTitle').textContent = quiz.title || `Quiz #${quiz.id}`;
  
  renderQuestion(0);
}

function showQuizStarterView() {
  document.getElementById('quizStarterContainer').style.display = 'block';
  document.getElementById('quizResultContainer').style.display = 'none';
  document.getElementById('quizPlayContainer').style.display = 'none';
  renderAvailableQuizzesQuickSelect();
}

function renderQuestion(index) {
  const quiz = state.currentQuiz;
  if (!quiz || !quiz.questions || quiz.questions.length === 0) return;

  state.currentQuestionIndex = index;
  const q = quiz.questions[index];
  const total = quiz.questions.length;

  // Header progress
  document.getElementById('questionCounter').textContent = `Question ${index + 1} of ${total}`;
  const pct = Math.round(((index + 1) / total) * 100);
  document.getElementById('quizProgressBar').style.width = `${pct}%`;

  // Question content
  const categoryTag = document.getElementById('playCategoryTag');
  if (categoryTag) {
    categoryTag.textContent = q.category || 'General';
  }
  document.getElementById('playQuestionText').textContent = q.questiontitle || 'Untitled Question';

  // Options
  const optionsList = document.getElementById('playOptionsList');
  optionsList.innerHTML = '';

  const options = [
    { key: 'A', text: q.option1 },
    { key: 'B', text: q.option2 },
    { key: 'C', text: q.option3 },
    { key: 'D', text: q.option4 }
  ];

  const selectedAnswer = state.userResponses[q.id];

  options.forEach(opt => {
    if (!opt.text) return;

    const optEl = document.createElement('div');
    optEl.className = `option-item ${selectedAnswer === opt.text ? 'selected' : ''}`;
    optEl.innerHTML = `
      <div class="option-marker">${opt.key}</div>
      <div class="option-label">${escapeHtml(opt.text)}</div>
    `;

    optEl.addEventListener('click', () => {
      state.userResponses[q.id] = opt.text;
      renderQuestion(index); // re-render to update selected style & dots
    });

    optionsList.appendChild(optEl);
  });

  // Navigation dots
  renderQuestionDots();

  // Buttons visibility
  const prevBtn = document.getElementById('prevQuestionBtn');
  const nextBtn = document.getElementById('nextQuestionBtn');
  const submitBtn = document.getElementById('submitQuizBtn');

  prevBtn.disabled = index === 0;

  if (index === total - 1) {
    nextBtn.style.display = 'none';
    submitBtn.style.display = 'inline-flex';
  } else {
    nextBtn.style.display = 'inline-flex';
    submitBtn.style.display = 'none';
  }
}

function renderQuestionDots() {
  const dotsContainer = document.getElementById('questionDotsContainer');
  if (!dotsContainer || !state.currentQuiz) return;

  dotsContainer.innerHTML = '';
  state.currentQuiz.questions.forEach((q, idx) => {
    const dot = document.createElement('div');
    const isAnswered = state.userResponses[q.id] !== undefined;
    const isCurrent = idx === state.currentQuestionIndex;

    let cls = 'nav-dot';
    if (isCurrent) cls += ' current';
    else if (isAnswered) cls += ' answered';

    dot.className = cls;
    dot.textContent = idx + 1;
    dot.title = `Question ${idx + 1} (${isAnswered ? 'Answered' : 'Unanswered'})`;

    dot.addEventListener('click', () => {
      renderQuestion(idx);
    });

    dotsContainer.appendChild(dot);
  });
}

function prevQuestion() {
  if (state.currentQuestionIndex > 0) {
    renderQuestion(state.currentQuestionIndex - 1);
  }
}

function nextQuestion() {
  if (state.currentQuiz && state.currentQuestionIndex < state.currentQuiz.questions.length - 1) {
    renderQuestion(state.currentQuestionIndex + 1);
  }
}

async function submitQuiz() {
  const quiz = state.currentQuiz;
  if (!quiz) return;

  const total = quiz.questions.length;
  const answeredCount = Object.keys(state.userResponses).length;

  if (answeredCount < total) {
    const proceed = confirm(`You have answered ${answeredCount} of ${total} questions. Are you sure you want to submit?`);
    if (!proceed) return;
  }

  // Format responses array: List<ResponseClass>
  const payload = quiz.questions.map(q => ({
    id: q.id,
    response: state.userResponses[q.id] || ''
  }));

  let score = 0;

  if (state.backendConnected) {
    try {
      showToast('Grading quiz on server...', 'info');
      const res = await fetch(`${CONFIG.API_BASE}/quiz/submit/${quiz.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        score = await res.json();
      } else {
        throw new Error('Backend submit failed');
      }
    } catch (err) {
      console.warn('Backend evaluation error, evaluating locally:', err);
      score = calculateLocalScore(quiz, payload);
    }
  } else {
    score = calculateLocalScore(quiz, payload);
  }

  showResultCard(score, total);
}

function calculateLocalScore(quiz, payload) {
  let score = 0;
  payload.forEach(item => {
    // Check in all questions pool for matching rightAnswer
    const fullQuestion = state.questions.find(q => q.id === item.id);
    if (fullQuestion && fullQuestion.rightAnswer && fullQuestion.rightAnswer === item.response) {
      score++;
    }
  });
  return score;
}

function showResultCard(score, total) {
  state.quizSubmitted = true;
  state.finalScore = score;

  document.getElementById('quizPlayContainer').style.display = 'none';
  const resultContainer = document.getElementById('quizResultContainer');
  resultContainer.style.display = 'block';

  const percentage = Math.round((score / total) * 100);
  document.getElementById('finalScoreNum').textContent = `${score}`;
  document.getElementById('finalTotalNum').textContent = `out of ${total} (${percentage}%)`;

  const titleEl = document.getElementById('resultVerdictTitle');
  const descEl = document.getElementById('resultVerdictDesc');

  if (percentage >= 80) {
    titleEl.textContent = '🎉 Outstanding Performance!';
    descEl.textContent = 'You demonstrated stellar mastery of these concepts.';
  } else if (percentage >= 50) {
    titleEl.textContent = '👏 Well Done!';
    descEl.textContent = 'Solid understanding. A quick review will make you an expert.';
  } else {
    titleEl.textContent = 'Keep Learning & Practicing!';
    descEl.textContent = 'Do not worry, every attempt helps you master the concepts.';
  }
}

// ==========================================================================
// Quick Select Quizzes
// ==========================================================================
function renderAvailableQuizzesQuickSelect() {
  const container = document.getElementById('quickQuizCards');
  if (!container) return;

  if (state.quizzes.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 2rem; color: var(--text-muted); background: white; border-radius: var(--radius-md); border: 1px dashed var(--border);">
        <p style="margin-bottom: 0.5rem; font-weight: 600;">No quizzes created yet.</p>
        <p style="font-size: 0.85rem; margin-bottom: 1rem;">Use the "Create Quiz" tab to generate one from the question bank!</p>
        <button class="btn btn-primary btn-sm" onclick="switchTab('create-quiz')">Create First Quiz</button>
      </div>
    `;
    return;
  }

  container.innerHTML = state.quizzes.map(quiz => {
    const qCount = quiz.questions ? quiz.questions.length : 'Multiple';
    return `
      <div class="quiz-card-item" onclick="startQuizById(${quiz.id})">
        <div>
          <div class="quiz-card-header">
            <h4 class="quiz-card-title">${escapeHtml(quiz.title || `Quiz #${quiz.id}`)}</h4>
            <span class="badge badge-indigo">ID: ${quiz.id}</span>
          </div>
          <div class="quiz-card-meta">
            <span>📝 ${qCount} Questions</span>
          </div>
        </div>
        <button class="btn btn-primary btn-sm" style="width: 100%;">
          Start Quiz &rarr;
        </button>
      </div>
    `;
  }).join('');
}

// ==========================================================================
// Create Quiz Form
// ==========================================================================
function updateCreateQuizCategoryOptions() {
  const select = document.getElementById('createQuizCategory');
  if (!select) return;

  const cats = Array.from(state.categories).filter(c => c !== 'All');
  if (cats.length === 0) cats.push('Java', 'Python', 'Web');

  select.innerHTML = cats.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');
}

async function handleCreateQuizSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const title = form.quizTitle.value.trim();
  const category = form.quizCategory.value.trim();
  const numQ = parseInt(form.quizNumQ.value, 10);

  if (!title || !category || !numQ) {
    showToast('Please fill in all quiz details.', 'error');
    return;
  }

  const submitBtn = form.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Generating Quiz...';

  try {
    if (state.backendConnected) {
      // POST /quiz/create?category=...&numQ=...&title=...
      const url = `${CONFIG.API_BASE}/quiz/create?category=${encodeURIComponent(category)}&numQ=${numQ}&title=${encodeURIComponent(title)}`;
      const res = await fetch(url, { method: 'POST' });

      if (res.ok) {
        const text = await res.text();
        const createdId = parseInt(text) || (state.quizzes.length + 1);

        showToast(`Quiz created successfully! (ID: ${createdId})`, 'success');
        
        // Refresh quizzes
        await syncDataFromBackend();
        form.reset();
        
        // Offer to take it immediately
        if (confirm(`Quiz "${title}" created successfully (ID: ${createdId})!\n\nWould you like to start it now?`)) {
          switchTab('take-quiz');
          startQuizById(createdId);
        } else {
          switchTab('quizzes-list');
        }
        return;
      } else {
        throw new Error('Failed to create quiz on backend');
      }
    } else {
      // Demo Mode creation
      const matchingQuestions = state.questions.filter(q => q.category === category);
      const selected = matchingQuestions.length > 0
        ? matchingQuestions.slice(0, numQ)
        : state.questions.slice(0, numQ);

      const newId = state.quizzes.length + 1;
      const newQuiz = {
        id: newId,
        title,
        questions: selected
      };

      state.quizzes.push(newQuiz);
      showToast(`Quiz created in Demo Mode (ID: ${newId})!`, 'success');
      form.reset();
      renderAllViews();

      if (confirm(`Quiz "${title}" created (ID: ${newId})!\n\nWould you like to take it now?`)) {
        switchTab('take-quiz');
        startQuizSession(newQuiz);
      } else {
        switchTab('quizzes-list');
      }
    }
  } catch (err) {
    showToast('Error generating quiz. Please verify category has questions.', 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Generate Quiz';
  }
}

// ==========================================================================
// Question Bank: List, Filter, Add & Delete
// ==========================================================================
function renderCategoryFilters() {
  const container = document.getElementById('categoryFilters');
  if (!container) return;

  container.innerHTML = Array.from(state.categories).map(cat => `
    <button class="filter-chip ${state.selectedCategoryFilter === cat ? 'active' : ''}" 
            onclick="selectCategoryFilter('${escapeHtml(cat)}')">
      ${escapeHtml(cat)}
    </button>
  `).join('');
}

function selectCategoryFilter(cat) {
  state.selectedCategoryFilter = cat;
  renderCategoryFilters();
  renderQuestionsList();
}

function renderQuestionsList() {
  const container = document.getElementById('questionsListContainer');
  if (!container) return;

  let filtered = state.questions;

  // Filter by category
  if (state.selectedCategoryFilter !== 'All') {
    filtered = filtered.filter(q => q.category === state.selectedCategoryFilter);
  }

  // Filter by search query
  if (state.searchQuery) {
    filtered = filtered.filter(q =>
      (q.questiontitle && q.questiontitle.toLowerCase().includes(state.searchQuery)) ||
      (q.category && q.category.toLowerCase().includes(state.searchQuery))
    );
  }

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3>No questions found</h3>
        <p>Try clearing your filter or add a brand new question.</p>
        <button class="btn btn-primary btn-sm" onclick="document.getElementById('openAddQuestionModal').click()">+ Add Question</button>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(q => {
    const diffBadge = getDifficultyBadge(q.difficultylevel);
    return `
      <div class="question-row-card">
        <div class="row-top">
          <div class="row-title">
            <span style="color: var(--text-muted); font-weight: 500; margin-right: 0.35rem;">#${q.id}</span>
            ${escapeHtml(q.questiontitle)}
          </div>
          <div class="row-badges">
            <span class="badge badge-indigo">${escapeHtml(q.category || 'General')}</span>
            ${diffBadge}
          </div>
        </div>

        <div class="options-preview-grid">
          <div class="option-pill ${q.option1 === q.rightAnswer ? 'correct' : ''}">
            A: ${escapeHtml(q.option1 || '')}
          </div>
          <div class="option-pill ${q.option2 === q.rightAnswer ? 'correct' : ''}">
            B: ${escapeHtml(q.option2 || '')}
          </div>
          <div class="option-pill ${q.option3 === q.rightAnswer ? 'correct' : ''}">
            C: ${escapeHtml(q.option3 || '')}
          </div>
          <div class="option-pill ${q.option4 === q.rightAnswer ? 'correct' : ''}">
            D: ${escapeHtml(q.option4 || '')}
          </div>
        </div>

        <div class="row-actions">
          <button class="btn btn-danger btn-sm" onclick="handleDeleteQuestion(${q.id})">
            Delete
          </button>
        </div>
      </div>
    `;
  }).join('');
}

function getDifficultyBadge(level) {
  const lvl = (level || '').toLowerCase();
  if (lvl === 'easy') return '<span class="badge badge-emerald">Easy</span>';
  if (lvl === 'hard') return '<span class="badge badge-rose">Hard</span>';
  return '<span class="badge badge-amber">Medium</span>';
}

async function handleAddQuestionSubmit(e) {
  e.preventDefault();
  const form = e.target;

  const newQuestion = {
    questiontitle: form.title.value.trim(),
    option1: form.opt1.value.trim(),
    option2: form.opt2.value.trim(),
    option3: form.opt3.value.trim(),
    option4: form.opt4.value.trim(),
    rightAnswer: form.correctOpt.value.trim(),
    category: form.category.value.trim(),
    difficultylevel: form.difficulty.value
  };

  const modal = document.getElementById('addQuestionModal');

  if (state.backendConnected) {
    try {
      const res = await fetch(`${CONFIG.API_BASE}/question/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newQuestion)
      });

      if (res.ok) {
        showToast('Question added to database!', 'success');
        modal.classList.remove('open');
        form.reset();
        await syncDataFromBackend();
        return;
      }
    } catch (err) {
      console.warn('Backend save failed, saving locally:', err);
    }
  }

  // Fallback demo addition
  newQuestion.id = Date.now();
  state.questions.unshift(newQuestion);
  updateCategories();
  renderAllViews();
  showToast('Question saved!', 'success');
  modal.classList.remove('open');
  form.reset();
}

async function handleDeleteQuestion(id) {
  if (!confirm(`Are you sure you want to delete question #${id}?`)) return;

  if (state.backendConnected) {
    try {
      const res = await fetch(`${CONFIG.API_BASE}/question/delete/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        showToast(`Question #${id} deleted.`, 'success');
        await syncDataFromBackend();
        return;
      }
    } catch (err) {
      console.error(err);
    }
  }

  // Local state delete
  state.questions = state.questions.filter(q => q.id !== id);
  renderAllViews();
  showToast(`Question #${id} deleted.`, 'info');
}

// ==========================================================================
// Quizzes List Tab
// ==========================================================================
function renderQuizzesTab() {
  const container = document.getElementById('quizzesListCards');
  if (!container) return;

  if (state.quizzes.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
        <h3>No Quizzes Created</h3>
        <p>Generate your first quiz tailored by topic and difficulty.</p>
        <button class="btn btn-primary btn-sm" onclick="switchTab('create-quiz')">+ Create a Quiz</button>
      </div>
    `;
    return;
  }

  container.innerHTML = state.quizzes.map(quiz => {
    const qCount = quiz.questions ? quiz.questions.length : 'N/A';
    return `
      <div class="card" style="margin-bottom: 0;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem;">
          <div>
            <span class="badge badge-indigo" style="margin-bottom: 0.35rem;">Quiz #${quiz.id}</span>
            <h3 style="font-size: 1.15rem; font-weight: 700; color: var(--text-main);">${escapeHtml(quiz.title || `Quiz #${quiz.id}`)}</h3>
          </div>
        </div>
        <p style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 1.25rem;">
          Contains <strong>${qCount}</strong> randomized questions.
        </p>
        <button class="btn btn-primary btn-sm" style="width: 100%;" onclick="startQuizById(${quiz.id}); switchTab('take-quiz');">
          Play This Quiz &rarr;
        </button>
      </div>
    `;
  }).join('');
}

// ==========================================================================
// Utilities
// ==========================================================================
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3200);
}

function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
