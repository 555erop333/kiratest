import { questionBank } from "./questionBank.js";
import { vocabularyBank } from "./vocabularyBank.js";

const storageKey = "kira-english-quiz-progress";

const grammarSections = questionBank.sections.map((section) => ({
  ...section,
  type: "grammar",
}));

const vocabularySections = vocabularyBank.sections.map((section) => ({
  ...section,
  type: "vocabulary",
}));

const allSections = [...grammarSections, ...vocabularySections];

const elements = {
  heroSummary: document.querySelector("#heroSummary"),
  sectionGrid: document.querySelector("#sectionGrid"),
  vocabularyGrid: document.querySelector("#vocabularyGrid"),
  menuView: document.querySelector("#menuView"),
  vocabularyView: document.querySelector("#vocabularyView"),
  quizView: document.querySelector("#quizView"),
};

const menuHistoryState = () => ({ view: "menu" });
const quizHistoryState = (sectionId) => ({ view: "quiz", sectionId });

function loadStoredData() {
  try {
    const rawValue = localStorage.getItem(storageKey);

    if (!rawValue) {
      return {
        stats: {},
        session: null,
      };
    }

    const parsed = JSON.parse(rawValue);

    if (!parsed || Array.isArray(parsed)) {
      return {
        stats: {},
        session: null,
      };
    }

    if ("stats" in parsed || "session" in parsed) {
      return {
        stats: parsed.stats || {},
        session: parsed.session || null,
      };
    }

    return {
      stats: parsed,
      session: null,
    };
  } catch {
    return {
      stats: {},
      session: null,
    };
  }
}

const storedData = loadStoredData();

const state = {
  progress: storedData.stats,
  savedSession: storedData.session,
  activeSectionId: null,
  questions: [],
  questionIndex: 0,
  score: 0,
  correctAnswers: 0,
  answered: false,
  selectedOptionIndex: null,
  showPromptTranslation: false,
  showOptionTranslation: false,
  completed: false,
};

function persistStorage() {
  try {
    localStorage.setItem(
      storageKey,
      JSON.stringify({
        stats: state.progress,
        session: state.savedSession,
      })
    );
  } catch {
    // Ignore storage errors and keep the app usable.
  }
}

function getSectionById(sectionId) {
  return allSections.find((section) => section.id === sectionId);
}

function getCurrentSection() {
  return getSectionById(state.activeSectionId);
}

function getCurrentQuestion() {
  return state.questions[state.questionIndex];
}

function isVocabularySection(section) {
  return section?.type === "vocabulary";
}

function getQuestionCount(section) {
  return section?.questionCount || section?.questions?.length || 0;
}

