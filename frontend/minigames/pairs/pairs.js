const translations = {
  en: {
    instructions:
      "Memorize the card positions. After 5 seconds, they will flip. Match all the pairs with the fewest mistakes.",
    start: "I understand",
    time: "Time",
    mistakes: "Mistakes",
    finish: "You completed the game!",
    continue: "Continue",
  },
  pl: {
    instructions:
      "Zapamiętaj ułożenie kart. Po 5 sekundach zostaną zakryte. Dopasuj wszystkie pary robiąc jak najmniej błędów.",
    start: "Rozumiem",
    time: "Czas",
    mistakes: "Błędy",
    finish: "Ukończyłeś grę!",
    continue: "Kontynuuj",
  },
};

let lockBoard = false;

function getSavedLanguage() {
  const match = document.cookie.match(/(?:^|; )lang=([^;]+)/);
  return match ? match[1] : "en";
}

const lang = getSavedLanguage();
const t = translations[lang];
const game = document.getElementById("game");
const instructions = document.getElementById("instructions");
const startBtn = document.getElementById("start-btn");
const board = document.getElementById("board");
const stats = document.getElementById("stats");
const mistakeCounter = document.getElementById("mistake-counter");
const timeCounter = document.getElementById("time-counter");

let firstCard = null;
let secondCard = null;
let mistakes = 0;
let matchedPairs = 0;
let timerStart = null;
let timerInterval = null;

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

function createBoard() {
  const cardValues = [];
  for (let i = 1; i <= 12; i++) {
    cardValues.push(i);
    cardValues.push(i);
  }
  shuffleArray(cardValues);

  board.innerHTML = "";
  cardValues.forEach((value) => {
    const card = document.createElement("div");
    card.classList.add("card");
    card.dataset.value = value;
    card.style.backgroundImage = `url('cards/${value}.png')`;
    board.appendChild(card);
  });
}

function hideAllCards() {
  document.querySelectorAll(".card").forEach((card) => {
    card.classList.remove("revealed", "correct", "wrong");
    card.style.backgroundImage = `url('cards/back.png')`;
  });
}

function revealCard(card) {
  card.style.backgroundImage = `url('cards/${card.dataset.value}.png')`;
  card.classList.add("revealed");
}

function updateStats() {
  mistakeCounter.textContent = `${t.mistakes}: ${mistakes}`;
  const elapsed = Math.floor((Date.now() - timerStart) / 1000);
  timeCounter.textContent = `${t.time}: ${elapsed}s`;
}

function startTimer() {
  timerStart = Date.now();
  updateStats();
  timerInterval = setInterval(updateStats, 1000);
}

function stopTimer() {
  clearInterval(timerInterval);
}

function checkMatch() {
  if (!firstCard || !secondCard) return;

  lockBoard = true;

  const isMatch = firstCard.dataset.value === secondCard.dataset.value;

  if (isMatch) {
    firstCard.classList.add("correct");
    secondCard.classList.add("correct");

    setTimeout(() => {
      firstCard.style.visibility = "hidden";
      secondCard.style.visibility = "hidden";
      matchedPairs++;
      firstCard = secondCard = null;
      lockBoard = false;

      if (matchedPairs === 12) {
        stopTimer();

        const seconds = Math.floor((Date.now() - timerStart) / 1000);
        localStorage.setItem("matchpairs_time", seconds);
        localStorage.setItem("matchpairs_mistakes", mistakes);

        document.getElementById("board").classList.add("hidden");
        document.getElementById("stats").classList.add("hidden");

        const endScreen = document.createElement("div");
        endScreen.style.position = "fixed";
        endScreen.style.top = "0";
        endScreen.style.left = "0";
        endScreen.style.width = "100vw";
        endScreen.style.height = "100vh";
        endScreen.style.backgroundColor = "white";
        endScreen.style.display = "flex";
        endScreen.style.flexDirection = "column";
        endScreen.style.alignItems = "center";
        endScreen.style.justifyContent = "center";
        endScreen.style.textAlign = "center";
        endScreen.style.zIndex = "999";

        const message = document.createElement("p");
        message.textContent = t.finish;
        message.style.fontSize = "2em";
        message.style.marginBottom = "20px";

        const button = document.createElement("button");
        button.textContent = t.continue;
        button.style.fontSize = "1.2em";
        button.style.padding = "1em 2em";
        button.style.borderRadius = "8px";
        button.style.backgroundColor = "#007bff";
        button.style.color = "white";
        button.style.border = "none";
        button.style.cursor = "pointer";

        button.addEventListener("click", () => {
          window.location.href = "../game3/index.html";
        });

        endScreen.appendChild(message);
        endScreen.appendChild(button);
        document.body.appendChild(endScreen);
      }
    }, 1000);
  } else {
    firstCard.classList.add("wrong");
    secondCard.classList.add("wrong");
    mistakes++;

    setTimeout(() => {
      firstCard.classList.remove("revealed", "wrong");
      secondCard.classList.remove("revealed", "wrong");
      firstCard.style.backgroundImage = `url('cards/back.png')`;
      secondCard.style.backgroundImage = `url('cards/back.png')`;
      firstCard = secondCard = null;
      lockBoard = false;
    }, 1000);
  }

  updateStats();
}

board.addEventListener("click", (e) => {
  const card = e.target;
  if (
    !card.classList.contains("card") ||
    card.classList.contains("revealed") ||
    !timerStart ||
    lockBoard
  )
    return;

  revealCard(card);

  if (!firstCard) {
    firstCard = card;
  } else if (!secondCard && card !== firstCard) {
    secondCard = card;
    checkMatch();
  }
});

startBtn.textContent = t.start;
instructions.textContent = t.instructions;

startBtn.addEventListener("click", () => {
  startBtn.remove();
  instructions.remove();
  board.classList.remove("hidden");
  stats.classList.remove("hidden");

  createBoard();
  setTimeout(() => {
    hideAllCards();
    startTimer();
  }, 5000);
});
