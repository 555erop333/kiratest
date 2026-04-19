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
      option("farmer", "фермер"),
      option("artist", "художник"),
      option("singer", "певец"),
      option("actor", "актёр"),
      option("dentist", "стоматолог"),
      option("waiter", "официант"),
      option("postman", "почтальон"),
      option("football player", "футболист"),
      option("mechanic", "механик"),
      option("reporter", "репортёр"),
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
      option("bank", "банк"),
      option("post office", "почта"),
      option("bus stop", "автобусная остановка"),
      option("supermarket", "супермаркет"),
      option("market", "рынок"),
      option("swimming pool", "бассейн"),
      option("stadium", "стадион"),
      option("street", "улица"),
      option("square", "площадь"),
      option("train station", "вокзал"),
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
      option("a glass of juice", "стакан сока"),
      option("a plate of salad", "тарелка салата"),
      option("a piece of cake", "кусок торта"),
      option("a kilo of apples", "килограмм яблок"),
      option("a bag of sweets", "пакет конфет"),
      option("a cup of coffee", "чашка кофе"),
      option("a bottle of milk", "бутылка молока"),
      option("a packet of rice", "пачка риса"),
      option("a jar of honey", "банка мёда"),
      option("a box of chocolates", "коробка конфет"),
    ],
  },
  {
    id: "vocab-room",
    title: "Предметы в комнате",
    subtitle: "Things in a Room",
    description: "Самые очевидные предметы дома и в комнате: мебель, техника и вещи вокруг нас.",
    accent: "#7ad3b6",
    words: [
      option("bath", "ванна"),
      option("sink", "раковина"),
      option("mirror", "зеркало"),
      option("computer", "компьютер"),
      option("armchair", "кресло"),
      option("fridge", "холодильник"),
      option("wardrobe", "шкаф"),
      option("chair", "стул"),
      option("bed", "кровать"),
      option("table", "стол"),
      option("sofa", "диван"),
      option("lamp", "лампа"),
      option("window", "окно"),
      option("door", "дверь"),
      option("shelf", "полка"),
      option("TV", "телевизор"),
      option("desk", "письменный стол"),
      option("carpet", "ковёр"),
      option("clock", "часы"),
      option("cupboard", "буфет"),
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
      option("matches", "спички"),
      option("camera", "фотоаппарат"),
      option("hat", "шляпа"),
      option("water bottle", "бутылка для воды"),
      option("pan", "сковорода"),
      option("soap", "мыло"),
      option("towel", "полотенце"),
      option("radio", "радио"),
      option("first aid kit", "аптечка"),
      option("pillow", "подушка"),
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
      option("crawl", "ползать"),
      option("dance", "танцевать"),
      option("skate", "кататься на коньках"),
      option("ski", "кататься на лыжах"),
      option("throw", "бросать"),
      option("catch", "ловить"),
      option("carry", "нести"),
      option("push", "толкать"),
      option("pull", "тянуть"),
      option("turn", "поворачивать"),
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
      option("ill", "больной"),
      option("fine", "в порядке"),
      option("glad", "радостный"),
      option("worried", "встревоженный"),
      option("surprised", "удивлённый"),
      option("cold", "замёрзший"),
      option("hot", "жарко"),
      option("busy", "занятый"),
      option("calm", "спокойный"),
      option("upset", "расстроенный"),
    ],
  },
  {
    id: "vocab-question-words",
    title: "Вопросительные слова",
    subtitle: "Question Words",
    description: "Популярные вопросительные слова и фразы: who, what, where, when, how many и другие.",
    accent: "#70b8ff",
    words: [
      option("who", "кто"),
      option("what", "что"),
      option("where", "где"),
      option("when", "когда"),
      option("why", "почему"),
      option("how", "как"),
      option("which", "какой из"),
      option("whose", "чей"),
      option("how many", "сколько штук"),
      option("how much", "сколько, как много"),
      option("what time", "во сколько"),
      option("how old", "сколько лет"),
      option("how often", "как часто"),
      option("what colour", "какого цвета"),
      option("what kind of", "какого вида"),
      option("how far", "как далеко"),
      option("how long", "как долго"),
      option("how soon", "как скоро"),
      option("what for", "зачем"),
      option("which one", "который именно"),
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
      option("T-shirt", "футболка"),
      option("shorts", "шорты"),
      option("beach", "пляж"),
      option("sea", "море"),
      option("sun hat", "панама"),
      option("sun cream", "солнцезащитный крем"),
      option("shell", "ракушка"),
      option("bucket", "ведёрко"),
      option("spade", "лопатка"),
      option("boat", "лодка"),
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

const createVocabularyQuestion = (topic, word, index, direction = "en-ru") => {
  const isReverse = direction === "ru-en";
  const options = shuffleWithSeed(
    [option(word.en, word.ru), ...buildWrongOptions(word, topic)],
    isReverse
      ? `${topic.id}-${word.en}-reverse-options`
      : `${topic.id}-${word.en}-options`
  );

  return {
    id: isReverse
      ? `${topic.id}-reverse-${String(index + 1).padStart(2, "0")}`
      : `${topic.id}-${String(index + 1).padStart(2, "0")}`,
    direction,
    prompt: {
      en: word.en,
      ru: word.ru,
    },
    options,
    correctIndex: options.findIndex((item) => item.ru === word.ru),
    explanation: {
      correct: isReverse
        ? `«${word.ru}» по-английски будет ${word.en}.`
        : `${word.en} переводится как «${word.ru}».`,
      incorrect: isReverse
        ? `Запомни: «${word.ru}» по-английски — ${word.en}.`
        : `Запомни: ${word.en} значит «${word.ru}».`,
    },
  };
};

const sections = topics.map((topic) => {
  const questions = [
    ...topic.words.map((word, index) =>
      createVocabularyQuestion(topic, word, index)
    ),
    ...topic.words.map((word, index) =>
      createVocabularyQuestion(topic, word, index, "ru-en")
    ),
  ];

  return {
    ...topic,
    type: "vocabulary",
    wordCount: topic.words.length,
    questionCount: questions.length,
    questions,
  };
});

export const vocabularyBank = {
  version: "1.1.0",
  totalSections: sections.length,
  totalWords: sections.reduce((sum, section) => sum + section.wordCount, 0),
  totalQuestions: sections.reduce((sum, section) => sum + section.questionCount, 0),
  sections,
};
