const translations = {
  en: {
    instructions:
      "Move the colored balls to match the goal configuration. You may move only one ball at a time, by clicking to pick it up, and clicking again to drop it. Larger balls cannot be placed on smaller ones. Try to complete the puzzle in as few moves as possible.",
    start: "I understand",
    goal: "Goal",
    board: "Your Board",
    puzzleComplete: "Puzzle complete!",
    moves: "Moves",
    time: "Time",
    nextPuzzle: "Next puzzle",
    continue: "Continue",
  },
  pl: {
    instructions:
      "Przenieś kolorowe kule, aby uzyskać układ zgodny z celem. Możesz przesuwać tylko jedną kulę naraz, klikając, aby ją podnieść, i klikając ponownie, aby ją upuścić. Większe kule nie mogą być umieszczane na mniejszych. Postaraj się rozwiązać zagadkę w jak najmniejszej liczbie ruchów.",
    start: "Rozumiem",
    goal: "Cel",
    board: "Twoja plansza",
    puzzleComplete: "Zadanie ukończone!",
    moves: "Ruchy",
    time: "Czas",
    nextPuzzle: "Dalej do kolejnej układanki",
    continue: "Kontynuuj",
  },
};

function getSavedLanguage() {
  const match = document.cookie.match(/(?:^|; )lang=([^;]+)/);
  return match ? match[1] : "en";
}

const lang = getSavedLanguage();
const t = translations[lang];
localStorage.setItem("london_results", "[]");
let heldBall = null;
let moveCount = 0;
let moveCounterDisplay;
let currentPuzzle = null;
let startTime = null;
let puzzleIndices = [];
let currentIndex = 0;

document.getElementById("instructions").textContent = t.instructions;
document.getElementById("start-btn").textContent = t.start;

document.getElementById("start-btn").addEventListener("click", () => {
  document.getElementById("instructions").remove();
  document.getElementById("start-btn").remove();
  document.getElementById("board").classList.remove("hidden");

  const stage = getTestStage();
  if (stage === "relaxed") puzzleIndices = [0, 1];
  else if (stage === "tired1") puzzleIndices = [2, 3];
  else if (stage === "tired2") puzzleIndices = [4, 5];
  else puzzleIndices = [0, 1]; // fallback

  currentIndex = 0;

  loadPuzzle(puzzles[puzzleIndices[currentIndex]]);
});

const puzzles = [
  {
    start: [[5, 4, 3, 2, 1], [], []],
    goal: [[], [], [5, 4, 3, 2, 1]],
  },
  {
    start: [[3, 2, 1], [5], [4]],
    goal: [[1], [3, 2], [5, 4]],
  },
  {
    start: [[5, 4, 3], [2, 1], []],
    goal: [[], [5, 4], [3, 2, 1]],
  },
  {
    start: [[5, 4, 1], [3], [2]],
    goal: [[5, 1], [4], [3, 2]],
  },
  {
    start: [[4, 2], [5, 3, 1], []],
    goal: [[4], [3], [5, 2, 1]],
  },
  {
    start: [[2], [4, 1], [5, 3]],
    goal: [[5, 4], [3], [2, 1]],
  },
];

function getTestStage() {
  const match = document.cookie.match(/(?:^|; )stage=([^;]+)/);
  return match ? match[1] : "relaxed"; // default fallback
}

function loadPuzzle(puzzle) {
  moveCount = 0;
  heldBall = null;

  currentPuzzle = puzzle;
  startTime = performance.now();
  const board = document.getElementById("board");
  board.innerHTML = "";

  createBoardSection("board", puzzle.start, "start", board);
  createBoardSection("goal", puzzle.goal, "goal", board);
}

