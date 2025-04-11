const translations = {
  en: {
    instructions:
      "You will be shown a series of cards. Match each card to one of the four reference piles by clicking on the matching card at the bottom of the screen. The match is based on a hidden rule: color, shape, or number. You will receive feedback after each attempt in the form of “Correct” or “Incorrect.” The rule will stay the same for a while, but it will change multiple times during the test — without warning. Your task is to figure out which rule is currently being used and adapt as quickly as possible. The test ends after 100 cards.",
    start: "I understand",
    correct: "Correct",
    incorrect: "Incorrect",
  },
  pl: {
    instructions:
      "Zobaczysz serię kart. Twoim zadaniem będzie dopasowanie każdej karty do jednej z czterech kart odniesienia, klikając na pasującą kartę znajdującą się na dole ekranu. Dopasowanie odbywa się według ukrytej zasady: koloru, kształtu lub liczby. Po każdej próbie otrzymasz informację zwrotną w formie „Poprawnie” lub „Błędnie.” Jedna zasada obowiązuje przez pewien czas, ale w trakcie testu będzie się ona wielokrotnie zmieniać — bez uprzedzenia. Musisz samodzielnie odkryć, jaka zasada aktualnie obowiązuje, i dostosować się jak najszybciej. Test kończy się po 100 kartach.",
    start: "Rozumiem",
    correct: "Poprawnie",
    incorrect: "Błędnie",
  },
};

function getSavedLanguage() {
  const match = document.cookie.match(/(?:^|; )lang=([^;]+)/);
  return match ? match[1] : "en";
}
const ruleSequence = [
  "color",
  "shape",
  "number",
  "shape",
  "color",
  "number",
  "color",
  "number",
  "shape",
];
function getRuleValue(card, rule) {
  return card[rule];
}

let ruleIndex = 0;
let correctInARow = 0;
let currentRule = ruleSequence[ruleIndex];
const results = [];
const lang = getSavedLanguage();
const t = translations[lang];
let currentCardIndex = 0;
let currentCard = null;
let cardStartTime = null;

document.getElementById("instructions").textContent = t.instructions;
document.getElementById("start-btn").textContent = t.start;

document.getElementById("start-btn").addEventListener("click", () => {
  document.getElementById("instructions").remove();
  document.getElementById("start-btn").remove();
  document.getElementById("card-area").classList.remove("hidden");
  document.getElementById("test-ui").classList.remove("hidden");

  cardDeck = generateCardDeck();
  console.log("Generated card deck:", cardDeck);
  loadNextCard();
  document.querySelectorAll(".pile").forEach((pile) => {
    pile.addEventListener("click", handlePileClick);
  });
});

// ────────────────────────────
// Card deck generation
// ────────────────────────────

const shapes = ["circle", "triangle", "star", "cross"];
const colors = ["blue", "green", "red", "yellow"];
const numbers = [1, 2, 3, 4];

const referenceCards = [
  { shape: "cross", color: "red", number: 1 },
  { shape: "circle", color: "blue", number: 2 },
  { shape: "star", color: "green", number: 3 },
  { shape: "triangle", color: "yellow", number: 4 },
];

let cardDeck = [];

function generateCardDeck() {
  const allCards = [];

  for (let shape of shapes) {
    for (let color of colors) {
      for (let number of numbers) {
        const card = { shape, color, number };
        const isRef = referenceCards.some(
          (ref) =>
            ref.shape === shape && ref.color === color && ref.number === number
        );
        if (!isRef) allCards.push(card);
      }
    }
  }

  return shuffleArray(allCards).slice(0, 100);
}

function shuffleArray(arr) {
  return arr
    .map((a) => ({ sort: Math.random(), value: a }))
    .sort((a, b) => a.sort - b.sort)
    .map((a) => a.value);
}
function loadNextCard() {
  if (currentCardIndex >= cardDeck.length) {
    endTest();
    return;
  }

  currentCard = cardDeck[currentCardIndex];
  cardStartTime = performance.now();

  const filename = `cards/${currentCard.shape}_${currentCard.color}_${currentCard.number}.png`;
  document.getElementById("current-card").src = filename;
}

function handlePileClick(e) {
  const selectedPile = parseInt(e.currentTarget.dataset.pile);
  const timeTaken = Math.floor(performance.now() - cardStartTime);
  const selectedRef = referenceCards[selectedPile];

  const selectedValue = getRuleValue(selectedRef, currentRule);
  const targetValue = getRuleValue(currentCard, currentRule);

  const isCorrect = selectedValue === targetValue;

  console.log("Rule:", currentRule);
  console.log("Correct pile?", isCorrect);
  console.log("Card:", currentCard);
  console.log("Clicked pile:", selectedPile);
  console.log("Time (ms):", timeTaken);

  // Save result
  const result = {
    card: currentCard,
    selectedPile,
    rule: currentRule,
    correct: isCorrect,
    timeMs: timeTaken,
    ruleChanged: false,
    errorType: null,
  };

  if (isCorrect) {
    correctInARow++;
    if (correctInARow === 9) {
      ruleIndex++;
      currentRule = ruleSequence[ruleIndex % ruleSequence.length];
      correctInARow = 0;
      result.ruleChanged = true;
    }
  } else {
    // classify type of error
    result.errorType =
      correctInARow === 0 ? "rule-change-expected" : "unexpected";
    correctInARow = 0;
  }

  results.push(result);

  // show feedback
  const feedback = document.getElementById("feedback");
  feedback.classList.remove("hidden", "correct", "incorrect");
  feedback.classList.add(isCorrect ? "correct" : "incorrect");
  feedback.textContent = isCorrect ? t.correct : t.incorrect;

  // delay before next card
  setTimeout(() => {
    feedback.classList.add("hidden");
    currentCardIndex++;
    loadNextCard();
  }, 600);
}
