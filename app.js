import { questionBank } from "./questionBank.js";
import { vocabularyBank } from "./vocabularyBank.js";

const storageKey = "kira-english-quiz-progress";
const assessmentSectionId = "assessment-work";
const assessmentQuestionsPerSection = 3;

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
  activeSection: null,
  questions: [],
  questionIndex: 0,
  score: 0,
  correctAnswers: 0,
  answered: false,
  selectedOptionIndex: null,
  showPromptTranslation: false,
  showOptionTranslation: false,
  completed: false,
  answerHistory: [],
  quizMode: "section",
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
  return state.activeSection || getSectionById(state.activeSectionId);
}

function getCurrentQuestion() {
  return state.questions[state.questionIndex];
}

function isVocabularySection(section) {
  return section?.type === "vocabulary";
}

function isAssessmentSection(section) {
  return section?.type === "assessment";
}

function isReverseVocabularyQuestion(question) {
  return question?.direction === "ru-en";
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

function shuffleArray(items) {
  const copy = [...items];

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }

  return copy;
}

function sampleItems(items, count) {
  return shuffleArray(items).slice(0, Math.min(count, items.length));
}

function getQuestionSectionType(section, question) {
  if (isAssessmentSection(section)) {
    return question?.assessmentMeta?.sectionType || "grammar";
  }

  return section?.type;
}

function createAssessmentQuestion(question, sourceSection, index) {
  return {
    ...question,
    id: `${assessmentSectionId}-${sourceSection.id}-${index}-${question.id}`,
    assessmentMeta: {
      sectionId: sourceSection.id,
      sectionTitle: sourceSection.title,
      sectionSubtitle: sourceSection.subtitle,
      sectionType: sourceSection.type,
      sectionAccent: sourceSection.accent,
    },
  };
}

function buildVocabularyAssessmentQuestions(section) {
  const questionGroups = new Map();

  section.questions.forEach((question) => {
    const key = `${question.prompt.en}::${question.prompt.ru}`;

    if (!questionGroups.has(key)) {
      questionGroups.set(key, []);
    }

    questionGroups.get(key).push(question);
  });

  return sampleItems(
    Array.from(questionGroups.values()),
    assessmentQuestionsPerSection
  ).map((group, index) =>
    createAssessmentQuestion(sampleItems(group, 1)[0], section, index)
  );
}

function buildAssessmentQuestionsForSection(section) {
  if (isVocabularySection(section)) {
    return buildVocabularyAssessmentQuestions(section);
  }

  return sampleItems(section.questions, assessmentQuestionsPerSection).map(
    (question, index) => createAssessmentQuestion(question, section, index)
  );
}

function createAssessmentSection() {
  const sourceSections = [...grammarSections, ...vocabularySections];
  const questions = shuffleArray(
    sourceSections.flatMap((section) => buildAssessmentQuestionsForSection(section))
  );

  return {
    id: assessmentSectionId,
    type: "assessment",
    title: "Проверочная работа",
    subtitle: "Progress Check",
    description:
      "Смешанная работа без подсказок: по 3 случайных задания из каждого правила и каждой словарной темы.",
    accent: "#6f8cff",
    questionCount: questions.length,
    questions,
    grammarQuestionCount: grammarSections.length * assessmentQuestionsPerSection,
    vocabularyQuestionCount:
      vocabularySections.length * assessmentQuestionsPerSection,
    sectionSummaries: sourceSections.map((section) => ({
      id: section.id,
      title: section.title,
      subtitle: section.subtitle,
      type: section.type,
      total: assessmentQuestionsPerSection,
    })),
  };
}

