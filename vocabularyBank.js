const hashString = (value) => {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
};

const createSeededRandom = (seed) => {
  let state = seed || 1;

  return () => {
    state += 0x6d2b79f5;
    let result = Math.imul(state ^ (state >>> 15), state | 1);
    result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
};

const shuffleWithSeed = (items, seedKey) => {
  const copy = [...items];
  const random = createSeededRandom(hashString(String(seedKey)));

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }

  return copy;
};

const option = (en, ru) => ({ en, ru });

const topics = [
  {
    id: "vocab-professions",
    title: "Профессии",
    subtitle: "Professions",
    description: "Повтори самые частые названия профессий и выбирай правильный перевод.",
    accent: "#ff9a5f",
    words: [
      option("teacher", "учитель"),
      option("doctor", "врач"),
      option("nurse", "медсестра"),
      option("pilot", "пилот"),
      option("driver", "водитель"),
      option("baker", "пекарь"),
      option("cook", "повар"),
      option("firefighter", "пожарный"),
      option("vet", "ветеринар"),
      option("police officer", "полицейский"),
    ],
  },
  {
    id: "vocab-town",
    title: "Места в городе",
    subtitle: "Places in Town",
    description: "Школа, парк, библиотека и другие места, которые часто встречаются в заданиях.",
    accent: "#6fc2ff",
    words: [
      option("school", "школа"),
      option("park", "парк"),
      option("hospital", "больница"),
      option("shop", "магазин"),
      option("cinema", "кинотеатр"),
      option("zoo", "зоопарк"),
      option("library", "библиотека"),
      option("museum", "музей"),
      option("cafe", "кафе"),
      option("playground", "игровая площадка"),
    ],
  },
  {
    id: "vocab-food-packaging",
    title: "Упаковки для еды",
    subtitle: "Food Packaging",
    description: "Полезные словосочетания про еду, напитки и их упаковки.",
    accent: "#ffd166",
    words: [
      option("a bottle of water", "бутылка воды"),
      option("a carton of milk", "пакет молока"),
      option("a jar of jam", "банка варенья"),
      option("a packet of biscuits", "пачка печенья"),
      option("a box of cereal", "коробка хлопьев"),
      option("a can of lemonade", "банка лимонада"),
      option("a loaf of bread", "буханка хлеба"),
      option("a bar of chocolate", "плитка шоколада"),
      option("a cup of tea", "чашка чая"),
      option("a bowl of soup", "миска супа"),
    ],
  },
  {
    id: "vocab-camping",
    title: "Предметы в кемпинге",
    subtitle: "Camping Things",
    description: "Собери рюкзак для похода и проверь слова на тему кемпинга.",
    accent: "#58cc8a",
    words: [
      option("tent", "палатка"),
      option("backpack", "рюкзак"),
      option("sleeping bag", "спальный мешок"),
      option("flashlight", "фонарик"),
      option("map", "карта"),
      option("compass", "компас"),
      option("blanket", "одеяло"),
      option("boots", "ботинки"),
      option("kettle", "чайник"),
      option("rope", "верёвка"),
    ],
  },
  {
    id: "vocab-movement",
    title: "Глаголы движения",
    subtitle: "Movement Verbs",
    description: "Короткая тренировка по самым частым глаголам движения для 4 класса.",
    accent: "#9b8cff",
    words: [
      option("run", "бегать"),
      option("jump", "прыгать"),
      option("walk", "идти пешком"),
      option("swim", "плавать"),
      option("climb", "лазить"),
      option("fly", "летать"),
      option("ride", "кататься"),
      option("skip", "скакать"),
      option("dive", "нырять"),
      option("sail", "плыть на лодке"),
    ],
  },
  {
    id: "vocab-feelings",
    title: "Эмоции и состояния",
    subtitle: "Feelings and States",
    description: "Happy, tired, hungry и другие слова, которые нужны в устных ответах.",
    accent: "#ff7cab",
    words: [
      option("happy", "счастливый"),
      option("sad", "грустный"),
      option("angry", "сердитый"),
      option("scared", "испуганный"),
      option("tired", "уставший"),
      option("sleepy", "сонный"),
      option("hungry", "голодный"),
      option("thirsty", "хочет пить"),
      option("excited", "взволнованный"),
      option("bored", "скучающий"),
    ],
  },
  {
    id: "vocab-summer",
    title: "Летний отдых",
    subtitle: "Summer Holidays",
    description: "Слова и фразы из тетради: поездки, одежда и отдых летом.",
    accent: "#ff8b73",
    words: [
      option("go camping", "ходить в поход"),
      option("go to the seaside", "ехать на море"),
      option("go to the mountains", "ехать в горы"),
      option("go to the lake", "ехать на озеро"),
      option("swimsuit", "купальник"),
      option("sunglasses", "солнцезащитные очки"),
      option("swimming trunks", "плавки"),
      option("sandals", "сандалии"),
      option("cap", "кепка"),
      option("jeans", "джинсы"),
    ],
  },
];

const allWords = topics.flatMap((topic) =>
  topic.words.map((word) => ({
    ...word,
    topicId: topic.id,
  }))
);

const buildWrongOptions = (word, topic) => {
  const localCandidates = shuffleWithSeed(
    topic.words.filter((candidate) => candidate.en !== word.en),
    `${topic.id}-${word.en}-local`
  );
  const globalCandidates = shuffleWithSeed(
    allWords.filter(
      (candidate) => candidate.en !== word.en && candidate.ru !== word.ru
    ),
    `${topic.id}-${word.en}-global`
  );
  const uniqueWrongOptions = [];

  [...localCandidates, ...globalCandidates].forEach((candidate) => {
    if (
      uniqueWrongOptions.length < 3 &&
      !uniqueWrongOptions.some((item) => item.ru === candidate.ru)
    ) {
      uniqueWrongOptions.push(option(candidate.en, candidate.ru));
    }
  });

  return uniqueWrongOptions;
};

const createVocabularyQuestion = (topic, word, index) => {
  const options = shuffleWithSeed(
    [option(word.en, word.ru), ...buildWrongOptions(word, topic)],
    `${topic.id}-${word.en}-options`
  );

  return {
    id: `${topic.id}-${String(index + 1).padStart(2, "0")}`,
    prompt: {
      en: word.en,
      ru: word.ru,
    },
    options,
    correctIndex: options.findIndex((item) => item.ru === word.ru),
    explanation: {
      correct: `${word.en} переводится как «${word.ru}».`,
      incorrect: `Запомни: ${word.en} значит «${word.ru}».`,
    },
  };
};

const sections = topics.map((topic) => {
  const questions = topic.words.map((word, index) =>
    createVocabularyQuestion(topic, word, index)
  );

  return {
    ...topic,
    type: "vocabulary",
    questionCount: questions.length,
    questions,
  };
});

export const vocabularyBank = {
  version: "1.0.0",
  totalSections: sections.length,
  totalQuestions: sections.reduce((sum, section) => sum + section.questionCount, 0),
  sections,
};
