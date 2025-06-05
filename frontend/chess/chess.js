const translations = {
  en: {
    instructions:
      "You will now play three games of chess. Before each game, you will choose a difficulty using a slider. Each game lasts 5 minutes, with a 5-second increment per move.",
    start: "I understand",
    setupInstructions: "Choose a difficulty below to begin.",
    difficultyLabel: "Difficulty: ",
    startWithSlider: "Start",
    playerTurn: "Your turn",
    computerTurn: "Computer's turn",
    you: "You",
    computer: "Computer",
    playerInCheck: "You are in check!",
    computerInCheck: "Computer is in check!",
    surrender: "Surrender",
    confirmSurrender: "Are you sure you want to surrender?",
    youSurrendered: "You surrendered.",
    nextGame: "Play next game",
    continue: "Continue",
    gameWin: "Checkmate! You win!",
    gameLoss: "Checkmate! You lose.",
    gameDraw: "It's a draw.",
    gameOver: "Game over",
  },
  pl: {
    instructions:
      "Zagrasz teraz trzy partie szachów. Przed każdą partią wybierzesz poziom trudności za pomocą suwaka. Każda gra trwa 5 minut, z dodatkowymi 5 sekundami za każdy ruch.",
    start: "Rozumiem",
    setupInstructions: "Wybierz poziom trudności poniżej, aby rozpocząć.",
    difficultyLabel: "Poziom trudności: ",
    startWithSlider: "Rozpocznij",
    playerTurn: "Twoja tura",
    computerTurn: "Tura komputera",
    you: "Ty",
    computer: "Komputer",
    playerInCheck: "Jesteś szachowany!",
    computerInCheck: "Komputer jest szachowany!",
    surrender: "Poddaj się",
    confirmSurrender: "Czy na pewno chcesz się poddać?",
    youSurrendered: "Poddajesz się.",
    nextGame: "Zagraj kolejną partię",
    continue: "Kontynuuj",
    gameWin: "Szach mat! Wygrałeś.",
    gameLoss: "Szach mat! Przegrałeś.",
    gameDraw: "Remis.",
    gameOver: "Koniec gry",
  },
};
const BACKEND_URL = "https://fatigue-backend.onrender.com";

