const translations = {
  en: {
    instructions:
      "When the screen turns green, click as quickly as you can. Test will be performed 5 times.",
    start: "I understand",
    wait: "Wait for green...",
    clickNow: "CLICK!",
    tooSoon: "Too soon! Wait for green.",
    result: (ms) => `Your time: ${ms} ms`,
    continue: "Press to continue",
  },
  pl: {
    instructions:
      "Gdy ekran zmieni kolor na zielony, kliknij najszybciej jak potrafisz. Test zostanie wykonany 5 razy.",
    start: "Rozumiem",
    wait: "Czekaj na zielony...",
    clickNow: "KLIKNIJ!",
    tooSoon: "Za wcześnie! Czekaj na zielony.",
    result: (ms) => `Twój czas: ${ms} ms`,
    continue: "Kliknij, aby kontynuować",
  },
};

function getSavedLanguage() {
  const match = document.cookie.match(/(?:^|; )lang=([^;]+)/);
  return match ? match[1] : "en";
}

const lang = getSavedLanguage();
const t = translations[lang];

const gameDiv = document.getElementById("game");
const instructionsP = document.getElementById("instructions");
const startBtn = document.getElementById("start-btn");

let round = 0;
const results = [];
let waiting = false;
let timeout;
let startTime;

function setScreen(color, text) {
  gameDiv.style.backgroundColor = color;
  instructionsP.textContent = text;
  if (color == "white") {
    instructionsP.style.color = "black";
  } else {
    instructionsP.style.color = "white";
  }
}

function startRound() {
  waiting = true;
  setScreen("#cc4444", t.wait); // soft red
  timeout = setTimeout(() => {
    waiting = false;
    setScreen("#44cc44", t.clickNow); // green
    startTime = performance.now();
  }, 2000 + Math.random() * 3000);
}

function handleClick() {
  if (round >= 5) {
    setScreen("#4477cc", t.continue); // blue
    console.log("Reflex times:", results);
    gameDiv.addEventListener(
      "click",
      () => {
        localStorage.setItem("reflex_results", JSON.stringify(results));
        window.location.href = "../game2/index.html";
      },
      { once: true }
    );
    return;
  }

  if (waiting) {
    clearTimeout(timeout);
    setScreen("#cc4444", t.tooSoon);
    setTimeout(startRound, 1000);
    return;
  }

  if (startTime) {
    const time = Math.floor(performance.now() - startTime);
    results.push(time);
    round += 1;
    setScreen("#4477cc", t.result(time)); // blue
    setTimeout(() => {
      if (round < 5) {
        startRound();
      } else {
        setScreen("#4477cc", t.continue);
      }
    }, 1500);
    startTime = null;
  }
}

startBtn.textContent = t.start;
instructionsP.textContent = t.instructions;
startBtn.addEventListener("click", () => {
  startBtn.remove();
  startRound();
  gameDiv.addEventListener("click", handleClick);
});