function clearActiveQuizState() {
  state.activeSectionId = null;
  state.activeSection = null;
  state.questions = [];
  state.questionIndex = 0;
  state.score = 0;
  state.correctAnswers = 0;
  state.answered = false;
  state.selectedOptionIndex = null;
  state.showPromptTranslation = false;
  state.showOptionTranslation = false;
  state.completed = false;
  state.answerHistory = [];
  state.quizMode = "section";
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
  if (!state.activeSectionId || state.completed || state.quizMode === "assessment") {
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
  const snapshot = buildSessionSnapshot();

  if (!snapshot) {
    return;
  }

  state.savedSession = snapshot;
  persistStorage();
}

function clearSavedSession() {
  state.savedSession = null;
  persistStorage();
}

function applyFreshSectionState(section, quizMode = "section") {
  state.activeSectionId = section.id;
  state.activeSection = section;
  state.questions = section.questions;
  state.questionIndex = 0;
  state.score = 0;
  state.correctAnswers = 0;
  state.answered = false;
  state.selectedOptionIndex = null;
  state.showPromptTranslation = false;
  state.showOptionTranslation = false;
  state.completed = false;
  state.answerHistory = [];
  state.quizMode = quizMode;
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

  if (isVocabularySection(section)) {
    state.showPromptTranslation = false;
    state.showOptionTranslation = false;
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

function assessmentCompletionMessage(ratio) {
  if (ratio >= 0.9) {
    return "Очень сильный результат. Проверочная работа пройдена уверенно и без заметных провалов.";
  }

  if (ratio >= 0.75) {
    return "Хороший уровень. Ошибки точечные, их можно быстро добрать повтором слабых тем.";
  }

  if (ratio >= 0.5) {
    return "База уже есть, но часть правил и слов пока держится нестабильно. Смотри разбивку по темам ниже.";
  }

  return "Проверочная работа показала, что сначала стоит спокойно повторить базовые правила и словарные темы.";
}

function buildAssessmentSummary(section) {
  const sectionResults = section.sectionSummaries.map((item) => ({
    ...item,
    correct: 0,
  }));
  const resultsMap = new Map(
    sectionResults.map((item) => [item.id, item])
  );

  state.answerHistory.forEach((entry) => {
    const target = resultsMap.get(entry.sectionId);

    if (target && entry.correct) {
      target.correct += 1;
    }
  });

  sectionResults.forEach((item) => {
    item.incorrect = item.total - item.correct;
  });

  const grammarResults = sectionResults.filter((item) => item.type === "grammar");
  const vocabularyResults = sectionResults.filter(
    (item) => item.type === "vocabulary"
  );
  const sumCorrect = (items) =>
    items.reduce((sum, item) => sum + item.correct, 0);
  const sumTotal = (items) => items.reduce((sum, item) => sum + item.total, 0);
  const total = state.questions.length;
  const correct = state.correctAnswers;

  return {
    total,
    correct,
    incorrect: total - correct,
    ratio: total ? correct / total : 0,
    percentage: total ? Math.round((correct / total) * 100) : 0,
    grammarResults,
    vocabularyResults,
    grammarCorrect: sumCorrect(grammarResults),
    grammarTotal: sumTotal(grammarResults),
    vocabularyCorrect: sumCorrect(vocabularyResults),
    vocabularyTotal: sumTotal(vocabularyResults),
    sectionCount: sectionResults.length,
  };
}

function renderAssessmentBreakdown(items) {
  return items
    .map((item) => {
      const toneClass =
        item.correct === item.total
          ? "assessment-breakdown__item--strong"
          : item.correct >= Math.ceil(item.total / 2)
            ? "assessment-breakdown__item--mid"
            : "assessment-breakdown__item--weak";

      return `
        <article class="assessment-breakdown__item ${toneClass}">
          <span class="assessment-breakdown__subtitle">${item.subtitle}</span>
          <strong>${item.title}</strong>
          <span class="assessment-breakdown__score">${item.correct}/${item.total}</span>
        </article>
      `;
    })
    .join("");
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
      <span class="summary-card__sub">${vocabularyBank.totalWords} слов и ${vocabularyBank.totalQuestions} заданий</span>
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
      const itemCountText = isVocabulary
        ? `${section.wordCount} слов • ${questionCount} заданий`
        : `${questionCount} вопросов`;
      const fill = progress
        ? Math.max(8, Math.round((progress.bestCorrect / questionCount) * 100))
        : savedSession
          ? Math.max(
              8,
              Math.round(((savedSession.questionIndex + 1) / questionCount) * 100)
            )
          : 8;
      const footerText = savedSession
        ? `Продолжить с ${isVocabulary ? "задания" : "вопроса"} ${savedSession.questionIndex + 1}`
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
            <span>${itemCountText}</span>
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
  const isAssessment = isAssessmentSection(section);
  const isVocabulary = getQuestionSectionType(section, question) === "vocabulary";
  const isReverseVocabulary = isVocabulary && isReverseVocabularyQuestion(question);
  const progressValue = ((state.questionIndex + 1) / state.questions.length) * 100;
  const correctAnswer = question.options[question.correctIndex];
  const sourceTitle = isAssessment
    ? question.assessmentMeta.sectionTitle
    : section.title;
  const sourceSubtitle = isAssessment
    ? question.assessmentMeta.sectionSubtitle
    : section.subtitle;
  const shellAccent = isAssessment
    ? question.assessmentMeta.sectionAccent
    : section.accent;
  const promptText = isVocabulary
    ? isReverseVocabulary
      ? question.prompt.ru
      : question.prompt.en
    : state.showPromptTranslation
      ? question.prompt.ru
      : question.prompt.en;
  const vocabularyEyebrow = isReverseVocabulary
    ? "Найди слово по-английски"
    : "Найди правильный перевод";
  const vocabularyHintText = isReverseVocabulary
    ? "Смотри на русское слово и нажимай на английский вариант."
    : "Смотри на английское слово и нажимай на его перевод.";
  const headerEyebrow = isAssessment
    ? isVocabulary
      ? vocabularyEyebrow
      : "Проверочная работа без подсказок"
    : isVocabulary
      ? vocabularyEyebrow
      : "Выбери правильный вариант";
  const hintText = isAssessment
    ? "Переводы, подсказки и разбор ответов отключены до конца проверочной работы."
    : isVocabulary
      ? vocabularyHintText
      : "Если нужно, включай перевод предложения и вариантов ответа.";

  elements.quizView.innerHTML = `
    <div class="quiz-shell" style="--accent:${shellAccent}">
      <div class="quiz-shell__top">
        <button class="ghost-button" data-action="back-to-menu">К темам</button>
        <span class="quiz-shell__pill">${
          isAssessment
            ? `Проверочная работа • ${sourceTitle}`
            : `${isVocabulary ? "Словарь" : "Грамматика"} • ${section.title}`
        }</span>
      </div>

      <div class="quiz-stats">
        <article class="quiz-stat">
          <span>${isAssessment || isVocabulary ? "Задание" : "Вопрос"}</span>
          <strong>${state.questionIndex + 1} / ${state.questions.length}</strong>
        </article>
        ${
          isAssessment
            ? `
              <article class="quiz-stat">
                <span>Грамматика</span>
                <strong>${section.grammarQuestionCount}</strong>
              </article>
              <article class="quiz-stat">
                <span>Словарь</span>
                <strong>${section.vocabularyQuestionCount}</strong>
              </article>
            `
            : `
              <article class="quiz-stat">
                <span>Очки</span>
                <strong>${scoreLabel(state.score)}</strong>
              </article>
              <article class="quiz-stat">
                <span>Верно</span>
                <strong>${state.correctAnswers}</strong>
              </article>
            `
        }
      </div>

      <div class="progress-line">
        <span style="width:${progressValue}%"></span>
      </div>

      <article class="quiz-card">
        <div class="quiz-card__header">
          <div>
            <p class="eyebrow">${headerEyebrow}</p>
            <h2>${isAssessment ? sourceTitle : section.subtitle}</h2>
            ${
              isAssessment
                ? `<p class="quiz-card__source">${sourceSubtitle}</p>`
                : ""
            }
          </div>
          ${
            isVocabulary || isAssessment
              ? ""
              : `
                <div class="translation-tools">
                  <button
                    class="mini-button"
                    data-action="toggle-prompt-translation"
                  >
                    ${state.showPromptTranslation ? "Показать английский" : "Перевести предложение"}
                  </button>
                  <button
                    class="mini-button"
                    data-action="toggle-option-translation"
                  >
                    ${state.showOptionTranslation ? "Показать английский" : "Перевести варианты"}
                  </button>
                </div>
              `
          }
        </div>

        <p class="quiz-card__hint">
          ${hintText}
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
                ? isAssessment
                  ? isSelected
                    ? "option-button--selected"
                    : "option-button--locked"
                  : isCorrect
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
                    ${
                      isVocabulary
                        ? isReverseVocabulary
                          ? answer.en
                          : answer.ru
                        : state.showOptionTranslation
                          ? answer.ru
                          : answer.en
                    }
                  </span>
                </button>
              `;
            })
            .join("")}
        </div>

        ${
          state.answered
            ? `
              ${
                isAssessment
                  ? `
                    <section class="feedback-card feedback-card--neutral">
                      <div class="feedback-card__score">Ответ принят</div>
                      <div class="feedback-card__text">
                        <strong>Результат этого задания откроется в конце.</strong>
                        <p>Проверочная работа идёт без подсказок и без показа правильного ответа по ходу.</p>
                      </div>
                      <button class="primary-button" data-action="next-question">
                        ${
                          state.questionIndex === state.questions.length - 1
                            ? "Показать итог"
                            : "Следующее задание"
                        }
                      </button>
                    </section>
                  `
                  : `
                    <section class="feedback-card feedback-card--${
                      state.selectedOptionIndex === question.correctIndex
                        ? "correct"
                        : "wrong"
                    }">
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
                              ? isReverseVocabulary
                                ? `Правильное слово: ${correctAnswer.en} — ${question.prompt.ru}`
                                : `Правильный перевод: ${correctAnswer.ru} — ${question.prompt.en}`
                              : `Правильный ответ: ${correctAnswer.en}${
                                  state.showOptionTranslation
                                    ? ` — ${correctAnswer.ru}`
                                    : ""
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
              }
            `
            : ""
        }
      </article>
    </div>
  `;
}

function renderAssessmentResultView(section) {
  const summary = buildAssessmentSummary(section);

  elements.quizView.innerHTML = `
    <div class="quiz-shell" style="--accent:${section.accent}">
      <div class="quiz-shell__top">
        <button class="ghost-button" data-action="back-to-menu">К темам</button>
        <span class="quiz-shell__pill">Проверочная работа завершена</span>
      </div>

      <article class="result-card">
        <p class="eyebrow">Финиш без подсказок</p>
        <h2>${section.title}</h2>
        <div class="result-card__score">${summary.correct}/${summary.total}</div>
        <p class="result-card__lead">
          Верных ответов: <strong>${summary.correct}</strong> из
          <strong>${summary.total}</strong>. Процент выполнения:
          <strong>${summary.percentage}%</strong>.
        </p>
        <p class="result-card__message">${assessmentCompletionMessage(summary.ratio)}</p>

        <div class="result-card__stats">
          <div>
            <span>Грамматика</span>
            <strong>${summary.grammarCorrect}/${summary.grammarTotal}</strong>
          </div>
          <div>
            <span>Словарь</span>
            <strong>${summary.vocabularyCorrect}/${summary.vocabularyTotal}</strong>
          </div>
          <div>
            <span>Тем проверено</span>
            <strong>${summary.sectionCount}</strong>
          </div>
        </div>

        <section class="assessment-breakdown">
          <h3>Грамматические темы</h3>
          <div class="assessment-breakdown__grid">
            ${renderAssessmentBreakdown(summary.grammarResults)}
          </div>
        </section>

        <section class="assessment-breakdown">
          <h3>Словарные темы</h3>
          <div class="assessment-breakdown__grid">
            ${renderAssessmentBreakdown(summary.vocabularyResults)}
          </div>
        </section>

        <div class="result-card__actions">
          <button class="primary-button" data-action="start-assessment">
            Пройти проверочную ещё раз
          </button>
          <button class="secondary-button" data-action="back-to-menu">
            Главное меню
          </button>
        </div>
      </article>
    </div>
  `;
}

function renderResultView() {
  const section = getCurrentSection();

  if (isAssessmentSection(section)) {
    renderAssessmentResultView(section);
    return;
  }

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
          Правильных ответов: <strong>${state.correctAnswers}</strong> из
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

function startAssessment(options = {}) {
  const { fromHistory = false } = options;
  const section = createAssessmentSection();

  applyFreshSectionState(section, "assessment");

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

  const section = getCurrentSection();
  const question = getCurrentQuestion();
  const isCorrect = optionIndex === question.correctIndex;

  state.answered = true;
  state.selectedOptionIndex = optionIndex;
  state.score += isCorrect ? 1 : -1;

  if (isCorrect) {
    state.correctAnswers += 1;
  }

  state.answerHistory.push({
    questionId: question.id,
    sectionId: isAssessmentSection(section)
      ? question.assessmentMeta.sectionId
      : section.id,
    correct: isCorrect,
  });

  persistCurrentSession();
  renderQuizState();
}

function goToNextQuestion() {
  if (!state.answered) {
    return;
  }

  const section = getCurrentSection();

  if (state.questionIndex === state.questions.length - 1) {
    state.completed = true;

    if (!isAssessmentSection(section)) {
      updateBestResult(state.activeSectionId);
      clearSavedSession();
    }

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

  if (nextState?.view === "quiz" && nextState.sectionId === assessmentSectionId) {
    startAssessment({ fromHistory: true });
    return;
  }

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

  if (action === "start-assessment") {
    startAssessment();
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