document.addEventListener("DOMContentLoaded", () => {
  const lang = document.cookie.match(/(?:^|; )lang=([^;]+)/)?.[1] || "en";
  const t = translations[lang];
  localStorage.setItem("chess_results", "[]");
  let board;
  let game;
  let playerTime;
  let computerTime;
  let turn;
  let gameInterval;
  let gameCount = 0;

  const stockfish = new Worker("engine/stockfish.js");

  function sendToEngine(cmd) {
    stockfish.postMessage(cmd);
    console.log("→ Engine:", cmd);
  }

  stockfish.onmessage = function (e) {
    console.log("← Engine:", e.data);

    if (e.data.startsWith("bestmove")) {
      const move = e.data.split(" ")[1];
      if (move) {
        const from = move.slice(0, 2);
        const to = move.slice(2, 4);
        const moveObj = { from, to };

        const piece = game.get(from);
        if (
          piece?.type === "p" &&
          ((piece.color === "w" && to[1] === "8") ||
            (piece.color === "b" && to[1] === "1"))
        ) {
          moveObj.promotion = "q";
        }

        game.move(moveObj);
        board.position(game.fen());
        computerTime += 5;
        setTurn("player");
      }
    }
  };

  sendToEngine("uci");

  document.getElementById("chess-instructions").textContent = t.instructions;
  document.getElementById("chess-start-btn").textContent = t.start;

  document.getElementById("chess-start-btn").addEventListener("click", () => {
    document.getElementById("game").classList.add("hidden");
    document.getElementById("chess-setup").classList.remove("hidden");

    document.getElementById("chess-setup-instructions").textContent =
      t.setupInstructions;
    document.getElementById(
      "slider-label"
    ).textContent = `${t.difficultyLabel}5`;
    document.getElementById("start-slider-btn").textContent = t.startWithSlider;
  });

  const slider = document.getElementById("difficulty-slider");
  slider.addEventListener("input", () => {
    document.getElementById(
      "slider-label"
    ).textContent = `${t.difficultyLabel}${slider.value}`;
  });

  document
    .getElementById("start-slider-btn")
    .addEventListener("click", async () => {
      const rawDifficulty = parseInt(slider.value);
      const testMode = localStorage.getItem("test_mode");
      const button = document.getElementById("start-slider-btn");
      button.disabled = true;
      if (testMode === "tired2") {
        const participantCode =
          localStorage.getItem("participant_code") || null;
        const wiscData = JSON.parse(localStorage.getItem("winsconsin_results"));
        try {
          const res = await fetch(
            `${BACKEND_URL}/predict_difficulty_adjustment`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                participant_code: participantCode,
                winsconsin_results: wiscData,
                difficulty: rawDifficulty,
              }),
            }
          );
          const result = await res.json();
          console.log("Suggested difficulty:", result.suggested_difficulty);
          startChessGame(result.suggested_difficulty);
        } catch (e) {
          console.error("Error fetching difficulty adjustment:", e);
          startChessGame(rawDifficulty);
        }
      } else {
        startChessGame(rawDifficulty);
      }
      button.disabled = false;
    });

  function startChessGame(difficulty) {
    localStorage.setItem("chess_difficulty", difficulty);
    document.getElementById("chess-setup").classList.add("hidden");
    document.getElementById("chess-container").classList.remove("hidden");
    document.getElementById("turn-indicator").textContent = t.playerTurn;
    document.getElementById("player-label").textContent = t.you;
    document.getElementById("computer-label").textContent = t.computer;
    document.getElementById("surrender-btn").textContent = t.surrender;

    document.getElementById("surrender-btn").classList.remove("hidden");
    document.getElementById("surrender-btn").onclick = () => {
      if (confirm(t.confirmSurrender)) {
        endGame(t.youSurrendered, "loss");
      }
    };

    function applyStockfishDifficulty(level) {
      const thinkTime = Math.floor(50 + level * 75);
      sendToEngine("uci");
      sendToEngine(`setoption name Skill Level value ${level}`);
      sendToEngine(`setoption name Move Overhead value 0`);
      sendToEngine(`setoption name Minimum Thinking Time value 1`);
      sendToEngine(
        `setoption name Slow Mover value ${Math.max(10, 100 - level * 3)}`
      );
      sendToEngine(`setoption name Contempt value ${level < 5 ? 100 : 0}`);
      window.stockfishThinkTime = thinkTime;
    }
    applyStockfishDifficulty(difficulty);

    playerTime = 300;
    computerTime = 300;
    turn = "player";
    updateTimers();
    startTimers();
    game = new Chess();
    waitForChessboardToBeVisible(() => {
      board = Chessboard(document.getElementById("chess-board"), {
        draggable: true,
        position: "start",
        onDrop: onPlayerMove,
        pieceTheme: "pieces/{piece}.png",
      });
    });
    gameCount++;
  }

  function waitForChessboardToBeVisible(callback, retries = 10) {
    const el = document.getElementById("chess-board");
    const isVisible =
      el.offsetWidth > 0 &&
      el.offsetHeight > 0 &&
      window.getComputedStyle(el).display !== "none";
    if (isVisible) callback();
    else if (retries > 0)
      setTimeout(() => waitForChessboardToBeVisible(callback, retries - 1), 50);
    else console.error("Chess board never became visible.");
  }

  function updateTimers() {
    const pt = `${String(Math.floor(playerTime / 60)).padStart(
      2,
      "0"
    )}:${String(playerTime % 60).padStart(2, "0")}`;
    const ct = `${String(Math.floor(computerTime / 60)).padStart(
      2,
      "0"
    )}:${String(computerTime % 60).padStart(2, "0")}`;
    document.getElementById("player-timer").textContent = pt;
    document.getElementById("computer-timer").textContent = ct;
  }

  function startTimers() {
    gameInterval = setInterval(() => {
      if (turn === "player") playerTime--;
      else computerTime--;
      updateTimers();
    }, 1000);
  }

  function setTurn(newTurn) {
    turn = newTurn;
    document.getElementById("turn-indicator").textContent =
      turn === "player" ? t.playerTurn : t.computerTurn;
    if (game.in_checkmate())
      return endGame(
        turn === "player" ? t.gameLoss : t.gameWin,
        turn === "player" ? "loss" : "win"
      );
    if (game.in_stalemate()) return endGame(t.gameDraw, "draw");
    if (game.in_draw()) return endGame(t.gameDraw, "draw");
    const warning = document.getElementById("check-warning");
    if (game.in_check()) {
      warning.textContent =
        turn === "player" ? t.playerInCheck : t.computerInCheck;
      warning.classList.remove("hidden");
    } else warning.classList.add("hidden");
    highlightCheckedKing();
  }

  function highlightCheckedKing() {
    document
      .querySelectorAll(".checked-king")
      .forEach((el) => el.classList.remove("checked-king"));
    if (!game.in_check()) return;
    const turnColor = game.turn();
    const boardState = game.board();
    for (let rank = 0; rank < 8; rank++) {
      for (let file = 0; file < 8; file++) {
        const piece = boardState[rank][file];
        if (piece && piece.type === "k" && piece.color === turnColor) {
          const square = "abcdefgh"[file] + (8 - rank);
          const el = document.querySelector(`.square-${square}`);
          if (el) el.classList.add("checked-king");
        }
      }
    }
  }

  function endGame(message, outcome = "draw") {
    clearInterval(gameInterval);
    document.getElementById("chess-container").classList.add("hidden");
    document.getElementById("surrender-btn").classList.add("hidden");
    document.getElementById("check-warning").classList.add("hidden");

    // Save current game result
    const history = game.history({ verbose: true }) || [];
    const moves = history.map((m) => ({
      from: m.from,
      to: m.to,
      promotion: m.promotion || null,
      color: m.color,
      piece: m.piece,
      san: m.san,
    }));
    const result = {
      game: gameCount,
      winner: message.includes("win")
        ? "player"
        : message.includes("lose")
        ? "computer"
        : "draw",
      moves: moves,
    };

    // Show postgame screen
    const postGame = document.getElementById("post-game");
    postGame.classList.remove("hidden");

    const text = document.getElementById("post-game-text");
    const button = document.getElementById("post-game-btn");

    const chessResults = JSON.parse(
      localStorage.getItem("chess_results") || "[]"
    );
    chessResults.push({
      game: gameCount,
      result: outcome,
      difficulty: parseInt(localStorage.getItem("chess_difficulty") || "0"),
      moves: history.map((m) => ({
        from: m.from,
        to: m.to,
        promotion: m.promotion || null,
        color: m.color,
        piece: m.piece,
        san: m.san,
      })),
    });
    localStorage.setItem("chess_results", JSON.stringify(chessResults));

    text.textContent = message;
    if (gameCount < 3) {
      button.textContent = t.nextGame;
      button.onclick = () => {
        postGame.classList.add("hidden");
        document.getElementById("chess-setup").classList.remove("hidden");
      };
    } else {
      button.textContent = t.continue;
      button.onclick = () => {
        window.location.href = "../survey/index.html";
      };
    }
  }

  function onPlayerMove(source, target) {
    const move = game.move({ from: source, to: target, promotion: "q" });
    if (move === null) return "snapback";
    board.position(game.fen());
    playerTime += 5;
    setTimeout(() => {
      setTurn("computer");
      makeComputerMove();
    }, 100);
  }

  function makeComputerMove() {
    if (game.game_over()) {
      // The game should already have been handled in setTurn
      return;
    }

    const history = game.history({ verbose: true }) || [];
    const moves = history
      .map((m) => m.from + m.to + (m.promotion || ""))
      .join(" ");
    sendToEngine(`position startpos moves ${moves}`);
    sendToEngine(`go movetime ${window.stockfishThinkTime || 1000}`);
  }
});