function normaliseScore(value) {
  return Number.isFinite(value) ? value : 0;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function clearActiveQuizState() {
  state.activeSectionId = null;
  state.questions = [];
  state.questionIndex = 0;
  state.score = 0;
  state.correctAnswers = 0;
  state.answered = false;
  state.selectedOptionIndex = null;
  state.showPromptTranslation = false;
  state.showOptionTranslation = false;
  state.completed = false;
}

function syncHistoryState(nextState, mode = "replace") {
  if (typeof window === "undefined" || !window.history) {
    return;
  }

  if (mode === "push") {
    window.history.pushState(nextState, "", window.location.href);
    return;
  }

  window.history.replaceState(nextState, "", window.location.href);
}

function buildSessionSnapshot() {
  if (!state.activeSectionId || state.completed) {
    return null;
  }

  return {
    sectionId: state.activeSectionId,
    questionIndex: state.questionIndex,
    score: state.score,
    correctAnswers: state.correctAnswers,
    answered: state.answered,
    selectedOptionIndex: state.selectedOptionIndex,
    showPromptTranslation: state.showPromptTranslation,
    showOptionTranslation: state.showOptionTranslation,
  };
}

function persistCurrentSession() {
  state.savedSession = buildSessionSnapshot();
  persistStorage();
}

function clearSavedSession() {
  state.savedSession = null;
  persistStorage();
}

function applyFreshSectionState(section) {
  state.activeSectionId = section.id;
  state.questions = section.questions;
  state.questionIndex = 0;
  state.score = 0;
  state.correctAnswers = 0;
  state.answered = false;
  state.selectedOptionIndex = null;
  state.showPromptTranslation = false;
  state.showOptionTranslation = false;
  state.completed = false;
}

function applySavedSession(section, session) {
  applyFreshSectionState(section);

  state.questionIndex = clamp(
    Number.isInteger(session.questionIndex) ? session.questionIndex : 0,
    0,
    section.questions.length - 1
  );
  state.score = normaliseScore(session.score);
  state.correctAnswers = clamp(
    Number.isInteger(session.correctAnswers) ? session.correctAnswers : 0,
    0,
    section.questions.length
  );
  state.answered = Boolean(session.answered);

  const optionsCount =
    state.questions[state.questionIndex]?.options?.length || 0;

  state.selectedOptionIndex =
    Number.isInteger(session.selectedOptionIndex) &&
    session.selectedOptionIndex >= 0 &&
    session.selectedOptionIndex < optionsCount
      ? session.selectedOptionIndex
      : null;

  if (typeof session.showPromptTranslation === "boolean") {
    state.showPromptTranslation = session.showPromptTranslation;
  }

  if (typeof session.showOptionTranslation === "boolean") {
    state.showOptionTranslation = session.showOptionTranslation;
  }

  if (state.answered && state.selectedOptionIndex === null) {
    state.answered = false;
  }
}

function updateBestResult(sectionId) {
  const previous = state.progress[sectionId] || {
    bestScore: Number.NEGATIVE_INFINITY,
    bestCorrect: 0,
    attempts: 0,
  };

  const current = {
    bestScore:
      state.score > previous.bestScore ? state.score : previous.bestScore,
    bestCorrect:
      state.score > previous.bestScore
        ? state.correctAnswers
        : state.score === previous.bestScore
          ? Math.max(previous.bestCorrect, state.correctAnswers)
          : previous.bestCorrect,
    attempts: previous.attempts + 1,
    lastPlayedAt: new Date().toISOString(),
  };

  state.progress[sectionId] = current;
  persistStorage();
}

function scoreLabel(value) {
  return value > 0 ? `+${value}` : String(value);
}

function completionMessage(section) {
  const ratio = state.correctAnswers / state.questions.length;

  if (ratio >= 0.9) {
    return isVocabularySection(section)
      ? "Слова держатся очень уверенно. Можно переходить к следующей теме."
      : "Очень сильный результат. Можно идти за следующей звёздочкой.";
  }

  if (ratio >= 0.75) {
    return isVocabularySection(section)
      ? "Отлично. Эти слова уже хорошо запомнились."
      : "Отлично. Тема уже хорошо держится, осталось немного закрепить.";
  }

  if (ratio >= 0.5) {
    return isVocabularySection(section)
      ? "Хорошая словарная тренировка. Один повтор сделает результат заметно лучше."
      : "Хорошая тренировка. Повтори раздел ещё раз и результат вырастет.";
  }

  return isVocabularySection(section)
    ? "Теперь видно, какие слова стоит повторить ещё раз."
    : "Это тоже полезно: теперь видно, какие правила стоит повторить ещё раз.";
}

function renderHeroSummary() {
  const progressItems = Object.values(state.progress);
  const playedSections = progressItems.length;
  const bestScore = progressItems.length
    ? progressItems.reduce(
        (max, item) => Math.max(max, normaliseScore(item.bestScore)),
        normaliseScore(progressItems[0].bestScore)
      )
    : 0;
  const totalAttempts = progressItems.reduce(
    (sum, item) => sum + (Number.isFinite(item.attempts) ? item.attempts : 0),
    0
  );

  elements.heroSummary.innerHTML = `
    <article class="summary-card">
      <span class="summary-card__label">Грамматика</span>
      <strong>${questionBank.totalSections}</strong>
      <span class="summary-card__sub">${questionBank.totalQuestions} вопросов по правилам</span>
    </article>
    <article class="summary-card">
      <span class="summary-card__label">Словарь</span>
      <strong>${vocabularyBank.totalSections}</strong>
      <span class="summary-card__sub">${vocabularyBank.totalQuestions} слов для повторения</span>
    </article>
    <article class="summary-card">
      <span class="summary-card__label">Пройдено тем</span>
      <strong>${playedSections}</strong>
      <span class="summary-card__sub">попыток: ${totalAttempts}</span>
    </article>
    <article class="summary-card">
      <span class="summary-card__label">Лучший счёт</span>
      <strong>${scoreLabel(bestScore)}</strong>
      <span class="summary-card__sub">сохраняется на этом устройстве</span>
    </article>
  `;
}

function renderDeckCards(targetElement, sections) {
  if (!targetElement) {
    return;
  }

  targetElement.innerHTML = sections
    .map((section) => {
      const progress = state.progress[section.id];
      const savedSession =
        state.savedSession?.sectionId === section.id ? state.savedSession : null;
      const questionCount = getQuestionCount(section);
      const isVocabulary = isVocabularySection(section);
      const bestScore = progress ? scoreLabel(progress.bestScore) : "ещё нет";
      const bestCorrect = progress
        ? `${progress.bestCorrect}/${questionCount}`
        : `0/${questionCount}`;
      const fill = progress
        ? Math.max(8, Math.round((progress.bestCorrect / questionCount) * 100))
        : savedSession
          ? Math.max(
              8,
              Math.round(((savedSession.questionIndex + 1) / questionCount) * 100)
            )
          : 8;
      const footerText = savedSession
        ? `Продолжить с ${isVocabulary ? "слова" : "вопроса"} ${savedSession.questionIndex + 1}`
        : `Верно: ${bestCorrect}`;
      const resumeText = savedSession
        ? `Сохранено: счёт ${scoreLabel(savedSession.score)}, правильных ${savedSession.correctAnswers}/${questionCount}`
        : "";

      return `
        <article class="section-card section-card--${section.type}" style="--accent:${section.accent}">
          <div class="section-card__gloss"></div>
          <span class="section-card__badge">${isVocabulary ? "Словарь" : "Грамматика"}</span>
          <p class="section-card__subtitle">${section.subtitle}</p>
          <h3>${section.title}</h3>
          <p class="section-card__description">${section.description}</p>
          <div class="section-card__meta">
            <span>${questionCount} ${isVocabulary ? "слов" : "вопросов"}</span>
            <span>Лучший счёт: ${bestScore}</span>
          </div>
          <div class="section-card__meter">
            <span style="width:${fill}%"></span>
          </div>
          <div class="section-card__footer">
            <span>${footerText}</span>
            <button
              class="secondary-button"
              data-action="start-section"
              data-section-id="${section.id}"
            >
              ${savedSession ? "Продолжить" : isVocabulary ? "Учить слова" : "Начать"}
            </button>
          </div>
          ${
            savedSession
              ? `<p class="section-card__resume">${resumeText}</p>`
              : ""
          }
        </article>
      `;
    })
    .join("");
}

function renderSectionCards() {
  renderDeckCards(elements.sectionGrid, grammarSections);
}

function renderVocabularyCards() {
  renderDeckCards(elements.vocabularyGrid, vocabularySections);
}

function renderMenuState() {
  const shouldShowMenu = !state.activeSectionId;

  elements.menuView.classList.toggle("hidden", !shouldShowMenu);
  elements.vocabularyView.classList.toggle("hidden", !shouldShowMenu);
  elements.quizView.classList.toggle("hidden", shouldShowMenu);
}

function renderQuestionView() {
  const section = getCurrentSection();
  const question = getCurrentQuestion();
  const isVocabulary = isVocabularySection(section);
  const progressValue = ((state.questionIndex + 1) / state.questions.length) * 100;
  const feedbackClass =
    state.selectedOptionIndex === question.correctIndex ? "correct" : "wrong";
  const correctAnswer = question.options[question.correctIndex];
  const promptText = state.showPromptTranslation
    ? question.prompt.ru
    : question.prompt.en;

  elements.quizView.innerHTML = `
    <div class="quiz-shell" style="--accent:${section.accent}">
      <div class="quiz-shell__top">
        <button class="ghost-button" data-action="back-to-menu">К темам</button>
        <span class="quiz-shell__pill">${isVocabulary ? "Словарь" : "Грамматика"} • ${section.title}</span>
      </div>

      <div class="quiz-stats">
        <article class="quiz-stat">
          <span>${isVocabulary ? "Слово" : "Вопрос"}</span>
          <strong>${state.questionIndex + 1} / ${state.questions.length}</strong>
        </article>
        <article class="quiz-stat">
          <span>Очки</span>
          <strong>${scoreLabel(state.score)}</strong>
        </article>
        <article class="quiz-stat">
          <span>Верно</span>
          <strong>${state.correctAnswers}</strong>
        </article>
      </div>

      <div class="progress-line">
        <span style="width:${progressValue}%"></span>
      </div>

      <article class="quiz-card">
        <div class="quiz-card__header">
          <div>
            <p class="eyebrow">${isVocabulary ? "Найди правильный перевод" : "Выбери правильный вариант"}</p>
            <h2>${section.subtitle}</h2>
          </div>
          <div class="translation-tools">
            <button
              class="mini-button"
              data-action="toggle-prompt-translation"
            >
              ${
                state.showPromptTranslation
                  ? isVocabulary
                    ? "Спрятать перевод"
                    : "Показать английский"
                  : isVocabulary
                    ? "Показать перевод"
                    : "Перевести предложение"
              }
            </button>
            ${
              isVocabulary
                ? ""
                : `
                  <button
                    class="mini-button"
                    data-action="toggle-option-translation"
                  >
                    ${state.showOptionTranslation ? "Показать английский" : "Перевести варианты"}
                  </button>
                `
            }
          </div>
        </div>

        <p class="quiz-card__hint">
          ${
            isVocabulary
              ? "Смотри на английское слово и нажимай на его перевод."
              : "Если нужно, включай перевод предложения и вариантов ответа."
          }
        </p>

        <p class="quiz-card__prompt ${isVocabulary ? "quiz-card__prompt--word" : ""}">
          ${promptText}
        </p>

        <div class="options-grid">
          ${question.options
            .map((answer, index) => {
              const isSelected = index === state.selectedOptionIndex;
              const isCorrect = index === question.correctIndex;
              const stateClass = state.answered
                ? isCorrect
                  ? "option-button--correct"
                  : isSelected
                    ? "option-button--wrong"
                    : "option-button--locked"
                : "";

              return `
                <button
                  class="option-button ${stateClass}"
                  data-action="answer"
                  data-option-index="${index}"
                  ${state.answered ? "disabled" : ""}
                >
                  <span class="option-button__letter">${String.fromCharCode(
                    65 + index
                  )}</span>
                  <span class="option-button__text">
                    ${isVocabulary ? answer.ru : state.showOptionTranslation ? answer.ru : answer.en}
                  </span>
                </button>
              `;
            })
            .join("")}
        </div>

        ${
          state.answered
            ? `
              <section class="feedback-card feedback-card--${feedbackClass}">
                <div class="feedback-card__score">
                  ${
                    state.selectedOptionIndex === question.correctIndex
                      ? "+1 очко"
                      : "-1 очко"
                  }
                </div>
                <div class="feedback-card__text">
                  <strong>${
                    state.selectedOptionIndex === question.correctIndex
                      ? "Правильно!"
                      : "Почти, попробуй дальше."
                  }</strong>
                  <p>${
                    state.selectedOptionIndex === question.correctIndex
                      ? question.explanation.correct
                      : question.explanation.incorrect
                  }</p>
                  <p class="feedback-card__answer">
                    ${
                      isVocabulary
                        ? `Правильный перевод: ${correctAnswer.ru} — ${question.prompt.en}`
                        : `Правильный ответ: ${correctAnswer.en}${
                            state.showOptionTranslation ? ` — ${correctAnswer.ru}` : ""
                          }`
                    }
                  </p>
                </div>
                <button class="primary-button" data-action="next-question">
                  ${
                    state.questionIndex === state.questions.length - 1
                      ? "Показать результат"
                      : "Следующее задание"
                  }
                </button>
              </section>
            `
            : ""
        }
      </article>
    </div>
  `;
}

function renderResultView() {
  const section = getCurrentSection();
  const progress = state.progress[section.id];
  const isVocabulary = isVocabularySection(section);
  const questionCount = getQuestionCount(section);

  elements.quizView.innerHTML = `
    <div class="quiz-shell" style="--accent:${section.accent}">
      <div class="quiz-shell__top">
        <button class="ghost-button" data-action="back-to-menu">К темам</button>
        <span class="quiz-shell__pill">${isVocabulary ? "Словарная тема завершена" : "Раздел завершён"}</span>
      </div>

      <article class="result-card">
        <p class="eyebrow">${isVocabulary ? "Финиш по словам" : "Финиш по теме"}</p>
        <h2>${section.title}</h2>
        <div class="result-card__score">${scoreLabel(state.score)}</div>
        <p class="result-card__lead">
          ${
            isVocabulary ? "Правильных переводов" : "Правильных ответов"
          }: <strong>${state.correctAnswers}</strong> из
          <strong>${state.questions.length}</strong>.
        </p>
        <p class="result-card__message">${completionMessage(section)}</p>

        <div class="result-card__stats">
          <div>
            <span>Лучший счёт</span>
            <strong>${scoreLabel(progress.bestScore)}</strong>
          </div>
          <div>
            <span>Лучший результат</span>
            <strong>${progress.bestCorrect}/${questionCount}</strong>
          </div>
          <div>
            <span>Попыток</span>
            <strong>${progress.attempts}</strong>
          </div>
        </div>

        <div class="result-card__actions">
          <button
            class="primary-button"
            data-action="restart-section"
            data-section-id="${section.id}"
          >
            Пройти ещё раз
          </button>
          <button class="secondary-button" data-action="back-to-menu">
            Главное меню
          </button>
        </div>
      </article>
    </div>
  `;
}

function renderQuizState() {
  if (!state.activeSectionId) {
    elements.quizView.innerHTML = "";
    return;
  }

  if (state.completed) {
    renderResultView();
    return;
  }

  renderQuestionView();
}

function render() {
  renderHeroSummary();
  renderSectionCards();
  renderVocabularyCards();
  renderMenuState();
  renderQuizState();
}

function startSection(sectionId, forceRestart = false, options = {}) {
  const { fromHistory = false } = options;
  const section = getSectionById(sectionId);

  if (!section) {
    return;
  }

  const savedSession =
    !forceRestart && state.savedSession?.sectionId === sectionId
      ? state.savedSession
      : null;

  if (savedSession) {
    applySavedSession(section, savedSession);
  } else {
    applyFreshSectionState(section);
  }

  persistCurrentSession();

  if (!fromHistory) {
    const currentHistoryState = window.history.state;

    if (currentHistoryState?.view === "quiz") {
      syncHistoryState(quizHistoryState(section.id), "replace");
    } else {
      syncHistoryState(quizHistoryState(section.id), "push");
    }
  }

  render();
  window.scrollTo({ top: 0, behavior: fromHistory ? "auto" : "smooth" });
}

function handleAnswer(optionIndex) {
  if (state.answered || state.completed) {
    return;
  }

  const question = getCurrentQuestion();
  const isCorrect = optionIndex === question.correctIndex;

  state.answered = true;
  state.selectedOptionIndex = optionIndex;
  state.score += isCorrect ? 1 : -1;

  if (isCorrect) {
    state.correctAnswers += 1;
  }

  persistCurrentSession();
  renderQuizState();
}

function goToNextQuestion() {
  if (!state.answered) {
    return;
  }

  if (state.questionIndex === state.questions.length - 1) {
    state.completed = true;
    updateBestResult(state.activeSectionId);
    clearSavedSession();
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }

  state.questionIndex += 1;
  state.answered = false;
  state.selectedOptionIndex = null;
  state.showPromptTranslation = false;
  state.showOptionTranslation = false;

  persistCurrentSession();
  renderQuizState();
}

function renderMainMenu(
  shouldSmoothScroll = true,
  targetElement = elements.menuView
) {
  clearActiveQuizState();
  render();
  targetElement?.scrollIntoView({
    behavior: shouldSmoothScroll ? "smooth" : "auto",
    block: "start",
  });
}

function showMenu(targetElement = elements.menuView, shouldSmoothScroll = true) {
  if (state.activeSectionId && !state.completed) {
    persistCurrentSession();
  }

  syncHistoryState(menuHistoryState(), "replace");
  renderMainMenu(shouldSmoothScroll, targetElement);
}

function backToMenu(fromHistory = false) {
  if (fromHistory) {
    renderMainMenu(false);
    return;
  }

  showMenu(elements.menuView, true);
}

function handlePopState(event) {
  const nextState = event.state;

  if (nextState?.view === "quiz" && nextState.sectionId) {
    startSection(nextState.sectionId, false, { fromHistory: true });
    return;
  }

  renderMainMenu(false);
}

document.addEventListener("click", (event) => {
  const button = event.target.closest("[data-action]");

  if (!button) {
    return;
  }

  const { action, sectionId, optionIndex } = button.dataset;

  if (action === "scroll-sections") {
    event.preventDefault();

    if (state.activeSectionId) {
      showMenu(elements.menuView, true);
      return;
    }

    elements.menuView?.scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }

  if (action === "scroll-vocabulary") {
    event.preventDefault();

    if (state.activeSectionId) {
      showMenu(elements.vocabularyView, true);
      return;
    }

    elements.vocabularyView?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
    return;
  }

  if (action === "start-section" && sectionId) {
    startSection(sectionId);
  }

  if (action === "restart-section" && sectionId) {
    startSection(sectionId, true);
  }

  if (action === "back-to-menu") {
    backToMenu();
  }

  if (action === "toggle-prompt-translation") {
    state.showPromptTranslation = !state.showPromptTranslation;
    persistCurrentSession();
    renderQuizState();
  }

  if (action === "toggle-option-translation") {
    state.showOptionTranslation = !state.showOptionTranslation;
    persistCurrentSession();
    renderQuizState();
  }

  if (action === "answer" && typeof optionIndex !== "undefined") {
    handleAnswer(Number(optionIndex));
  }

  if (action === "next-question") {
    goToNextQuestion();
  }
});

window.addEventListener("popstate", handlePopState);
syncHistoryState(menuHistoryState(), "replace");
render();
