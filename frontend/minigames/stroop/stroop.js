const translations = {
  en: {
    instructions:
      "You will see a color word displayed in a different color. Your task is to click the button matching the COLOR OF THE TEXT, not the word. Try to be fast and accurate. There will be 30 trials.",
    start: "I understand",
    finish: "You have completed the Stroop minigame!",
    continue: "Continue",
    correct: "Correct",
    mistakes: "Mistakes",
  },
  pl: {
    instructions:
      "Zobaczysz nazwę koloru wyświetloną w innym kolorze. Twoim zadaniem jest kliknięcie przycisku odpowiadającego KOLOROWI TEKSTU, a nie samego słowa. Staraj się być szybki i dokładny. Test składa się z 30 prób.",
    start: "Rozumiem",
    finish: "Zakończyłeś test Stroopa!",
    continue: "Kontynuuj",
    correct: "Poprawne",
    mistakes: "Błędy",
  },
};

const correctCounter = document.getElementById("correct-counter");
const mistakeCounter = document.getElementById("mistake-counter");

let correctAnswers = 0;
let currentFontColor = "";
let trialStartTime = null;
let trialIndex = 0;
let trials = [];
let mistakes = 0;
let lastTrials = [];
const TOTAL_TRIALS = 30;

function getSavedLanguage() {
  const match = document.cookie.match(/(?:^|; )lang=([^;]+)/);
  return match ? match[1] : "en";
}

const lang = getSavedLanguage();
const t = translations[lang];
localStorage.setItem("stroop_results", "[]");
localStorage.setItem("stroop_mistakes", "0");
document.getElementById("instructions").textContent = t.instructions;
document.getElementById("start-btn").textContent = t.start;

document.getElementById("start-btn").addEventListener("click", () => {});

const colorValues = ["red", "green", "blue", "yellow"];
const colorNames = {
  en: ["Red", "Green", "Blue", "Yellow"],
  pl: ["Czerwony", "Zielony", "Niebieski", "Żółty"],
};

const wordDisplay = document.getElementById("stroop-word");
const area = document.getElementById("stroop-area");
const buttonContainer = document.getElementById("color-buttons");

document.getElementById("start-btn").addEventListener("click", () => {
  document.getElementById("start-btn").remove();
  document.getElementById("instructions").remove();
  area.classList.remove("hidden");

  showStroopTrial();
});

function showStroopTrial() {
  if (trialIndex >= TOTAL_TRIALS) {
    return endStroopTest();
  }

  let word, fontColor;
  let last = lastTrials[lastTrials.length - 1] || {};
  let secondLast = lastTrials[lastTrials.length - 2] || {};

  do {
    word = colorValues[Math.floor(Math.random() * colorValues.length)];
    fontColor = colorValues[Math.floor(Math.random() * colorValues.length)];
  } while (
    (word === last.word && fontColor === last.color) ||
    (word === last.word && word === secondLast.word) ||
    (fontColor === last.color && fontColor === secondLast.color)
  );

  lastTrials.push({ word, color: fontColor });
  if (lastTrials.length > 2) lastTrials.shift();

  currentFontColor = fontColor;
  wordDisplay.textContent = colorNames[lang][colorValues.indexOf(word)];
  wordDisplay.style.color = fontColor === "yellow" ? "#d4af37" : fontColor;

  trialStartTime = performance.now();
  renderColorButtons(fontColor);

  trialIndex++;
}

function updateStroopCounters() {
  correctCounter.textContent = `${t.correct}: ${correctAnswers}`;
  mistakeCounter.textContent = `${t.mistakes}: ${mistakes}`;
}

function renderColorButtons(correctColor) {
  buttonContainer.innerHTML = "";
  colorValues.forEach((color, index) => {
    const btn = document.createElement("button");
    btn.textContent = colorNames[lang][index];
    btn.style.backgroundColor = color == "yellow" ? "#d4af37" : color;
    btn.dataset.color = color;
    btn.addEventListener("click", () => {
      const reactionTime = Math.floor(performance.now() - trialStartTime);
      const correct = color === currentFontColor;

      if (correct) {
        correctAnswers++;
      } else {
        mistakes++;
      }

      trials.push({
        trial: trialIndex,
        word: wordDisplay.textContent,
        fontColor: currentFontColor,
        answer: color,
        correct: correct,
        timeMs: reactionTime,
      });

      updateStroopCounters();
      showStroopTrial();
    });
    buttonContainer.appendChild(btn);
  });
}

function endStroopTest() {
  area.classList.add("hidden");

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

  const msg = document.createElement("p");
  msg.textContent = `${t.finish}`;
  msg.style.fontSize = "2em";
  msg.style.marginBottom = "20px";

  const btn = document.createElement("button");
  btn.textContent = t.continue;
  btn.style.fontSize = "1.2em";
  btn.style.padding = "1em 2em";
  btn.style.borderRadius = "8px";
  btn.style.backgroundColor = "#007bff";
  btn.style.color = "white";
  btn.style.border = "none";
  btn.style.cursor = "pointer";

  btn.addEventListener("click", () => {
    localStorage.setItem("stroop_results", JSON.stringify(trials));
    localStorage.setItem("stroop_mistakes", mistakes);
    window.location.href = "../winsconsin/index.html";
  });

  endScreen.appendChild(msg);
  endScreen.appendChild(btn);
  document.body.appendChild(endScreen);
}
