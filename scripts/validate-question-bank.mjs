import { questionBank } from "../questionBank.js";

const expectedSections = 9;
const expectedQuestionsPerSection = 100;

if (questionBank.sections.length !== expectedSections) {
  throw new Error(
    `Expected ${expectedSections} sections, received ${questionBank.sections.length}.`
  );
}

questionBank.sections.forEach((section) => {
  if (section.questions.length !== expectedQuestionsPerSection) {
    throw new Error(
      `Section "${section.id}" has ${section.questions.length} questions instead of ${expectedQuestionsPerSection}.`
    );
  }

  section.questions.forEach((question) => {
    if (!question.prompt.en || !question.prompt.ru) {
      throw new Error(`Question "${question.id}" is missing prompt translations.`);
    }

    if (question.options.length !== 4) {
      throw new Error(`Question "${question.id}" does not have exactly 4 options.`);
    }

    if (question.correctIndex < 0 || question.correctIndex > 3) {
      throw new Error(`Question "${question.id}" has an invalid correct index.`);
    }

    if (!question.explanation.correct || !question.explanation.incorrect) {
      throw new Error(`Question "${question.id}" is missing explanations.`);
    }
  });
});

console.log(
  `Validated ${questionBank.totalSections} sections and ${questionBank.totalQuestions} questions successfully.`
);
