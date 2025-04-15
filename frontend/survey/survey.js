const BACKEND_URL = "https://fatigue-backend.onrender.com";

const translations = {
  en: {
    surveyIntro:
      "Thank you for participating. Please answer the following questions.",
    enterCode: "Enter your participant code:",
    verify: "Verify",
    codeInvalid: "Code not found. Please check and try again.",
    saveCode:
      "Your participant code has been generated. Please save it somewhere safe!",
    submit: "Submit",
    thankYou: "Thank you! Your answers have been recorded.",
    reminder:
      "Please remember to return and perform the test again after a mentally exhausting day.",
    errorGeneric: "Something went wrong. Please try again.",
    errorConnection: "Failed to connect to server.",

    q1: "How do you feel?",
    q1o1: "Very tired",
    q1o2: "Tired",
    q1o3: "Okay",
    q1o4: "Rested",
    q1o5: "Very rested",

    q2: "What is your chess experience?",
    q2o1: "I know the rules",
    q2o2: "I've played a few times",
    q2o3: "I play regularly",
    q2o4: "I play in tournaments",
    q2o5: "I'm a professional chess player",

    q3: "Was the difficulty of the first game appropriate?",
    q4: "Was the difficulty of the second game appropriate?",
    q5: "Was the difficulty of the third game appropriate?",
    q3o1: "Too easy",
    q3o2: "Just right",
    q3o3: "Too hard",

    q6: "How satisfying was the first game?",
    q7: "How satisfying was the second game?",
    q8: "How satisfying was the third game?",
    q6o1: "Very unsatisfying",
    q6o2: "Unsatisfying",
    q6o3: "Neutral",
    q6o4: "Satisfying",
    q6o5: "Very satisfying",
  },
  pl: {
    surveyIntro:
      "Dziękujemy za udział w badaniu. Prosimy o odpowiedzi na poniższe pytania.",
    enterCode: "Wprowadź swój kod uczestnika:",
    verify: "Zatwierdź",
    codeInvalid: "Kod nie został znaleziony. Sprawdź i spróbuj ponownie.",
    saveCode:
      "Twój kod uczestnika został wygenerowany. Zapisz go w bezpiecznym miejscu!",
    submit: "Wyślij",
    thankYou: "Dziękujemy! Twoje odpowiedzi zostały zapisane.",
    reminder: "Pamiętaj, aby wrócić i wykonać test ponownie po męczącym dniu.",
    errorGeneric: "Wystąpił błąd. Spróbuj ponownie.",
    errorConnection: "Nie udało się połączyć z serwerem.",

    q1: "Jak się teraz czujesz?",
    q1o1: "Bardzo zmęczony/a",
    q1o2: "Zmęczony/a",
    q1o3: "W porządku",
    q1o4: "Wypoczęty/a",
    q1o5: "Bardzo wypoczęty/a",

    q2: "Jak oceniasz swoje doświadczenie szachowe?",
    q2o1: "Znam zasady",
    q2o2: "Grałem/am kilka razy",
    q2o3: "Gram regularnie",
    q2o4: "Gram w turniejach",
    q2o5: "Jestem zawodowym szachistą / szachistką",

    q3: "Czy poziom trudności pierwszej partii był odpowiedni?",
    q4: "Czy poziom trudności drugiej partii był odpowiedni?",
    q5: "Czy poziom trudności trzeciej partii był odpowiedni?",
    q3o1: "Za łatwy",
    q3o2: "Odpowiedni",
    q3o3: "Za trudny",

    q6: "Jak satysfakcjonująca była pierwsza partia?",
    q7: "Jak satysfakcjonująca była druga partia?",
    q8: "Jak satysfakcjonująca była trzecia partia?",
    q6o1: "Bardzo niesatysfakcjonująca",
    q6o2: "Niesatysfakcjonująca",
    q6o3: "Neutralna",
    q6o4: "Satysfakcjonująca",
    q6o5: "Bardzo satysfakcjonująca",
  },
};

const lang = document.cookie.match(/(?:^|; )lang=([^;]+)/)?.[1] || "en";
const t = translations[lang];

const urlParams = new URLSearchParams(window.location.search);
const mode = urlParams.get("mode") || "rested";
let participantCode = "";

document.getElementById("survey-intro").textContent = t.surveyIntro;
document.getElementById("submit-btn").textContent = t.submit;

const questions = [
  ["q1", ["q1o1", "q1o2", "q1o3", "q1o4", "q1o5"]],
  ["q2", ["q2o1", "q2o2", "q2o3", "q2o4", "q2o5"]],
  ["q3", ["q3o1", "q3o2", "q3o3"]],
  ["q4", ["q3o1", "q3o2", "q3o3"]],
  ["q5", ["q3o1", "q3o2", "q3o3"]],
  ["q6", ["q6o1", "q6o2", "q6o3", "q6o4", "q6o5"]],
  ["q7", ["q6o1", "q6o2", "q6o3", "q6o4", "q6o5"]],
  ["q8", ["q6o1", "q6o2", "q6o3", "q6o4", "q6o5"]],
];