function createBoardSection(label, layout, type, container) {
  const section = document.createElement("div");
  section.classList.add("board-section");

  const labelEl = document.createElement("div");
  labelEl.classList.add("peg-label");
  labelEl.textContent = type === "goal" ? t.goal : t.board;
  section.appendChild(labelEl);

  const pegRow = document.createElement("div");
  pegRow.classList.add("peg-row");

  for (let i = 0; i < 3; i++) {
    const peg = document.createElement("div");
    peg.classList.add("peg");
    if (type === "goal") peg.classList.add("goal");
    peg.dataset.peg = i;
    peg.dataset.type = type;

    const balls = layout[i];
    for (let j = 0; j < balls.length; j++) {
      const size = balls[j];
      const ball = document.createElement("div");
      ball.classList.add("ball", `size-${size}`);
      ball.dataset.size = size;
      ball.dataset.peg = i;
      peg.appendChild(ball);
    }

    pegRow.appendChild(peg);
    if (type === "start") {
      peg.addEventListener("click", () => handlePegClick(peg));
    }
  }

  section.appendChild(pegRow);
  container.appendChild(section);
}

function handlePegClick(peg) {
  const balls = Array.from(peg.querySelectorAll(".ball"));
  const topBall = balls[balls.length - 1];

  if (heldBall === null) {
    if (!topBall) return;
    heldBall = topBall;
    heldBall.classList.add("held");
  } else {
    const pegTop = balls[balls.length - 1];
    const heldSize = parseInt(heldBall.dataset.size);
    const topSize = pegTop ? parseInt(pegTop.dataset.size) : 0;
    const currentPeg = heldBall.parentElement;

    if (!pegTop || heldSize < topSize || currentPeg === peg) {
      peg.appendChild(heldBall);
      heldBall.classList.remove("held");
      heldBall = null;
      moveCount++;
      updateMoveCounter();
      if (checkPuzzleComplete()) {
        endPuzzle();
      }
    }
  }
}

function updateMoveCounter() {
  console.log("Move:", moveCount);
}

function checkPuzzleComplete() {
  const playerSection = document.querySelector(
    '[data-type="start"]'
  ).parentElement;
  const pegs = Array.from(playerSection.querySelectorAll(".peg"));

  for (let i = 0; i < 3; i++) {
    const peg = pegs[i];
    const expected = currentPuzzle.goal[i];
    const actual = Array.from(peg.querySelectorAll(".ball")).map((ball) =>
      parseInt(ball.dataset.size)
    );

    if (actual.length !== expected.length) return false;

    for (let j = 0; j < actual.length; j++) {
      if (actual[j] !== expected[j]) return false;
    }
  }
  return true;
}

function endPuzzle() {
  const timeTaken = Math.floor(performance.now() - startTime);
  const result = {
    puzzle: puzzleIndices[currentIndex],
    moves: moveCount,
    timeMs: timeTaken,
  };

  const results = JSON.parse(localStorage.getItem("london_results") || "[]");
  results.push(result);
  localStorage.setItem("london_results", JSON.stringify(results));

  const container = document.getElementById("game");
  const message = document.createElement("div");
  message.style.marginTop = "2em";
  message.innerHTML = `
  <h2 style="color: green">${t.puzzleComplete}</h2>
  <p>${t.moves}: ${result.moves}</p>
  <p>${t.time}: ${Math.round(result.timeMs / 1000)}s</p>
`;

  const button = document.createElement("button");
  button.style.marginTop = "1em";
  button.style.padding = "1em 2em";
  button.style.fontSize = "1.2em";
  button.style.borderRadius = "8px";
  button.style.cursor = "pointer";

  if (currentIndex < 1) {
    button.textContent = t.nextPuzzle;
    button.addEventListener("click", () => {
      currentIndex++;
      loadPuzzle(puzzles[puzzleIndices[currentIndex]]);
      message.remove();
      button.remove();
    });
  } else {
    button.textContent = t.continue;
    button.addEventListener("click", () => {
      window.location.href = "../reflex/index.html";
    });
  }

  container.appendChild(message);
  container.appendChild(button);
}
