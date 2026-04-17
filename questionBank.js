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

const createQuestion = (
  promptEn,
  promptRu,
  options,
  correctIndex,
  correctExplanation,
  incorrectExplanation
) => ({
  prompt: {
    en: promptEn,
    ru: promptRu,
  },
  options,
  correctIndex,
  explanation: {
    correct: correctExplanation,
    incorrect: incorrectExplanation,
  },
});

const dedupeQuestions = (questions) => {
  const seen = new Set();

  return questions.filter((question) => {
    const key = `${question.prompt.en}|${question.prompt.ru}|${question.options
      .map((item) => item.en)
      .join("|")}`;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
};

const finalizeSection = (section) => {
  if (section.questions.length < 100) {
    throw new Error(
      `Section "${section.id}" generated only ${section.questions.length} questions.`
    );
  }

  const selectedQuestions = shuffleWithSeed(
    section.questions,
    `${section.id}-questions`
  )
    .slice(0, 100)
    .map((question, index) => {
      const id = `${section.id}-${String(index + 1).padStart(3, "0")}`;
      const preparedOptions = question.options.map((item, optionIndex) => ({
        item,
        optionIndex,
      }));
      const shuffledOptions = shuffleWithSeed(preparedOptions, id);

      return {
        id,
        prompt: question.prompt,
        options: shuffledOptions.map(({ item }) => item),
        correctIndex: shuffledOptions.findIndex(
          ({ optionIndex }) => optionIndex === question.correctIndex
        ),
        explanation: question.explanation,
      };
    });

  return {
    ...section,
    questionCount: selectedQuestions.length,
    questions: selectedQuestions,
  };
};

const singularSubjects = [
  { en: "Mia", ru: "Мия", be: "is", do: "does", negativeDo: "doesn't", negativeBe: "isn't" },
  { en: "Nina", ru: "Нина", be: "is", do: "does", negativeDo: "doesn't", negativeBe: "isn't" },
  { en: "Max", ru: "Макс", be: "is", do: "does", negativeDo: "doesn't", negativeBe: "isn't" },
  { en: "Leo", ru: "Лео", be: "is", do: "does", negativeDo: "doesn't", negativeBe: "isn't" },
  { en: "My brother", ru: "Мой брат", be: "is", do: "does", negativeDo: "doesn't", negativeBe: "isn't" },
  { en: "My sister", ru: "Моя сестра", be: "is", do: "does", negativeDo: "doesn't", negativeBe: "isn't" },
  { en: "Dad", ru: "Папа", be: "is", do: "does", negativeDo: "doesn't", negativeBe: "isn't" },
  { en: "Mom", ru: "Мама", be: "is", do: "does", negativeDo: "doesn't", negativeBe: "isn't" },
  { en: "The cat", ru: "Кот", be: "is", do: "does", negativeDo: "doesn't", negativeBe: "isn't" },
  { en: "The dog", ru: "Собака", be: "is", do: "does", negativeDo: "doesn't", negativeBe: "isn't" },
  { en: "Our teacher", ru: "Наша учительница", be: "is", do: "does", negativeDo: "doesn't", negativeBe: "isn't" },
  { en: "Grandpa", ru: "Дедушка", be: "is", do: "does", negativeDo: "doesn't", negativeBe: "isn't" },
];

const pluralSubjects = [
  { en: "I", ru: "Я", be: "am", do: "do", negativeDo: "don't", negativeBe: "am not" },
  { en: "We", ru: "Мы", be: "are", do: "do", negativeDo: "don't", negativeBe: "aren't" },
  { en: "They", ru: "Они", be: "are", do: "do", negativeDo: "don't", negativeBe: "aren't" },
  { en: "My friends", ru: "Мои друзья", be: "are", do: "do", negativeDo: "don't", negativeBe: "aren't" },
  { en: "Tom and Ben", ru: "Том и Бен", be: "are", do: "do", negativeDo: "don't", negativeBe: "aren't" },
  { en: "The girls", ru: "Девочки", be: "are", do: "do", negativeDo: "don't", negativeBe: "aren't" },
  { en: "The boys", ru: "Мальчики", be: "are", do: "do", negativeDo: "don't", negativeBe: "aren't" },
  { en: "My parents", ru: "Мои родители", be: "are", do: "do", negativeDo: "don't", negativeBe: "aren't" },
];

const studySingularSubjects = singularSubjects.filter(
  ({ en }) => en !== "The cat" && en !== "The dog"
);

const studyPluralSubjects = pluralSubjects;

const getRuFutureAuxiliary = (subject) => {
  if (subject.en === "I") {
    return "буду";
  }

  if (subject.en === "We") {
    return "будем";
  }

  if (subject.be === "are") {
    return "будут";
  }

  return "будет";
};

const getRuNegativeFutureAuxiliary = (subject) => {
  if (subject.en === "I") {
    return "не буду";
  }

  if (subject.en === "We") {
    return "не будем";
  }

  if (subject.be === "are") {
    return "не будут";
  }

  return "не будет";
};

const timeTail = [
  { en: "every day", ru: "каждый день" },
  { en: "after school", ru: "после школы" },
  { en: "in the evening", ru: "вечером" },
  { en: "on Sundays", ru: "по воскресеньям" },
  { en: "before breakfast", ru: "до завтрака" },
  { en: "after dinner", ru: "после ужина" },
];

const futureTail = [
  { en: "tomorrow", ru: "завтра" },
  { en: "next week", ru: "на следующей неделе" },
  { en: "tomorrow morning", ru: "завтра утром" },
  { en: "this evening", ru: "сегодня вечером" },
  { en: "next weekend", ru: "в следующие выходные" },
  { en: "in two days", ru: "через два дня" },
];

const pastTail = [
  { en: "yesterday", ru: "вчера" },
  { en: "last night", ru: "прошлой ночью" },
  { en: "last Sunday", ru: "в прошлое воскресенье" },
  { en: "yesterday afternoon", ru: "вчера днём" },
  { en: "two days ago", ru: "два дня назад" },
  { en: "last weekend", ru: "в прошлые выходные" },
];

const activityPhrases = [
  { base: "play football", third: "plays football", ing: "playing football", past: "played football", ruBase: "играть в футбол", ruThird: "играет в футбол", ruIng: "играет в футбол", ruPast: "играл(а) в футбол" },
  { base: "read comics", third: "reads comics", ing: "reading comics", past: "read comics", ruBase: "читать комиксы", ruThird: "читает комиксы", ruIng: "читает комиксы", ruPast: "читал(а) комиксы" },
  { base: "do homework", third: "does homework", ing: "doing homework", past: "did homework", ruBase: "делать домашнюю работу", ruThird: "делает домашнюю работу", ruIng: "делает домашнюю работу", ruPast: "сделал(а) домашнюю работу" },
  { base: "make breakfast", third: "makes breakfast", ing: "making breakfast", past: "made breakfast", ruBase: "готовить завтрак", ruThird: "готовит завтрак", ruIng: "готовит завтрак", ruPast: "приготовил(а) завтрак" },
  { base: "ride a bike", third: "rides a bike", ing: "riding a bike", past: "rode a bike", ruBase: "кататься на велосипеде", ruThird: "катается на велосипеде", ruIng: "катается на велосипеде", ruPast: "катался(ась) на велосипеде" },
  { base: "visit grandma", third: "visits grandma", ing: "visiting grandma", past: "visited grandma", ruBase: "навещать бабушку", ruThird: "навещает бабушку", ruIng: "навещает бабушку", ruPast: "навестил(а) бабушку" },
  { base: "feed the cat", third: "feeds the cat", ing: "feeding the cat", past: "fed the cat", ruBase: "кормить кота", ruThird: "кормит кота", ruIng: "кормит кота", ruPast: "покормил(а) кота" },
  { base: "clean the room", third: "cleans the room", ing: "cleaning the room", past: "cleaned the room", ruBase: "убирать комнату", ruThird: "убирает комнату", ruIng: "убирает комнату", ruPast: "убрал(а) комнату" },
  { base: "watch cartoons", third: "watches cartoons", ing: "watching cartoons", past: "watched cartoons", ruBase: "смотреть мультфильмы", ruThird: "смотрит мультфильмы", ruIng: "смотрит мультфильмы", ruPast: "смотрел(а) мультфильмы" },
  { base: "draw a picture", third: "draws a picture", ing: "drawing a picture", past: "drew a picture", ruBase: "рисовать картинку", ruThird: "рисует картинку", ruIng: "рисует картинку", ruPast: "нарисовал(а) картинку" },
  { base: "pack a backpack", third: "packs a backpack", ing: "packing a backpack", past: "packed a backpack", ruBase: "собирать рюкзак", ruThird: "собирает рюкзак", ruIng: "собирает рюкзак", ruPast: "собрал(а) рюкзак" },
  { base: "wear boots", third: "wears boots", ing: "wearing boots", past: "wore boots", ruBase: "носить ботинки", ruThird: "носит ботинки", ruIng: "носит ботинки", ruPast: "надел(а) ботинки" },
  { base: "help Mom", third: "helps Mom", ing: "helping Mom", past: "helped Mom", ruBase: "помогать маме", ruThird: "помогает маме", ruIng: "помогает маме", ruPast: "помог(ла) маме" },
  { base: "open the window", third: "opens the window", ing: "opening the window", past: "opened the window", ruBase: "открывать окно", ruThird: "открывает окно", ruIng: "открывает окно", ruPast: "открыл(а) окно" },
  { base: "water the flowers", third: "waters the flowers", ing: "watering the flowers", past: "watered the flowers", ruBase: "поливать цветы", ruThird: "поливает цветы", ruIng: "поливает цветы", ruPast: "полил(а) цветы" },
  { base: "sing a song", third: "sings a song", ing: "singing a song", past: "sang a song", ruBase: "петь песню", ruThird: "поёт песню", ruIng: "поёт песню", ruPast: "спел(а) песню" },
  { base: "buy apples", third: "buys apples", ing: "buying apples", past: "bought apples", ruBase: "покупать яблоки", ruThird: "покупает яблоки", ruIng: "покупает яблоки", ruPast: "купил(а) яблоки" },
  { base: "write in a notebook", third: "writes in a notebook", ing: "writing in a notebook", past: "wrote in a notebook", ruBase: "писать в тетради", ruThird: "пишет в тетради", ruIng: "пишет в тетради", ruPast: "писал(а) в тетради" },
  { base: "have lunch", third: "has lunch", ing: "having lunch", past: "had lunch", ruBase: "обедать", ruThird: "обедает", ruIng: "обедает", ruPast: "пообедал(а)" },
  { base: "run in the park", third: "runs in the park", ing: "running in the park", past: "ran in the park", ruBase: "бегать в парке", ruThird: "бегает в парке", ruIng: "бегает в парке", ruPast: "бегал(а) в парке" },
  { base: "wash the dishes", third: "washes the dishes", ing: "washing the dishes", past: "washed the dishes", ruBase: "мыть посуду", ruThird: "моет посуду", ruIng: "моет посуду", ruPast: "помыл(а) посуду" },
  { base: "walk to school", third: "walks to school", ing: "walking to school", past: "walked to school", ruBase: "ходить в школу пешком", ruThird: "ходит в школу пешком", ruIng: "идёт в школу пешком", ruPast: "шёл(шла) в школу пешком" },
  { base: "carry a bag", third: "carries a bag", ing: "carrying a bag", past: "carried a bag", ruBase: "нести сумку", ruThird: "несёт сумку", ruIng: "несёт сумку", ruPast: "нёс(несла) сумку" },
  { base: "call grandma", third: "calls grandma", ing: "calling grandma", past: "called grandma", ruBase: "звонить бабушке", ruThird: "звонит бабушке", ruIng: "звонит бабушке", ruPast: "позвонил(а) бабушке" },
];

const comparisonAdjectives = [
  { base: "small", comparative: "smaller", superlative: "smallest", ruBase: "маленький", ruComp: "меньше", ruSuper: "самый маленький", kind: "thing", wrongComp: "more small", wrongSuper: "most small" },
  { base: "big", comparative: "bigger", superlative: "biggest", ruBase: "большой", ruComp: "больше", ruSuper: "самый большой", kind: "thing", wrongComp: "more big", wrongSuper: "most big" },
  { base: "tall", comparative: "taller", superlative: "tallest", ruBase: "высокий", ruComp: "выше", ruSuper: "самый высокий", kind: "person", wrongComp: "more tall", wrongSuper: "most tall" },
  { base: "short", comparative: "shorter", superlative: "shortest", ruBase: "низкий", ruComp: "ниже", ruSuper: "самый низкий", kind: "person", wrongComp: "more short", wrongSuper: "most short" },
  { base: "fast", comparative: "faster", superlative: "fastest", ruBase: "быстрый", ruComp: "быстрее", ruSuper: "самый быстрый", kind: "both", wrongComp: "more fast", wrongSuper: "most fast" },
  { base: "slow", comparative: "slower", superlative: "slowest", ruBase: "медленный", ruComp: "медленнее", ruSuper: "самый медленный", kind: "both", wrongComp: "more slow", wrongSuper: "most slow" },
  { base: "happy", comparative: "happier", superlative: "happiest", ruBase: "счастливый", ruComp: "счастливее", ruSuper: "самый счастливый", kind: "person", wrongComp: "more happy", wrongSuper: "most happy" },
  { base: "funny", comparative: "funnier", superlative: "funniest", ruBase: "смешной", ruComp: "смешнее", ruSuper: "самый смешной", kind: "person", wrongComp: "more funny", wrongSuper: "most funny" },
  { base: "busy", comparative: "busier", superlative: "busiest", ruBase: "занятой", ruComp: "более занятый", ruSuper: "самый занятый", kind: "person", wrongComp: "more busy", wrongSuper: "most busy" },
  { base: "noisy", comparative: "noisier", superlative: "noisiest", ruBase: "шумный", ruComp: "шумнее", ruSuper: "самый шумный", kind: "both", wrongComp: "more noisy", wrongSuper: "most noisy" },
  { base: "strong", comparative: "stronger", superlative: "strongest", ruBase: "сильный", ruComp: "сильнее", ruSuper: "самый сильный", kind: "person", wrongComp: "more strong", wrongSuper: "most strong" },
  { base: "bright", comparative: "brighter", superlative: "brightest", ruBase: "яркий", ruComp: "ярче", ruSuper: "самый яркий", kind: "thing", wrongComp: "more bright", wrongSuper: "most bright" },
  { base: "warm", comparative: "warmer", superlative: "warmest", ruBase: "тёплый", ruComp: "теплее", ruSuper: "самый тёплый", kind: "thing", wrongComp: "more warm", wrongSuper: "most warm" },
  { base: "cold", comparative: "colder", superlative: "coldest", ruBase: "холодный", ruComp: "холоднее", ruSuper: "самый холодный", kind: "thing", wrongComp: "more cold", wrongSuper: "most cold" },
  { base: "kind", comparative: "kinder", superlative: "kindest", ruBase: "добрый", ruComp: "добрее", ruSuper: "самый добрый", kind: "person", wrongComp: "more kind", wrongSuper: "most kind" },
  { base: "young", comparative: "younger", superlative: "youngest", ruBase: "молодой", ruComp: "моложе", ruSuper: "самый молодой", kind: "person", wrongComp: "more young", wrongSuper: "most young" },
  { base: "old", comparative: "older", superlative: "oldest", ruBase: "старый", ruComp: "старше", ruSuper: "самый старший", kind: "person", wrongComp: "more old", wrongSuper: "most old" },
  { base: "clean", comparative: "cleaner", superlative: "cleanest", ruBase: "чистый", ruComp: "чище", ruSuper: "самый чистый", kind: "thing", wrongComp: "more clean", wrongSuper: "most clean" },
  { base: "heavy", comparative: "heavier", superlative: "heaviest", ruBase: "тяжёлый", ruComp: "тяжелее", ruSuper: "самый тяжёлый", kind: "thing", wrongComp: "more heavy", wrongSuper: "most heavy" },
  { base: "easy", comparative: "easier", superlative: "easiest", ruBase: "лёгкий", ruComp: "легче", ruSuper: "самый лёгкий", kind: "thing", wrongComp: "more easy", wrongSuper: "most easy" },
  { base: "good", comparative: "better", superlative: "best", ruBase: "хороший", ruComp: "лучше", ruSuper: "самый лучший", kind: "both", wrongComp: "gooder", wrongSuper: "goodest" },
  { base: "bad", comparative: "worse", superlative: "worst", ruBase: "плохой", ruComp: "хуже", ruSuper: "самый плохой", kind: "both", wrongComp: "badder", wrongSuper: "baddest" },
];

const comparisonContextPools = {
  people: [
    { leftEn: "Mia", leftRu: "Мия", rightEn: "Nina", rightRu: "Нина" },
    { leftEn: "Max", leftRu: "Макс", rightEn: "Leo", rightRu: "Лео" },
    { leftEn: "My brother", leftRu: "Мой брат", rightEn: "my cousin", rightRu: "мой двоюродный брат" },
    { leftEn: "Dad", leftRu: "Папа", rightEn: "Uncle Sam", rightRu: "дядя Сэм" },
    { leftEn: "Our teacher", leftRu: "Наша учительница", rightEn: "the new teacher", rightRu: "новая учительница" },
    { leftEn: "Grandpa", leftRu: "Дедушка", rightEn: "Dad", rightRu: "папа" },
    { leftEn: "The clown", leftRu: "Клоун", rightEn: "the actor", rightRu: "актёр" },
    { leftEn: "My sister", leftRu: "Моя сестра", rightEn: "me", rightRu: "меня" },
  ],
  sizeThings: [
    { leftEn: "This bike", leftRu: "Этот велосипед", rightEn: "that scooter", rightRu: "тот самокат" },
    { leftEn: "This tent", leftRu: "Эта палатка", rightEn: "that tent", rightRu: "та палатка" },
    { leftEn: "This sleeping bag", leftRu: "Этот спальный мешок", rightEn: "that blanket", rightRu: "то одеяло" },
    { leftEn: "This backpack", leftRu: "Этот рюкзак", rightEn: "that bag", rightRu: "та сумка" },
    { leftEn: "This snowball", leftRu: "Этот снежок", rightEn: "that stone", rightRu: "тот камень" },
  ],
  movementThings: [
    { leftEn: "This bike", leftRu: "Этот велосипед", rightEn: "that scooter", rightRu: "тот самокат" },
    { leftEn: "The puppy", leftRu: "Щенок", rightEn: "the kitten", rightRu: "котёнок" },
    { leftEn: "The tiger", leftRu: "Тигр", rightEn: "the fox", rightRu: "лиса" },
    { leftEn: "Max", leftRu: "Макс", rightEn: "Leo", rightRu: "Лео" },
  ],
  lightThings: [
    { leftEn: "This lamp", leftRu: "Эта лампа", rightEn: "that candle", rightRu: "та свеча" },
    { leftEn: "This flashlight", leftRu: "Этот фонарик", rightEn: "that lantern", rightRu: "тот фонарь" },
    { leftEn: "This room", leftRu: "Эта комната", rightEn: "that room", rightRu: "та комната" },
  ],
  temperatureThings: [
    { leftEn: "This soup", leftRu: "Этот суп", rightEn: "that tea", rightRu: "тот чай" },
    { leftEn: "This tea", leftRu: "Этот чай", rightEn: "that juice", rightRu: "тот сок" },
  ],
  cleanThings: [
    { leftEn: "This room", leftRu: "Эта комната", rightEn: "that room", rightRu: "та комната" },
    { leftEn: "This backpack", leftRu: "Этот рюкзак", rightEn: "that bag", rightRu: "та сумка" },
    { leftEn: "This desk", leftRu: "Эта парта", rightEn: "that desk", rightRu: "та парта" },
  ],
  taskThings: [
    { leftEn: "This puzzle", leftRu: "Этот пазл", rightEn: "that task", rightRu: "то задание" },
    { leftEn: "This test", leftRu: "Этот тест", rightEn: "that exercise", rightRu: "то упражнение" },
    { leftEn: "This question", leftRu: "Этот вопрос", rightEn: "that question", rightRu: "тот вопрос" },
  ],
};

const superlativeContextPools = {
  people: [
    { subjectEn: "Mia", subjectRu: "Мия", placeEn: "in our class", placeRu: "в нашем классе" },
    { subjectEn: "Max", subjectRu: "Макс", placeEn: "in the football team", placeRu: "в футбольной команде" },
    { subjectEn: "Grandpa", subjectRu: "Дедушка", placeEn: "in our family", placeRu: "в нашей семье" },
    { subjectEn: "Our teacher", subjectRu: "Наша учительница", placeEn: "at school", placeRu: "в школе" },
    { subjectEn: "My sister", subjectRu: "Моя сестра", placeEn: "at the party", placeRu: "на празднике" },
    { subjectEn: "The clown", subjectRu: "Клоун", placeEn: "in the show", placeRu: "в шоу" },
    { subjectEn: "Dad", subjectRu: "Папа", placeEn: "on the team", placeRu: "в команде" },
    { subjectEn: "Nina", subjectRu: "Нина", placeEn: "in the art club", placeRu: "в кружке рисования" },
  ],
  sizeThings: [
    { subjectEn: "This bike", subjectRu: "Этот велосипед", placeEn: "in the race", placeRu: "в гонке" },
    { subjectEn: "This tent", subjectRu: "Эта палатка", placeEn: "in the shop", placeRu: "в магазине" },
    { subjectEn: "This sleeping bag", subjectRu: "Этот спальный мешок", placeEn: "in the camp", placeRu: "в лагере" },
    { subjectEn: "This backpack", subjectRu: "Этот рюкзак", placeEn: "of all the bags", placeRu: "из всех сумок" },
    { subjectEn: "This snowball", subjectRu: "Этот снежок", placeEn: "in the yard", placeRu: "во дворе" },
  ],
  movementThings: [
    { subjectEn: "This bike", subjectRu: "Этот велосипед", placeEn: "in the race", placeRu: "в гонке" },
    { subjectEn: "The puppy", subjectRu: "Щенок", placeEn: "in the yard", placeRu: "во дворе" },
    { subjectEn: "The tiger", subjectRu: "Тигр", placeEn: "in the zoo", placeRu: "в зоопарке" },
    { subjectEn: "Max", subjectRu: "Макс", placeEn: "on the team", placeRu: "в команде" },
  ],
  lightThings: [
    { subjectEn: "This lamp", subjectRu: "Эта лампа", placeEn: "in the room", placeRu: "в комнате" },
    { subjectEn: "This flashlight", subjectRu: "Этот фонарик", placeEn: "in the tent", placeRu: "в палатке" },
    { subjectEn: "This room", subjectRu: "Эта комната", placeEn: "in the house", placeRu: "в доме" },
  ],
  temperatureThings: [
    { subjectEn: "This soup", subjectRu: "Этот суп", placeEn: "on the table", placeRu: "на столе" },
    { subjectEn: "This tea", subjectRu: "Этот чай", placeEn: "in the teapot", placeRu: "в чайнике" },
  ],
  cleanThings: [
    { subjectEn: "This room", subjectRu: "Эта комната", placeEn: "in the house", placeRu: "в доме" },
    { subjectEn: "This backpack", subjectRu: "Этот рюкзак", placeEn: "in the camp", placeRu: "в лагере" },
    { subjectEn: "This desk", subjectRu: "Эта парта", placeEn: "in the classroom", placeRu: "в классе" },
  ],
  taskThings: [
    { subjectEn: "This puzzle", subjectRu: "Этот пазл", placeEn: "in the box", placeRu: "в коробке" },
    { subjectEn: "This test", subjectRu: "Этот тест", placeEn: "in our class", placeRu: "в нашем классе" },
    { subjectEn: "This exercise", subjectRu: "Это упражнение", placeEn: "in the workbook", placeRu: "в рабочей тетради" },
  ],
};

const comparisonContextPoolByAdjective = {
  small: "sizeThings",
  big: "sizeThings",
  tall: "people",
  short: "people",
  fast: "movementThings",
  slow: "movementThings",
  happy: "people",
  funny: "people",
  busy: "people",
  noisy: "people",
  strong: "people",
  bright: "lightThings",
  warm: "temperatureThings",
  cold: "temperatureThings",
  kind: "people",
  young: "people",
  old: "people",
  clean: "cleanThings",
  heavy: "sizeThings",
  easy: "taskThings",
  good: "taskThings",
  bad: "taskThings",
};

const superlativeContextPoolByAdjective = {
  small: "sizeThings",
  big: "sizeThings",
  tall: "people",
  short: "people",
  fast: "movementThings",
  slow: "movementThings",
  happy: "people",
  funny: "people",
  busy: "people",
  noisy: "people",
  strong: "people",
  bright: "lightThings",
  warm: "temperatureThings",
  cold: "temperatureThings",
  kind: "people",
  young: "people",
  old: "people",
  clean: "cleanThings",
  heavy: "sizeThings",
  easy: "taskThings",
  good: "taskThings",
  bad: "taskThings",
};

const countableQuantifierQuestions = [
  { promptEn: "How ___ apples are there in the basket?", promptRu: "Сколько яблок в корзине?" },
  { promptEn: "How ___ books are there in the bag?", promptRu: "Сколько книг в сумке?" },
  { promptEn: "How ___ stars can you see in the sky?", promptRu: "Сколько звёзд ты видишь в небе?" },
  { promptEn: "How ___ tents are there at the camp?", promptRu: "Сколько палаток в лагере?" },
  { promptEn: "How ___ boots are near the door?", promptRu: "Сколько ботинок у двери?" },
  { promptEn: "How ___ pencils are in the box?", promptRu: "Сколько карандашей в коробке?" },
  { promptEn: "How ___ stickers are on the notebook?", promptRu: "Сколько наклеек на тетради?" },
  { promptEn: "How ___ cookies are on the plate?", promptRu: "Сколько печений на тарелке?" },
  { promptEn: "How ___ questions are in this test?", promptRu: "Сколько вопросов в этом тесте?" },
  { promptEn: "How ___ balloons are in the room?", promptRu: "Сколько воздушных шаров в комнате?" },
  { promptEn: "How ___ shells are on the beach?", promptRu: "Сколько ракушек на пляже?" },
  { promptEn: "How ___ sandwiches are in the lunchbox?", promptRu: "Сколько бутербродов в ланчбоксе?" },
  { promptEn: "How ___ rabbits are in the picture?", promptRu: "Сколько кроликов на картинке?" },
  { promptEn: "How ___ comics are on the shelf?", promptRu: "Сколько комиксов на полке?" },
  { promptEn: "How ___ crayons are in the pencil case?", promptRu: "Сколько мелков в пенале?" },
];

const uncountableQuantifierQuestions = [
  { promptEn: "How ___ milk is there in the glass?", promptRu: "Сколько молока в стакане?" },
  { promptEn: "How ___ water is there in the bottle?", promptRu: "Сколько воды в бутылке?" },
  { promptEn: "How ___ juice is there in the cup?", promptRu: "Сколько сока в чашке?" },
  { promptEn: "How ___ rice is there in the bowl?", promptRu: "Сколько риса в миске?" },
  { promptEn: "How ___ sugar is there in the jar?", promptRu: "Сколько сахара в банке?" },
  { promptEn: "How ___ snow is there in the yard?", promptRu: "Сколько снега во дворе?" },
  { promptEn: "How ___ homework do you have today?", promptRu: "Сколько у тебя сегодня домашней работы?" },
  { promptEn: "How ___ cheese is there in the sandwich?", promptRu: "Сколько сыра в бутерброде?" },
  { promptEn: "How ___ tea is there in the teapot?", promptRu: "Сколько чая в чайнике?" },
  { promptEn: "How ___ soup is there in the pot?", promptRu: "Сколько супа в кастрюле?" },
  { promptEn: "How ___ bread is there on the table?", promptRu: "Сколько хлеба на столе?" },
  { promptEn: "How ___ jam is there in the jar?", promptRu: "Сколько варенья в банке?" },
  { promptEn: "How ___ sand is there on the beach?", promptRu: "Сколько песка на пляже?" },
  { promptEn: "How ___ music is on your playlist?", promptRu: "Сколько музыки в твоём плейлисте?" },
  { promptEn: "How ___ air is there in the balloon?", promptRu: "Сколько воздуха в шарике?" },
];

const countableQuantifierStatements = [
  { promptEn: "We have ___ books on the shelf.", promptRu: "У нас на полке ___ книг." },
  { promptEn: "We have ___ crayons in the box.", promptRu: "У нас в коробке ___ мелков." },
  { promptEn: "We have ___ comics in our classroom.", promptRu: "У нас в классе ___ комиксов." },
  { promptEn: "We have ___ apples for the picnic.", promptRu: "У нас для пикника ___ яблок." },
  { promptEn: "We have ___ balloons for the party.", promptRu: "У нас для праздника ___ воздушных шаров." },
  { promptEn: "We have ___ sandwiches for lunch.", promptRu: "У нас на обед ___ бутербродов." },
  { promptEn: "We have ___ cookies for tea.", promptRu: "У нас к чаю ___ печений." },
  { promptEn: "We have ___ questions in this test.", promptRu: "В этом тесте ___ вопросов." },
  { promptEn: "We have ___ pencils on the desk.", promptRu: "У нас на парте ___ карандашей." },
  { promptEn: "We have ___ stickers in the album.", promptRu: "У нас в альбоме ___ наклеек." },
  { promptEn: "We have ___ tents at the camp.", promptRu: "У нас в лагере ___ палаток." },
  { promptEn: "We have ___ shells in the box.", promptRu: "У нас в коробке ___ ракушек." },
  { promptEn: "We have ___ rabbits in the picture.", promptRu: "У нас на картинке ___ кроликов." },
  { promptEn: "We have ___ stars on the poster.", promptRu: "У нас на плакате ___ звёзд." },
  { promptEn: "We have ___ boots by the door.", promptRu: "У нас у двери ___ ботинок." },
];

const uncountableQuantifierStatements = [
  { promptEn: "There is ___ water in the bottle.", promptRu: "В бутылке ___ воды." },
  { promptEn: "There is ___ soup in the pot.", promptRu: "В кастрюле ___ супа." },
  { promptEn: "There is ___ jam in the jar.", promptRu: "В банке ___ варенья." },
  { promptEn: "There is ___ cheese in the fridge.", promptRu: "В холодильнике ___ сыра." },
  { promptEn: "There is ___ tea in the teapot.", promptRu: "В чайнике ___ чая." },
  { promptEn: "There is ___ bread on the table.", promptRu: "На столе ___ хлеба." },
  { promptEn: "There is ___ sugar in the bowl.", promptRu: "В миске ___ сахара." },
  { promptEn: "There is ___ rice in the pot.", promptRu: "В кастрюле ___ риса." },
  { promptEn: "There is ___ milk in the fridge.", promptRu: "В холодильнике ___ молока." },
  { promptEn: "There is ___ sand on the beach.", promptRu: "На пляже ___ песка." },
  { promptEn: "There is ___ snow in the yard.", promptRu: "Во дворе ___ снега." },
  { promptEn: "There is ___ air in the balloon.", promptRu: "В шарике ___ воздуха." },
  { promptEn: "We have ___ homework today.", promptRu: "У нас сегодня ___ домашней работы." },
  { promptEn: "There is ___ juice in the glass.", promptRu: "В стакане ___ сока." },
  { promptEn: "There is ___ music on my playlist.", promptRu: "В моём плейлисте ___ музыки." },
];

const generateComparisonSection = () => {
  const questions = [];

  for (let index = 0; index < 50; index += 1) {
    const adjective = comparisonAdjectives[index % comparisonAdjectives.length];
    const pool =
      comparisonContextPools[comparisonContextPoolByAdjective[adjective.base]];
    const context = pool[index % pool.length];

    questions.push(
      createQuestion(
        `${context.leftEn} is ___ than ${context.rightEn}.`,
        `${context.leftRu} ___, чем ${context.rightRu}.`,
        [
          option(adjective.comparative, adjective.ruComp),
          option(adjective.base, adjective.ruBase),
          option(adjective.superlative, adjective.ruSuper),
          option(adjective.wrongComp, "неправильная форма"),
        ],
        0,
        `После than нужна сравнительная степень: ${adjective.comparative}.`,
        `После than используется сравнительная степень ${adjective.comparative}, а не другая форма.`
      )
    );
  }

  for (let index = 0; index < 50; index += 1) {
    const adjective = comparisonAdjectives[(index * 2) % comparisonAdjectives.length];
    const pool =
      superlativeContextPools[superlativeContextPoolByAdjective[adjective.base]];
    const context = pool[index % pool.length];
    const promptEn = `${context.subjectEn} is the ___ ${context.placeEn}.`;
    const promptRu = `${context.subjectRu} ___ ${context.placeRu}.`;

    questions.push(
      createQuestion(
        promptEn,
        promptRu,
        [
          option(adjective.superlative, adjective.ruSuper),
          option(adjective.comparative, adjective.ruComp),
          option(adjective.base, adjective.ruBase),
          option(adjective.wrongSuper, "неправильная форма"),
        ],
        0,
        `После the в таком сравнении нужна превосходная степень: ${adjective.superlative}.`,
        `Здесь сравнивают со всеми, поэтому нужна превосходная степень ${adjective.superlative}.`
      )
    );
  }

  return {
    id: "comparatives",
    title: "Степени сравнения",
    subtitle: "Comparatives & Superlatives",
    description: "Сравниваем предметы, людей и выбираем самую-самую форму.",
    accent: "#ff6fb4",
    questions,
  };
};

const generatePastSimpleSection = () => {
  const questions = [];

  for (let index = 0; index < 60; index += 1) {
    const subject =
      index % 2 === 0
        ? studySingularSubjects[index % studySingularSubjects.length]
        : studyPluralSubjects[index % studyPluralSubjects.length];
    const phrase = activityPhrases[(index * 2) % activityPhrases.length];
    const tail = pastTail[index % pastTail.length];

    questions.push(
      createQuestion(
        `${tail.en} ${subject.en} ___ .`,
        `${tail.ru} ${subject.ru} ___ .`,
        [
          option(phrase.past, phrase.ruPast),
          option(phrase.base, phrase.ruBase),
          option(phrase.third, phrase.ruThird),
          option(phrase.ing, phrase.ruIng),
        ],
        0,
        `Слово ${tail.en} подсказывает Past Simple, поэтому нужна форма ${phrase.past}.`,
        `После ${tail.en} нужен Past Simple: правильный вариант ${phrase.past}.`
      )
    );
  }

  for (let index = 0; index < 40; index += 1) {
    const subject =
      index % 2 === 0
        ? studySingularSubjects[(index * 3) % studySingularSubjects.length]
        : studyPluralSubjects[(index * 3) % studyPluralSubjects.length];
    const phrase = activityPhrases[(index * 5) % activityPhrases.length];
    const tail = pastTail[(index * 2) % pastTail.length];

    questions.push(
      createQuestion(
        `${tail.en} ${subject.en} didn't ___ .`,
        `${tail.ru} ${subject.ru} не ___ .`,
        [
          option(phrase.base, phrase.ruBase),
          option(phrase.past, phrase.ruPast),
          option(phrase.third, phrase.ruThird),
          option(phrase.ing, phrase.ruIng),
        ],
        0,
        `После didn't глагол остаётся в начальной форме: ${phrase.base}.`,
        `После didn't нельзя ставить прошедшую форму. Нужна начальная форма ${phrase.base}.`
      )
    );
  }

  return {
    id: "past-simple",
    title: "Прошедшее время",
    subtitle: "Past Simple",
    description: "Вспоминаем формы глаголов в прошлом и правило после didn't.",
    accent: "#7a89ff",
    questions,
  };
};

const signalWords = {
  presentSimple: [
    option("every day", "каждый день"),
    option("on Mondays", "по понедельникам"),
    option("after school", "после школы"),
    option("usually", "обычно"),
  ],
  presentContinuous: [
    option("now", "сейчас"),
    option("at the moment", "в данный момент"),
    option("right now", "прямо сейчас"),
    option("today", "сегодня"),
  ],
  pastSimple: [
    option("yesterday", "вчера"),
    option("last week", "на прошлой неделе"),
    option("two days ago", "два дня назад"),
    option("last night", "прошлой ночью"),
  ],
  future: [
    option("tomorrow", "завтра"),
    option("next week", "на следующей неделе"),
    option("soon", "скоро"),
    option("in two days", "через два дня"),
  ],
};

const generateSignalsSection = () => {
  const questions = [];

  for (let index = 0; index < 15; index += 1) {
    const subject = studySingularSubjects[index % studySingularSubjects.length];
    const phrase = activityPhrases[(index * 2) % activityPhrases.length];

    questions.push(
      createQuestion(
        `${subject.en} ${phrase.third} ___ .`,
        `${subject.ru} ${phrase.ruThird} ___ .`,
        [
          signalWords.presentSimple[index % signalWords.presentSimple.length],
          signalWords.presentContinuous[index % signalWords.presentContinuous.length],
          signalWords.pastSimple[index % signalWords.pastSimple.length],
          signalWords.future[index % signalWords.future.length],
        ],
        0,
        "Для Present Simple подходят слова-сигналы привычки: every day, usually и похожие.",
        "Здесь речь о привычке, поэтому нужен сигнал Present Simple."
      )
    );
  }

  for (let index = 0; index < 15; index += 1) {
    const subject =
      index % 2 === 0
        ? studySingularSubjects[(index * 3) % studySingularSubjects.length]
        : studyPluralSubjects[(index * 2) % studyPluralSubjects.length];
    const phrase = activityPhrases[(index * 4) % activityPhrases.length];

    questions.push(
      createQuestion(
        `Look! ${subject.en} ${subject.be} ${phrase.ing} ___ .`,
        `Смотри! ${subject.ru} ${phrase.ruIng} ___ .`,
        [
          signalWords.presentContinuous[index % signalWords.presentContinuous.length],
          signalWords.presentSimple[index % signalWords.presentSimple.length],
          signalWords.pastSimple[index % signalWords.pastSimple.length],
          signalWords.future[index % signalWords.future.length],
        ],
        0,
        "В Present Continuous часто встречаются now, right now, at the moment.",
        "Здесь действие идёт прямо сейчас, значит нужен сигнал Present Continuous."
      )
    );
  }

  for (let index = 0; index < 15; index += 1) {
    const subject =
      index % 2 === 0
        ? studySingularSubjects[(index * 5) % studySingularSubjects.length]
        : studyPluralSubjects[(index * 5) % studyPluralSubjects.length];
    const phrase = activityPhrases[(index * 6) % activityPhrases.length];

    questions.push(
      createQuestion(
        `${subject.en} ${phrase.past} ___ .`,
        `${subject.ru} ${phrase.ruPast} ___ .`,
        [
          signalWords.pastSimple[index % signalWords.pastSimple.length],
          signalWords.presentSimple[index % signalWords.presentSimple.length],
          signalWords.presentContinuous[index % signalWords.presentContinuous.length],
          signalWords.future[index % signalWords.future.length],
        ],
        0,
        "В Past Simple помогают слова yesterday, last week, two days ago.",
        "В предложении нужен сигнал прошедшего времени, а не настоящего или будущего."
      )
    );
  }

  for (let index = 0; index < 15; index += 1) {
    const subject =
      index % 2 === 0
        ? studySingularSubjects[(index * 7) % studySingularSubjects.length]
        : studyPluralSubjects[(index * 7) % studyPluralSubjects.length];
    const phrase = activityPhrases[(index * 3) % activityPhrases.length];
    const futureAuxiliaryRu = getRuFutureAuxiliary(subject);

    questions.push(
      createQuestion(
        `${subject.en} will ${phrase.base} ___ .`,
        `${subject.ru} ${futureAuxiliaryRu} ${phrase.ruBase} ___ .`,
        [
          signalWords.future[index % signalWords.future.length],
          signalWords.presentSimple[index % signalWords.presentSimple.length],
          signalWords.presentContinuous[index % signalWords.presentContinuous.length],
          signalWords.pastSimple[index % signalWords.pastSimple.length],
        ],
        0,
        "Будущее время любят tomorrow, next week, soon и похожие слова.",
        "Здесь говорится о будущем, поэтому нужен сигнал будущего времени."
      )
    );
  }

  for (let index = 0; index < 10; index += 1) {
    const subject =
      studySingularSubjects[(index * 2) % studySingularSubjects.length];
    const phrase = activityPhrases[(index * 4) % activityPhrases.length];

    questions.push(
      createQuestion(
        `___ ${subject.en} ${phrase.base} every day?`,
        "Выбери правильное слово для вопроса о привычке одного человека.",
        [option("Does", "ли"), option("Do", "ли"), option("Did", "ли"), option("Is", "ли")],
        0,
        "С he/she/it в вопросе Present Simple ставим Does.",
        "Для вопроса в Present Simple с одним человеком нужен Does."
      )
    );
  }

  for (let index = 0; index < 10; index += 1) {
    const subject = studyPluralSubjects[(index * 3) % studyPluralSubjects.length];
    const phrase = activityPhrases[(index * 5) % activityPhrases.length];

    questions.push(
      createQuestion(
        `___ ${subject.en} ${phrase.base} after school?`,
        "Выбери правильное слово для вопроса о привычке нескольких людей.",
        [option("Do", "ли"), option("Does", "ли"), option("Did", "ли"), option("Are", "ли")],
        0,
        "С I/you/we/they в вопросе Present Simple ставим Do.",
        "Здесь подлежащее множественного числа, поэтому нужен Do."
      )
    );
  }

  for (let index = 0; index < 10; index += 1) {
    const subject =
      index % 2 === 0
        ? studySingularSubjects[(index * 5) % studySingularSubjects.length]
        : studyPluralSubjects[(index * 2) % studyPluralSubjects.length];
    const phrase = activityPhrases[(index * 6) % activityPhrases.length];
    const correct = subject.be.charAt(0).toUpperCase() + subject.be.slice(1);

    questions.push(
      createQuestion(
        `___ ${subject.en} ${phrase.ing} now?`,
        "Выбери правильный вспомогательный глагол для вопроса о действии, которое идёт сейчас.",
        [
          option(correct, "правильный вспомогательный глагол"),
          option("Do", "делать"),
          option("Did", "сделал"),
          option(subject.do.charAt(0).toUpperCase() + subject.do.slice(1), "не тот глагол"),
        ],
        0,
        `В Present Continuous вопрос строится с ${correct}.`,
        "Для действия прямо сейчас нужен вопрос с am/is/are."
      )
    );
  }

  for (let index = 0; index < 5; index += 1) {
    const subject =
      index % 2 === 0
        ? studySingularSubjects[(index * 7) % studySingularSubjects.length]
        : studyPluralSubjects[(index * 7) % studyPluralSubjects.length];
    const phrase = activityPhrases[(index * 8) % activityPhrases.length];

    questions.push(
      createQuestion(
        `___ ${subject.en} ${phrase.base} yesterday?`,
        "Выбери правильное слово для вопроса о действии в прошлом.",
        [option("Did", "ли"), option("Do", "ли"), option("Does", "ли"), option("Was", "был")],
        0,
        "Вопрос в Past Simple начинается с Did.",
        "Слово yesterday подсказывает Past Simple, значит нужен Did."
      )
    );
  }

  for (let index = 0; index < 5; index += 1) {
    const subject =
      index % 2 === 0
        ? studySingularSubjects[(index * 9) % studySingularSubjects.length]
        : studyPluralSubjects[(index * 9) % studyPluralSubjects.length];
    const phrase = activityPhrases[(index * 9) % activityPhrases.length];

    questions.push(
      createQuestion(
        `___ ${subject.en} ${phrase.base} tomorrow?`,
        "Выбери правильное слово для вопроса о будущем действии.",
        [option("Will", "будет ли"), option("Did", "сделал ли"), option("Do", "делают ли"), option("Are", "они")],
        0,
        "Для простого вопроса о будущем времени ставим Will.",
        "Слово tomorrow показывает будущее, значит нужен Will."
      )
    );
  }

  return {
    id: "signals",
    title: "Слова-сигналы и вопросы",
    subtitle: "Signal Words & Questions",
    description: "Находим подсказки времени и вспоминаем, с чего начинается вопрос.",
    accent: "#6fd6ff",
    questions,
  };
};

const generatePresentSimpleSection = () => {
  const questions = [];

  for (let index = 0; index < 35; index += 1) {
    const subject = studySingularSubjects[index % studySingularSubjects.length];
    const phrase = activityPhrases[(index * 2) % activityPhrases.length];
    const tail = timeTail[index % timeTail.length];

    questions.push(
      createQuestion(
        `${subject.en} ___ ${tail.en}.`,
        `${subject.ru} ___ ${tail.ru}.`,
        [
          option(phrase.third, phrase.ruThird),
          option(phrase.base, phrase.ruBase),
          option(phrase.ing, phrase.ruIng),
          option(phrase.past, phrase.ruPast),
        ],
        0,
        "С he/she/it в Present Simple глагол получает окончание -s или особую форму.",
        `Здесь нужен Present Simple для одного человека, поэтому верно ${phrase.third}.`
      )
    );
  }

  for (let index = 0; index < 35; index += 1) {
    const subject = studyPluralSubjects[index % studyPluralSubjects.length];
    const phrase = activityPhrases[(index * 3) % activityPhrases.length];
    const tail = timeTail[(index * 2) % timeTail.length];

    questions.push(
      createQuestion(
        `${subject.en} ___ ${tail.en}.`,
        `${subject.ru} ___ ${tail.ru}.`,
        [
          option(phrase.base, phrase.ruBase),
          option(phrase.third, phrase.ruThird),
          option(phrase.ing, phrase.ruIng),
          option(phrase.past, phrase.ruPast),
        ],
        0,
        "С I/you/we/they в Present Simple используем начальную форму глагола.",
        `Здесь не нужен -s. Правильная форма: ${phrase.base}.`
      )
    );
  }

  for (let index = 0; index < 30; index += 1) {
    const subject =
      index % 2 === 0
        ? studySingularSubjects[(index * 4) % studySingularSubjects.length]
        : studyPluralSubjects[(index * 4) % studyPluralSubjects.length];
    const phrase = activityPhrases[(index * 5) % activityPhrases.length];
    const tail = timeTail[(index * 3) % timeTail.length];

    questions.push(
      createQuestion(
        `${subject.en} ${subject.negativeDo} ___ ${tail.en}.`,
        `${subject.ru} не ___ ${tail.ru}.`,
        [
          option(phrase.base, phrase.ruBase),
          option(phrase.third, phrase.ruThird),
          option(phrase.past, phrase.ruPast),
          option(phrase.ing, phrase.ruIng),
        ],
        0,
        `После ${subject.negativeDo} нужен обычный глагол без -s.`,
        `После ${subject.negativeDo} ставим начальную форму, поэтому нужен вариант ${phrase.base}.`
      )
    );
  }

  return {
    id: "present-simple",
    title: "Настоящее простое",
    subtitle: "Present Simple",
    description: "Тренируем привычки, распорядок дня и формы с do/does.",
    accent: "#ffa866",
    questions,
  };
};

const generatePresentContinuousSection = () => {
  const questions = [];

  for (let index = 0; index < 70; index += 1) {
    const subject =
      index % 2 === 0
        ? studySingularSubjects[index % studySingularSubjects.length]
        : studyPluralSubjects[index % studyPluralSubjects.length];
    const phrase = activityPhrases[(index * 2) % activityPhrases.length];

    questions.push(
      createQuestion(
        `${subject.en} ___ now.`,
        `${subject.ru} ___ сейчас.`,
        [
          option(`${subject.be} ${phrase.ing}`, phrase.ruIng),
          option(phrase.base, phrase.ruBase),
          option(phrase.third, phrase.ruThird),
          option(phrase.past, phrase.ruPast),
        ],
        0,
        `В Present Continuous нужна связка ${subject.be} + глагол с -ing.`,
        `Для действия прямо сейчас нужен вариант ${subject.be} ${phrase.ing}.`
      )
    );
  }

  for (let index = 0; index < 30; index += 1) {
    const subject =
      index % 2 === 0
        ? studySingularSubjects[(index * 4) % studySingularSubjects.length]
        : studyPluralSubjects[(index * 4) % studyPluralSubjects.length];
    const phrase = activityPhrases[(index * 5) % activityPhrases.length];

    questions.push(
      createQuestion(
        `${subject.en} ${subject.negativeBe} ___ at the moment.`,
        `${subject.ru} не ___ сейчас.`,
        [
          option(phrase.ing, phrase.ruIng),
          option(phrase.base, phrase.ruBase),
          option(phrase.third, phrase.ruThird),
          option(phrase.past, phrase.ruPast),
        ],
        0,
        `После ${subject.negativeBe} нужен глагол с окончанием -ing.`,
        `В отрицании Present Continuous после ${subject.negativeBe} ставим форму на -ing.`
      )
    );
  }

  return {
    id: "present-continuous",
    title: "Настоящее продолженное",
    subtitle: "Present Continuous",
    description: "Ловим действия, которые идут прямо сейчас: am/is/are + ing.",
    accent: "#5fd1a8",
    questions,
  };
};

const generateFutureSection = () => {
  const questions = [];

  for (let index = 0; index < 34; index += 1) {
    const subject =
      index % 2 === 0
        ? studySingularSubjects[index % studySingularSubjects.length]
        : studyPluralSubjects[index % studyPluralSubjects.length];
    const phrase = activityPhrases[(index * 3) % activityPhrases.length];
    const tail = futureTail[index % futureTail.length];
    const futureAuxiliaryRu = getRuFutureAuxiliary(subject);

    questions.push(
      createQuestion(
        `${subject.en} ___ ${phrase.base} ${tail.en}.`,
        `${subject.ru} ${futureAuxiliaryRu} ${phrase.ruBase} ${tail.ru}.`,
        [
          option("will", "будет"),
          option(subject.be, "есть"),
          option("did", "делал"),
          option(subject.do, "делает"),
        ],
        0,
        "Для простого решения или обещания в будущем ставим will + глагол.",
        "Здесь нужно будущее время, поэтому подходит только will."
      )
    );
  }

  for (let index = 0; index < 33; index += 1) {
    const subject =
      index % 2 === 0
        ? studySingularSubjects[(index * 2) % studySingularSubjects.length]
        : studyPluralSubjects[(index * 2) % studyPluralSubjects.length];
    const phrase = activityPhrases[(index * 4) % activityPhrases.length];
    const tail = futureTail[(index * 2) % futureTail.length];
    const correct = `${subject.be} going to`;
    const wrongBe =
      subject.be === "am" ? "is going to" : subject.be === "is" ? "are going to" : "is going to";
    const futureAuxiliaryRu = getRuFutureAuxiliary(subject);

    questions.push(
      createQuestion(
        `${subject.en} ___ ${phrase.base} ${tail.en}.`,
        `${subject.ru} ${futureAuxiliaryRu} ${phrase.ruBase} ${tail.ru}.`,
        [
          option(correct, "собирается"),
          option("will", "будет"),
          option(wrongBe, "не та форма"),
          option("did", "делал"),
        ],
        0,
        `Для запланированного действия используем ${subject.be} going to + глагол.`,
        `Здесь нужен план на будущее: ${correct} ${phrase.base}.`
      )
    );
  }

  for (let index = 0; index < 33; index += 1) {
    const subject =
      index % 2 === 0
        ? studySingularSubjects[(index * 5) % studySingularSubjects.length]
        : studyPluralSubjects[(index * 5) % studyPluralSubjects.length];
    const phrase = activityPhrases[(index * 6) % activityPhrases.length];
    const tail = futureTail[(index * 3) % futureTail.length];
    const futureAuxiliaryRu = getRuNegativeFutureAuxiliary(subject);

    questions.push(
      createQuestion(
        `${subject.en} ___ ${phrase.base} ${tail.en}.`,
        `${subject.ru} ${futureAuxiliaryRu} ${phrase.ruBase} ${tail.ru}.`,
        [
          option("won't", "не будет"),
          option(subject.negativeDo, "не делает"),
          option(subject.negativeBe, "не является"),
          option("didn't", "не делал"),
        ],
        0,
        "Для отрицания в будущем используем won't + глагол.",
        "Здесь речь о будущем отрицании, поэтому нужен вариант won't."
      )
    );
  }

  return {
    id: "future",
    title: "Выражение будущего",
    subtitle: "Future Forms",
    description: "Различаем will, won't и be going to для будущих действий.",
    accent: "#b084ff",
    questions,
  };
};

const generateQuantifiersSection = () => {
  const questions = [];

  for (let index = 0; index < 35; index += 1) {
    const context =
      countableQuantifierQuestions[index % countableQuantifierQuestions.length];

    questions.push(
      createQuestion(
        context.promptEn,
        context.promptRu,
        [
          option("many", "много"),
          option("much", "много"),
          option("a lot of", "много"),
          option("a lot", "много"),
        ],
        0,
        "С исчисляемыми существительными во множественном числе после How ставим many.",
        "Здесь существительное можно посчитать поштучно, поэтому нужен many."
      )
    );
  }

  for (let index = 0; index < 35; index += 1) {
    const context =
      uncountableQuantifierQuestions[index % uncountableQuantifierQuestions.length];

    questions.push(
      createQuestion(
        context.promptEn,
        context.promptRu,
        [
          option("much", "много"),
          option("many", "много"),
          option("a lot of", "много"),
          option("a lot", "много"),
        ],
        0,
        "С неисчисляемыми словами после How ставим much.",
        "Здесь слово неисчисляемое, поэтому нужен much."
      )
    );
  }

  for (let index = 0; index < 15; index += 1) {
    const context =
      countableQuantifierStatements[
        (index * 2) % countableQuantifierStatements.length
      ];

    questions.push(
      createQuestion(
        context.promptEn,
        context.promptRu,
        [
          option("a lot of", "много"),
          option("many", "много"),
          option("much", "много"),
          option("a lot", "много"),
        ],
        0,
        "В обычном утвердительном предложении удобно использовать a lot of.",
        "Здесь нет вопроса How, поэтому самый естественный вариант - a lot of."
      )
    );
  }

  for (let index = 0; index < 15; index += 1) {
    const context =
      uncountableQuantifierStatements[
        (index * 2) % uncountableQuantifierStatements.length
      ];

    questions.push(
      createQuestion(
        context.promptEn,
        context.promptRu,
        [
          option("a lot of", "много"),
          option("many", "много"),
          option("much", "много"),
          option("a lot", "много"),
        ],
        0,
        "С неисчисляемым словом в утвердительном предложении тоже хорошо работает a lot of.",
        "Здесь нужен общий вариант для количества, поэтому подходит a lot of."
      )
    );
  }

  return {
    id: "quantifiers",
    title: "Many, Much, A Lot Of",
    subtitle: "Quantifiers",
    description: "Разбираемся, когда предметы можно посчитать, а когда нет.",
    accent: "#ff8f7a",
    questions,
  };
};

const modalContexts = {
  can: [
    { subjectEn: "I", subjectRu: "Я", actionEn: "draw a horse", actionRu: "нарисовать лошадь" },
    { subjectEn: "Mia", subjectRu: "Мия", actionEn: "ride a bike", actionRu: "кататься на велосипеде" },
    { subjectEn: "We", subjectRu: "Мы", actionEn: "build a tent", actionRu: "поставить палатку" },
    { subjectEn: "My brother", subjectRu: "Мой брат", actionEn: "swim fast", actionRu: "быстро плавать" },
    { subjectEn: "Dad", subjectRu: "Папа", actionEn: "carry this bag", actionRu: "нести эту сумку" },
    { subjectEn: "The parrot", subjectRu: "Попугай", actionEn: "say hello", actionRu: "говорить привет" },
    { subjectEn: "Nina", subjectRu: "Нина", actionEn: "sing a song", actionRu: "петь песню" },
    { subjectEn: "Max", subjectRu: "Макс", actionEn: "run very fast", actionRu: "очень быстро бегать" },
    { subjectEn: "The dog", subjectRu: "Собака", actionEn: "find the ball", actionRu: "находить мяч" },
    { subjectEn: "I", subjectRu: "Я", actionEn: "write with my left hand", actionRu: "писать левой рукой" },
    { subjectEn: "We", subjectRu: "Мы", actionEn: "count to one hundred", actionRu: "считать до ста" },
    { subjectEn: "Grandpa", subjectRu: "Дедушка", actionEn: "cook soup", actionRu: "готовить суп" },
    { subjectEn: "My sister", subjectRu: "Моя сестра", actionEn: "speak English", actionRu: "говорить по-английски" },
    { subjectEn: "Tom and Ben", subjectRu: "Том и Бен", actionEn: "kick the ball", actionRu: "пинать мяч" },
    { subjectEn: "I", subjectRu: "Я", actionEn: "open the jar", actionRu: "открыть банку" },
  ],
  cant: [
    { subjectEn: "My baby sister", subjectRu: "Моя маленькая сестра", actionEn: "read yet", actionRu: "ещё читать" },
    { subjectEn: "A fish", subjectRu: "Рыба", actionEn: "walk", actionRu: "ходить" },
    { subjectEn: "I", subjectRu: "Я", actionEn: "fly", actionRu: "летать" },
    { subjectEn: "The kitten", subjectRu: "Котёнок", actionEn: "open the door", actionRu: "открыть дверь" },
    { subjectEn: "We", subjectRu: "Мы", actionEn: "breathe under water", actionRu: "дышать под водой" },
    { subjectEn: "Leo", subjectRu: "Лео", actionEn: "lift the car", actionRu: "поднять машину" },
    { subjectEn: "The bird", subjectRu: "Птица", actionEn: "write a letter", actionRu: "писать письмо" },
    { subjectEn: "I", subjectRu: "Я", actionEn: "eat twenty cakes", actionRu: "съесть двадцать тортов" },
    { subjectEn: "The dog", subjectRu: "Собака", actionEn: "read comics", actionRu: "читать комиксы" },
    { subjectEn: "We", subjectRu: "Мы", actionEn: "sleep in class", actionRu: "спать на уроке" },
  ],
  may: [
    { actionEn: "use my stickers", actionRu: "взять мои наклейки" },
    { actionEn: "come in", actionRu: "войти" },
    { actionEn: "borrow the blue pen", actionRu: "одолжить синюю ручку" },
    { actionEn: "sit here", actionRu: "сесть здесь" },
    { actionEn: "take one cookie", actionRu: "взять одно печенье" },
    { actionEn: "play in the yard", actionRu: "играть во дворе" },
    { actionEn: "wear my pink scarf", actionRu: "надеть мой розовый шарф" },
    { actionEn: "open the window", actionRu: "открыть окно" },
    { actionEn: "ask one question", actionRu: "задать один вопрос" },
    { actionEn: "draw on this page", actionRu: "рисовать на этой странице" },
  ],
  mayNot: [
    { actionEn: "take my phone without asking", actionRu: "брать мой телефон без спроса" },
    { actionEn: "touch the hot pan", actionRu: "трогать горячую сковороду" },
    { actionEn: "enter the lab alone", actionRu: "заходить в кабинет одному" },
    { actionEn: "feed the zoo animals", actionRu: "кормить животных в зоопарке" },
    { actionEn: "run near the pool", actionRu: "бегать рядом с бассейном" },
    { actionEn: "open the teacher's desk", actionRu: "открывать стол учителя" },
    { actionEn: "cross the road here", actionRu: "переходить дорогу здесь" },
    { actionEn: "eat that unknown berry", actionRu: "есть незнакомую ягоду" },
    { actionEn: "leave the camp alone", actionRu: "уходить из лагеря одному" },
    { actionEn: "climb this wet rock", actionRu: "лезть на мокрый камень" },
  ],
  haveTo: [
    { subjectEn: "We", subjectRu: "Мы", actionEn: "wear a school uniform", actionRu: "носить школьную форму" },
    { subjectEn: "I", subjectRu: "Я", actionEn: "do my homework", actionRu: "делать домашнюю работу" },
    { subjectEn: "You", subjectRu: "Ты", actionEn: "feed the dog", actionRu: "кормить собаку" },
    { subjectEn: "They", subjectRu: "Они", actionEn: "pack the tent", actionRu: "собрать палатку" },
    { subjectEn: "We", subjectRu: "Мы", actionEn: "clean the room", actionRu: "убирать комнату" },
    { subjectEn: "I", subjectRu: "Я", actionEn: "call grandma", actionRu: "позвонить бабушке" },
    { subjectEn: "You", subjectRu: "Ты", actionEn: "take your boots", actionRu: "взять ботинки" },
    { subjectEn: "They", subjectRu: "Они", actionEn: "bring water", actionRu: "принести воду" },
    { subjectEn: "We", subjectRu: "Мы", actionEn: "be on time", actionRu: "быть вовремя" },
    { subjectEn: "I", subjectRu: "Я", actionEn: "finish this task", actionRu: "закончить это задание" },
    { subjectEn: "You", subjectRu: "Ты", actionEn: "listen carefully", actionRu: "слушать внимательно" },
    { subjectEn: "They", subjectRu: "Они", actionEn: "help their parents", actionRu: "помогать родителям" },
    { subjectEn: "We", subjectRu: "Мы", actionEn: "wash the dishes", actionRu: "мыть посуду" },
    { subjectEn: "I", subjectRu: "Я", actionEn: "wear a helmet", actionRu: "надеть шлем" },
    { subjectEn: "You", subjectRu: "Ты", actionEn: "close the gate", actionRu: "закрыть калитку" },
  ],
  dontHaveTo: [
    { subjectEn: "We", subjectRu: "Мы", actionEn: "get up early on Sunday", actionRu: "вставать рано в воскресенье" },
    { subjectEn: "I", subjectRu: "Я", actionEn: "wear boots in summer", actionRu: "носить ботинки летом" },
    { subjectEn: "You", subjectRu: "Ты", actionEn: "bring lunch today", actionRu: "приносить обед сегодня" },
    { subjectEn: "They", subjectRu: "Они", actionEn: "run now", actionRu: "бежать сейчас" },
    { subjectEn: "We", subjectRu: "Мы", actionEn: "take a bus today", actionRu: "ехать на автобусе сегодня" },
    { subjectEn: "I", subjectRu: "Я", actionEn: "wear a coat inside", actionRu: "носить куртку дома" },
    { subjectEn: "You", subjectRu: "Ты", actionEn: "pack a sleeping bag for school", actionRu: "брать спальный мешок в школу" },
    { subjectEn: "They", subjectRu: "Они", actionEn: "do the task again", actionRu: "делать задание снова" },
    { subjectEn: "We", subjectRu: "Мы", actionEn: "water the flowers today", actionRu: "поливать цветы сегодня" },
    { subjectEn: "I", subjectRu: "Я", actionEn: "eat soup if I am full", actionRu: "есть суп, если я сыт(а)" },
  ],
  doesntHaveTo: [
    { subjectEn: "Mia", subjectRu: "Мия", actionEn: "get up early on Sunday", actionRu: "вставать рано в воскресенье" },
    { subjectEn: "Dad", subjectRu: "Папа", actionEn: "go to work today", actionRu: "идти сегодня на работу" },
    { subjectEn: "My brother", subjectRu: "Мой брат", actionEn: "wear boots at home", actionRu: "носить ботинки дома" },
    { subjectEn: "The cat", subjectRu: "Кот", actionEn: "take a shower", actionRu: "принимать душ" },
    { subjectEn: "Grandpa", subjectRu: "Дедушка", actionEn: "carry the heavy bag", actionRu: "нести тяжёлую сумку" },
    { subjectEn: "Nina", subjectRu: "Нина", actionEn: "do homework in July", actionRu: "делать уроки в июле" },
    { subjectEn: "Leo", subjectRu: "Лео", actionEn: "wear a scarf in hot weather", actionRu: "носить шарф в жару" },
    { subjectEn: "Our teacher", subjectRu: "Наша учительница", actionEn: "come to school on Saturday", actionRu: "приходить в школу в субботу" },
    { subjectEn: "Mom", subjectRu: "Мама", actionEn: "cook dinner tonight", actionRu: "готовить ужин сегодня вечером" },
    { subjectEn: "The dog", subjectRu: "Собака", actionEn: "stay outside today", actionRu: "оставаться сегодня на улице" },
  ],
  must: [
    { subjectEn: "You", subjectRu: "Ты", actionEn: "be quiet in class", actionRu: "вести себя тихо на уроке" },
    { subjectEn: "We", subjectRu: "Мы", actionEn: "be kind to animals", actionRu: "быть добрыми к животным" },
    { subjectEn: "I", subjectRu: "Я", actionEn: "finish this letter today", actionRu: "закончить это письмо сегодня" },
    { subjectEn: "They", subjectRu: "Они", actionEn: "listen to the teacher", actionRu: "слушать учителя" },
    { subjectEn: "You", subjectRu: "Ты", actionEn: "wash your hands", actionRu: "мыть руки" },
    { subjectEn: "We", subjectRu: "Мы", actionEn: "take water to the camp", actionRu: "взять воду в лагерь" },
    { subjectEn: "I", subjectRu: "Я", actionEn: "say sorry", actionRu: "извиниться" },
    { subjectEn: "They", subjectRu: "Они", actionEn: "wear helmets", actionRu: "надеть шлемы" },
    { subjectEn: "You", subjectRu: "Ты", actionEn: "look both ways", actionRu: "посмотреть по сторонам" },
    { subjectEn: "We", subjectRu: "Мы", actionEn: "keep the room clean", actionRu: "держать комнату в чистоте" },
  ],
  mustnt: [
    { subjectEn: "You", subjectRu: "Ты", actionEn: "run in the corridor", actionRu: "бегать в коридоре" },
    { subjectEn: "We", subjectRu: "Мы", actionEn: "touch the fire", actionRu: "трогать огонь" },
    { subjectEn: "I", subjectRu: "Я", actionEn: "throw litter here", actionRu: "бросать мусор здесь" },
    { subjectEn: "They", subjectRu: "Они", actionEn: "shout in the library", actionRu: "кричать в библиотеке" },
    { subjectEn: "You", subjectRu: "Ты", actionEn: "eat unknown mushrooms", actionRu: "есть незнакомые грибы" },
    { subjectEn: "We", subjectRu: "Мы", actionEn: "leave the tent open", actionRu: "оставлять палатку открытой" },
    { subjectEn: "I", subjectRu: "Я", actionEn: "cross on red", actionRu: "переходить на красный" },
    { subjectEn: "They", subjectRu: "Они", actionEn: "push each other", actionRu: "толкать друг друга" },
    { subjectEn: "You", subjectRu: "Ты", actionEn: "play with matches", actionRu: "играть со спичками" },
    { subjectEn: "We", subjectRu: "Мы", actionEn: "wake the baby", actionRu: "будить малыша" },
  ],
};

const generateModalsSection = () => {
  const questions = [];

  modalContexts.can.forEach((context) => {
    questions.push(
      createQuestion(
        `${context.subjectEn} ___ ${context.actionEn}.`,
        `${context.subjectRu} ___ ${context.actionRu}.`,
        [option("can", "может"), option("may", "можно"), option("must", "должен"), option("have to", "нужно")],
        0,
        "can показывает умение или возможность что-то сделать.",
        "Здесь говорится об умении, поэтому нужен can."
      )
    );
  });

  modalContexts.cant.forEach((context) => {
    questions.push(
      createQuestion(
        `${context.subjectEn} ___ ${context.actionEn}.`,
        `${context.subjectRu} ___ ${context.actionRu}.`,
        [option("can't", "не может"), option("can", "может"), option("mustn't", "нельзя"), option("don't have to", "не нужно")],
        0,
        "can't показывает, что что-то не получается или невозможно.",
        "Здесь речь о невозможности, поэтому нужен can't."
      )
    );
  });

  modalContexts.may.forEach((context) => {
    questions.push(
      createQuestion(
        `You ___ ${context.actionEn}.`,
        `Ты ___ ${context.actionRu}.`,
        [option("may", "можно"), option("may not", "нельзя"), option("must", "должен"), option("can't", "не можешь")],
        0,
        "may часто используют, когда дают разрешение.",
        "Здесь дают разрешение, значит нужен may."
      )
    );
  });

  modalContexts.mayNot.forEach((context) => {
    questions.push(
      createQuestion(
        `You ___ ${context.actionEn}.`,
        `Тебе ___ ${context.actionRu}.`,
        [option("may not", "нельзя"), option("may", "можно"), option("can", "можешь"), option("don't have to", "не нужно")],
        0,
        "may not показывает, что разрешения нет.",
        "Здесь действие запрещено без разрешения, поэтому нужен may not."
      )
    );
  });

  modalContexts.haveTo.forEach((context) => {
    questions.push(
      createQuestion(
        `${context.subjectEn} ___ ${context.actionEn}.`,
        `${context.subjectRu} ___ ${context.actionRu}.`,
        [option("have to", "должен(ны)"), option("don't have to", "не нужно"), option("mustn't", "нельзя"), option("can", "может")],
        0,
        "have to значит, что это нужно сделать по правилу или обстоятельствам.",
        "Здесь есть обязанность, поэтому нужен have to."
      )
    );
  });

  modalContexts.dontHaveTo.forEach((context) => {
    questions.push(
      createQuestion(
        `${context.subjectEn} ___ ${context.actionEn}.`,
        `${context.subjectRu} ___ ${context.actionRu}.`,
        [option("don't have to", "не нужно"), option("have to", "нужно"), option("mustn't", "нельзя"), option("can", "может")],
        0,
        "don't have to значит, что делать это не обязательно.",
        "Здесь нет необходимости, значит нужен don't have to."
      )
    );
  });

  modalContexts.doesntHaveTo.forEach((context) => {
    questions.push(
      createQuestion(
        `${context.subjectEn} ___ ${context.actionEn}.`,
        `${context.subjectRu} ___ ${context.actionRu}.`,
        [option("doesn't have to", "не нужно"), option("don't have to", "не нужно"), option("have to", "нужно"), option("can't", "не может")],
        0,
        "С he/she/it используем doesn't have to, когда что-то не обязательно.",
        "Здесь один человек или предмет, поэтому нужна форма doesn't have to."
      )
    );
  });

  modalContexts.must.forEach((context) => {
    questions.push(
      createQuestion(
        `${context.subjectEn} ___ ${context.actionEn}.`,
        `${context.subjectRu} ___ ${context.actionRu}.`,
        [option("must", "должен"), option("mustn't", "нельзя"), option("can", "может"), option("don't have to", "не нужно")],
        0,
        "must показывает сильное правило или очень важную необходимость.",
        "Здесь нужна строгая обязанность, поэтому подходит must."
      )
    );
  });

  modalContexts.mustnt.forEach((context) => {
    questions.push(
      createQuestion(
        `${context.subjectEn} ___ ${context.actionEn}.`,
        `${context.subjectRu} ___ ${context.actionRu}.`,
        [option("mustn't", "нельзя"), option("must", "должен"), option("can", "может"), option("don't have to", "не нужно")],
        0,
        "mustn't значит строгий запрет: этого делать нельзя.",
        "Здесь речь о запрете, поэтому нужен mustn't."
      )
    );
  });

  return {
    id: "modals",
    title: "Модальные глаголы",
    subtitle: "Modal Verbs",
    description: "Учимся различать can, may, have to, must и запреты.",
    accent: "#ff70a6",
    questions,
  };
};

const questionWordContexts = {
  who: [
    { sentenceEn: "___ is singing in the kitchen? My sister.", sentenceRu: "___ поёт на кухне? Моя сестра." },
    { sentenceEn: "___ is at the door? Dad.", sentenceRu: "___ у двери? Папа." },
    { sentenceEn: "___ is wearing red boots? Nina.", sentenceRu: "___ в красных ботинках? Нина." },
    { sentenceEn: "___ is feeding the cat? Max.", sentenceRu: "___ кормит кота? Макс." },
    { sentenceEn: "___ is drawing a rainbow? Mia.", sentenceRu: "___ рисует радугу? Мия." },
    { sentenceEn: "___ is in the tent? Leo.", sentenceRu: "___ в палатке? Лео." },
    { sentenceEn: "___ is carrying the sleeping bag? Grandpa.", sentenceRu: "___ несёт спальный мешок? Дедушка." },
    { sentenceEn: "___ is knocking? Our teacher.", sentenceRu: "___ стучит? Наша учительница." },
    { sentenceEn: "___ is telling the joke? The clown.", sentenceRu: "___ рассказывает шутку? Клоун." },
    { sentenceEn: "___ is jumping over the puddle? Tom.", sentenceRu: "___ перепрыгивает лужу? Том." },
    { sentenceEn: "___ is reading this comic? Ben.", sentenceRu: "___ читает этот комикс? Бен." },
    { sentenceEn: "___ is helping Mom? I am.", sentenceRu: "___ помогает маме? Я." },
    { sentenceEn: "___ is the youngest in the family? Mia.", sentenceRu: "___ самый младший в семье? Мия." },
    { sentenceEn: "___ is in the blue hat? Grandpa.", sentenceRu: "___ в синей шляпе? Дедушка." },
    { sentenceEn: "___ is calling you? Nina.", sentenceRu: "___ тебе звонит? Нина." },
  ],
  what: [
    { sentenceEn: "___ is on the table? A cake.", sentenceRu: "___ на столе? Торт." },
    { sentenceEn: "___ are you drawing? A house.", sentenceRu: "___ ты рисуешь? Дом." },
    { sentenceEn: "___ is in your backpack? Books.", sentenceRu: "___ в твоём рюкзаке? Книги." },
    { sentenceEn: "___ do we need for the camp? A tent.", sentenceRu: "___ нам нужно для лагеря? Палатка." },
    { sentenceEn: "___ is Mom cooking? Soup.", sentenceRu: "___ мама готовит? Суп." },
    { sentenceEn: "___ is your favourite animal? A fox.", sentenceRu: "___ твоё любимое животное? Лиса." },
    { sentenceEn: "___ is in the cup? Juice.", sentenceRu: "___ в чашке? Сок." },
    { sentenceEn: "___ do they want to watch? A cartoon.", sentenceRu: "___ они хотят посмотреть? Мультфильм." },
    { sentenceEn: "___ is under the bed? A toy.", sentenceRu: "___ под кроватью? Игрушка." },
    { sentenceEn: "___ are you wearing? Boots.", sentenceRu: "___ ты надел(а)? Ботинки." },
    { sentenceEn: "___ is your name? Kate.", sentenceRu: "___ тебя зовут? Катя." },
    { sentenceEn: "___ is in the sleeping bag? A flashlight.", sentenceRu: "___ в спальном мешке? Фонарик." },
    { sentenceEn: "___ is the weather like? Sunny.", sentenceRu: "___ погода? Солнечная." },
    { sentenceEn: "___ did Leo buy? Apples.", sentenceRu: "___ купил Лев? Яблоки." },
    { sentenceEn: "___ is the dog carrying? A ball.", sentenceRu: "___ несёт собака? Мяч." },
  ],
  where: [
    { sentenceEn: "___ is your book? On the desk.", sentenceRu: "___ твоя книга? На парте." },
    { sentenceEn: "___ do you sleep? In my room.", sentenceRu: "___ ты спишь? В своей комнате." },
    { sentenceEn: "___ is the cat? Under the chair.", sentenceRu: "___ кот? Под стулом." },
    { sentenceEn: "___ are the boots? Near the door.", sentenceRu: "___ ботинки? Возле двери." },
    { sentenceEn: "___ are we going tomorrow? To the zoo.", sentenceRu: "___ мы идём завтра? В зоопарк." },
    { sentenceEn: "___ is your tent? By the lake.", sentenceRu: "___ твоя палатка? У озера." },
    { sentenceEn: "___ does Grandpa sit? On the bench.", sentenceRu: "___ сидит дедушка? На скамейке." },
    { sentenceEn: "___ is the kite? In the sky.", sentenceRu: "___ воздушный змей? В небе." },
    { sentenceEn: "___ do they keep the comics? On the shelf.", sentenceRu: "___ они держат комиксы? На полке." },
    { sentenceEn: "___ is the ball? Behind the tree.", sentenceRu: "___ мяч? За деревом." },
    { sentenceEn: "___ is your school? On Green Street.", sentenceRu: "___ твоя школа? На улице Грин." },
    { sentenceEn: "___ are the flippers? In the blue bag.", sentenceRu: "___ ласты? В синей сумке." },
    { sentenceEn: "___ do birds sleep? In nests.", sentenceRu: "___ спят птицы? В гнёздах." },
    { sentenceEn: "___ is Mom now? In the kitchen.", sentenceRu: "___ мама сейчас? На кухне." },
    { sentenceEn: "___ can we put the sleeping bag? In the tent.", sentenceRu: "___ можно положить спальный мешок? В палатку." },
  ],
  when: [
    { sentenceEn: "___ is your birthday? In May.", sentenceRu: "___ у тебя день рождения? В мае." },
    { sentenceEn: "___ do you get up early? On school days.", sentenceRu: "___ ты встаёшь рано? В учебные дни." },
    { sentenceEn: "___ will they come? Tomorrow.", sentenceRu: "___ они придут? Завтра." },
    { sentenceEn: "___ do we have English? On Monday.", sentenceRu: "___ у нас английский? В понедельник." },
    { sentenceEn: "___ did Dad call grandma? Last night.", sentenceRu: "___ папа звонил бабушке? Прошлой ночью." },
    { sentenceEn: "___ are you doing homework? After dinner.", sentenceRu: "___ ты делаешь уроки? После ужина." },
    { sentenceEn: "___ do birds sing? In the morning.", sentenceRu: "___ поют птицы? Утром." },
    { sentenceEn: "___ can we go camping? In July.", sentenceRu: "___ мы можем поехать в лагерь? В июле." },
    { sentenceEn: "___ did it start to rain? Yesterday evening.", sentenceRu: "___ начался дождь? Вчера вечером." },
    { sentenceEn: "___ do you play football? After school.", sentenceRu: "___ ты играешь в футбол? После школы." },
    { sentenceEn: "___ will Mia wear the pink dress? On Saturday.", sentenceRu: "___ Мия наденет розовое платье? В субботу." },
    { sentenceEn: "___ are they packing the tent? Right now.", sentenceRu: "___ они собирают палатку? Прямо сейчас." },
    { sentenceEn: "___ do you usually visit Grandpa? On Sundays.", sentenceRu: "___ ты обычно навещаешь дедушку? По воскресеньям." },
    { sentenceEn: "___ did the lesson finish? After lunch.", sentenceRu: "___ закончился урок? После обеда." },
    { sentenceEn: "___ are we meeting Nina? This evening.", sentenceRu: "___ мы встречаемся с Ниной? Сегодня вечером." },
  ],
  why: [
    { sentenceEn: "___ are you laughing? Because it is funny.", sentenceRu: "___ ты смеёшься? Потому что это смешно." },
    { sentenceEn: "___ is the window open? Because it is hot.", sentenceRu: "___ окно открыто? Потому что жарко." },
    { sentenceEn: "___ is Leo wearing boots? Because it is rainy.", sentenceRu: "___ Лев в ботинках? Потому что дождливо." },
    { sentenceEn: "___ are they running? Because they are late.", sentenceRu: "___ они бегут? Потому что опаздывают." },
    { sentenceEn: "___ did Mom buy apples? Because we need a pie.", sentenceRu: "___ мама купила яблоки? Потому что нужен пирог." },
    { sentenceEn: "___ are you taking flippers? Because we will swim.", sentenceRu: "___ ты берёшь ласты? Потому что мы будем плавать." },
    { sentenceEn: "___ is the cat under the bed? Because it is scared.", sentenceRu: "___ кот под кроватью? Потому что он испугался." },
    { sentenceEn: "___ do we need a tent? Because we are going camping.", sentenceRu: "___ нам нужна палатка? Потому что мы едем в лагерь." },
    { sentenceEn: "___ is Grandpa smiling? Because he is happy.", sentenceRu: "___ дедушка улыбается? Потому что он счастлив." },
    { sentenceEn: "___ were you absent yesterday? Because I was ill.", sentenceRu: "___ тебя вчера не было? Потому что я болел(а)." },
  ],
  how: [
    { sentenceEn: "___ are you? I am fine.", sentenceRu: "___ ты? Я в порядке." },
    { sentenceEn: "___ do you go to school? By bus.", sentenceRu: "___ ты добираешься до школы? На автобусе." },
    { sentenceEn: "___ is the soup? It is hot.", sentenceRu: "___ суп? Он горячий." },
    { sentenceEn: "___ do we open this box? With a key.", sentenceRu: "___ мы откроем эту коробку? Ключом." },
    { sentenceEn: "___ does the puppy run? Very fast.", sentenceRu: "___ бегает щенок? Очень быстро." },
    { sentenceEn: "___ is the cake? Very sweet.", sentenceRu: "___ торт? Очень сладкий." },
    { sentenceEn: "___ do you spell your name? K-A-T-E.", sentenceRu: "___ пишется твоё имя? К-А-Т-Е." },
    { sentenceEn: "___ is your grandma? She is great.", sentenceRu: "___ твоя бабушка? У неё всё отлично." },
    { sentenceEn: "___ do birds fly? With their wings.", sentenceRu: "___ летают птицы? Своими крыльями." },
    { sentenceEn: "___ are you doing? I am drawing.", sentenceRu: "___ ты делаешь? Я рисую." },
  ],
  howMany: [
    { sentenceEn: "___ apples do you have? Five.", sentenceRu: "___ у тебя яблок? Пять." },
    { sentenceEn: "___ books are in the bag? Three.", sentenceRu: "___ книг в сумке? Три." },
    { sentenceEn: "___ tents do we need? Two.", sentenceRu: "___ палаток нам нужно? Две." },
    { sentenceEn: "___ crayons did Mia buy? Ten.", sentenceRu: "___ мелков купила Мия? Десять." },
    { sentenceEn: "___ questions are in this test? One hundred.", sentenceRu: "___ вопросов в этом тесте? Сто." },
    { sentenceEn: "___ cookies are on the plate? Six.", sentenceRu: "___ печений на тарелке? Шесть." },
    { sentenceEn: "___ balloons can you see? Four.", sentenceRu: "___ шаров ты видишь? Четыре." },
    { sentenceEn: "___ rabbits are in the picture? Two.", sentenceRu: "___ кроликов на картинке? Два." },
    { sentenceEn: "___ shells did they find? Seven.", sentenceRu: "___ ракушек они нашли? Семь." },
    { sentenceEn: "___ boots are near the door? Two.", sentenceRu: "___ ботинок у двери? Два." },
  ],
  whatTime: [
    { sentenceEn: "___ do you go to bed? At nine o'clock.", sentenceRu: "___ ты ложишься спать? В девять часов." },
    { sentenceEn: "___ does the lesson start? At eight.", sentenceRu: "___ начинается урок? В восемь." },
    { sentenceEn: "___ did Dad come home? At six.", sentenceRu: "___ папа пришёл домой? В шесть." },
    { sentenceEn: "___ are we meeting Nina? At five.", sentenceRu: "___ мы встречаемся с Ниной? В пять." },
    { sentenceEn: "___ does the film finish? At ten.", sentenceRu: "___ заканчивается фильм? В десять." },
    { sentenceEn: "___ will the bus leave? At seven thirty.", sentenceRu: "___ уедет автобус? В семь тридцать." },
    { sentenceEn: "___ do you have breakfast? At seven fifteen.", sentenceRu: "___ ты завтракаешь? В семь пятнадцать." },
    { sentenceEn: "___ are they packing the tent? At four.", sentenceRu: "___ они собирают палатку? В четыре." },
    { sentenceEn: "___ does Grandpa take his medicine? At noon.", sentenceRu: "___ дедушка принимает лекарство? В полдень." },
    { sentenceEn: "___ can I call you? At eight thirty.", sentenceRu: "___ мне тебе позвонить? В восемь тридцать." },
  ],
};

const generateQuestionWordsSection = () => {
  const questions = [];

  questionWordContexts.who.forEach((context) => {
    questions.push(
      createQuestion(
        context.sentenceEn,
        context.sentenceRu,
        [option("Who", "кто"), option("What", "что"), option("Where", "где"), option("When", "когда")],
        0,
        "Who спрашивает о человеке или животном, которое выполняет действие.",
        "Здесь в ответе называют того, кто делает действие, поэтому нужен Who."
      )
    );
  });

  questionWordContexts.what.forEach((context) => {
    questions.push(
      createQuestion(
        context.sentenceEn,
        context.sentenceRu,
        [option("What", "что"), option("Who", "кто"), option("Where", "где"), option("Why", "почему")],
        0,
        "What спрашивает о предмете, явлении или действии.",
        "В ответе не человек, а предмет или информация, значит нужен What."
      )
    );
  });

  questionWordContexts.where.forEach((context) => {
    questions.push(
      createQuestion(
        context.sentenceEn,
        context.sentenceRu,
        [option("Where", "где"), option("When", "когда"), option("What", "что"), option("Who", "кто")],
        0,
        "Where спрашивает о месте.",
        "Здесь в ответе место, поэтому нужен Where."
      )
    );
  });

  questionWordContexts.when.forEach((context) => {
    questions.push(
      createQuestion(
        context.sentenceEn,
        context.sentenceRu,
        [option("When", "когда"), option("Where", "где"), option("Why", "почему"), option("What time", "во сколько")],
        0,
        "When спрашивает о времени или моменте.",
        "Здесь отвечают словом о времени, поэтому нужен When."
      )
    );
  });

  questionWordContexts.why.forEach((context) => {
    questions.push(
      createQuestion(
        context.sentenceEn,
        context.sentenceRu,
        [option("Why", "почему"), option("Where", "где"), option("Who", "кто"), option("How", "как")],
        0,
        "Why спрашивает о причине.",
        "Ответ начинается с because, значит нужен Why."
      )
    );
  });

  questionWordContexts.how.forEach((context) => {
    questions.push(
      createQuestion(
        context.sentenceEn,
        context.sentenceRu,
        [option("How", "как"), option("What", "что"), option("When", "когда"), option("Who", "кто")],
        0,
        "How спрашивает о способе, состоянии или качестве.",
        "Здесь нужен вопрос о том, как что-то происходит или в каком состоянии."
      )
    );
  });

  questionWordContexts.howMany.forEach((context) => {
    questions.push(
      createQuestion(
        context.sentenceEn,
        context.sentenceRu,
        [option("How many", "сколько"), option("How much", "сколько"), option("What", "что"), option("Where", "где")],
        0,
        "How many используем с тем, что можно посчитать.",
        "Здесь считают предметы поштучно, поэтому нужен вопрос How many."
      )
    );
  });

  questionWordContexts.whatTime.forEach((context) => {
    questions.push(
      createQuestion(
        context.sentenceEn,
        context.sentenceRu,
        [option("What time", "во сколько"), option("When", "когда"), option("How", "как"), option("Where", "где")],
        0,
        "What time спрашивает о точном времени по часам.",
        "Здесь нужен точный час, поэтому подходит What time."
      )
    );
  });

  return {
    id: "question-words",
    title: "Вопросительные слова",
    subtitle: "Question Words",
    description: "Выбираем нужное слово для вопросов: who, what, where, when и другие.",
    accent: "#70b8ff",
    questions,
  };
};

const sections = [
  generateComparisonSection(),
  generatePastSimpleSection(),
  generateSignalsSection(),
  generatePresentSimpleSection(),
  generatePresentContinuousSection(),
  generateFutureSection(),
  generateQuantifiersSection(),
  generateModalsSection(),
  generateQuestionWordsSection(),
].map(finalizeSection);

export const questionBank = {
  version: "1.1.0",
  totalSections: sections.length,
  totalQuestions: sections.reduce((sum, section) => sum + section.questions.length, 0),
  sections,
};