const form = document.getElementById("survey-form");

// -------- RESTED --------
if (mode === "rested") {
  participantCode = generateCode();
  document
    .getElementById("generated-code-container")
    .classList.remove("hidden");
  document.getElementById("generated-code-label").textContent = t.saveCode;
  document.getElementById("generated-code-display").textContent =
    participantCode;
  showSurvey();
}

// -------- TIRED --------
else if (mode === "tired") {
  document.getElementById("code-entry").classList.remove("hidden");
  document.getElementById("code-entry-label").textContent = t.enterCode;
  document.getElementById("verify-code-btn").textContent = t.verify;

  document.getElementById("verify-code-btn").addEventListener("click", () => {
    const inputCode = document
      .getElementById("participant-code-input")
      .value.trim();
    verifyCode(inputCode).then((valid) => {
      if (valid) {
        participantCode = inputCode;
        document.getElementById("code-entry").classList.add("hidden");
        showSurvey();
      } else {
        alert(t.codeInvalid);
      }
    });
  });
}

function showSurvey() {
  form.classList.remove("hidden");
  document.getElementById("submit-btn").classList.remove("hidden");

  questions.forEach(([qKey, options]) => {
    const fieldset = document.createElement("fieldset");
    const legend = document.createElement("legend");
    legend.textContent = t[qKey];
    fieldset.appendChild(legend);

    options.forEach((opt) => {
      const label = document.createElement("label");
      label.className = "option-label";
      const input = document.createElement("input");
      input.type = "radio";
      input.name = qKey;
      input.value = opt;
      label.appendChild(input);
      label.appendChild(document.createTextNode(t[opt]));
      fieldset.appendChild(label);
    });

    form.appendChild(fieldset);
  });
}

document.getElementById("submit-btn").addEventListener("click", () => {
  const surveyResults = {};
  let incomplete = false;

  questions.forEach(([qKey]) => {
    const selected = form.querySelector(`input[name="${qKey}"]:checked`);
    if (!selected) incomplete = true;
    surveyResults[qKey] = selected ? selected.value : null;
  });

  if (incomplete) {
    alert(
      lang === "pl"
        ? "Proszę odpowiedzieć na wszystkie pytania."
        : "Please answer all questions before submitting."
    );
    return;
  }

  const finalResults = {
    participantCode: participantCode,
    survey: surveyResults,
    towerOfLondon: JSON.parse(localStorage.getItem("london_results") || "[]"),
    matchPairs: {
      time: parseInt(localStorage.getItem("matchpairs_time")),
      mistakes: parseInt(localStorage.getItem("matchpairs_mistakes")),
    },
    stroop: {
      trials: JSON.parse(localStorage.getItem("stroop_results") || "[]"),
      mistakes: parseInt(localStorage.getItem("stroop_mistakes")),
    },
    winsconsin: JSON.parse(localStorage.getItem("winsconsin_results") || "[]"),
    chess: JSON.parse(localStorage.getItem("chess_results") || "[]"),
  };

  const endpoint =
    mode === "rested"
      ? "/submit/rested"
      : mode === "tired1"
      ? "/submit/tired1"
      : "/submit/tired2";

  fetch(`${BACKEND_URL}${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(finalResults),
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.status === "ok") {
        const submitBtn = document.getElementById("submit-btn");
        submitBtn.disabled = true;
        submitBtn.style.opacity = "0.5";
        submitBtn.style.cursor = "not-allowed";

        const message = document.createElement("p");
        message.style.marginTop = "2em";
        message.style.fontSize = "1.2em";
        message.style.fontWeight = "bold";
        message.textContent = `${t.thankYou} ${t.reminder}`;
        document.querySelector(".container").appendChild(message);
      } else {
        alert(t.errorGeneric || "Something went wrong. Please try again.");
      }
    })
    .catch(() => {
      alert(t.errorConnection || "Failed to connect to server.");
    });

  const submitBtn = document.getElementById("submit-btn");
  submitBtn.disabled = true;
  submitBtn.style.opacity = "0.5";
  submitBtn.style.cursor = "not-allowed";

  const message = document.createElement("p");
  message.style.marginTop = "2em";
  message.style.fontSize = "1.2em";
  message.style.fontWeight = "bold";
  message.textContent = `${t.thankYou} ${t.reminder}`;

  document.querySelector(".container").appendChild(message);
});

// --- Utils ---
function generateCode() {
  return "C" + Math.random().toString(36).substr(2, 8).toUpperCase();
}

function verifyCode(code) {
  return fetch(`${BACKEND_URL}/check?code=${encodeURIComponent(code)}`)
    .then((res) => res.json())
    .then((data) => data.exists)
    .catch(() => false);
}
