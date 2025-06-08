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

    q0: "What is your gender?",
    q0o1: "Male",
    q0o2: "Female",
    q0o3: "Other",
    q0o4: "Prefer not to say",

    q1: "What is your age group?",
    q1o1: "Under 18",
    q1o2: "18–24",
    q1o3: "25–34",
    q1o4: "35–44",
    q1o5: "45 and above",

    q2: "What is your experience with computer games?",
    q2o1: "None",
    q2o2: "Occasionally",
    q2o3: "Regularly",
    q2o4: "Expert level",

    q3: "How do you feel?",
    q3o1: "Very tired",
    q3o2: "Tired",
    q3o3: "Okay",
    q3o4: "Rested",
    q3o5: "Very rested",

    q4: "What is your chess experience?",
    q4o1: "I know the rules",
    q4o2: "I've played a few times",
    q4o3: "I play regularly",
    q4o4: "I play in tournaments",
    q4o5: "I'm a professional chess player",

    q5: "Was the difficulty of the first game appropriate?",
    q6: "Was the difficulty of the second game appropriate?",
    q7: "Was the difficulty of the third game appropriate?",
    q5o1: "Too easy",
    q5o2: "Just right",
    q5o3: "Too hard",

    q8: "How satisfying was the first game?",
    q9: "How satisfying was the second game?",
    q10: "How satisfying was the third game?",
    q8o1: "Very unsatisfying",
    q8o2: "Unsatisfying",
    q8o3: "Neutral",
    q8o4: "Satisfying",
    q8o5: "Very satisfying",
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

    q0: "Jaka jest Twoja płeć?",
    q0o1: "Mężczyzna",
    q0o2: "Kobieta",
    q0o3: "Inna",
    q0o4: "Wolę nie mówić",

    q1: "Jaki jest Twój przedział wiekowy?",
    q1o1: "Poniżej 18 lat",
    q1o2: "18–24 lata",
    q1o3: "25–34 lata",
    q1o4: "35–44 lata",
    q1o5: "45 lat lub więcej",

    q2: "Jakie masz doświadczenie z grami komputerowymi?",
    q2o1: "Brak",
    q2o2: "Okazjonalne",
    q2o3: "Regularne",
    q2o4: "Poziom eksperta",

    q3: "Jak się teraz czujesz?",
    q3o1: "Bardzo zmęczony/a",
    q3o2: "Zmęczony/a",
    q3o3: "W porządku",
    q3o4: "Wypoczęty/a",
    q3o5: "Bardzo wypoczęty/a",

    q4: "Jak oceniasz swoje doświadczenie szachowe?",
    q4o1: "Znam zasady",
    q4o2: "Grałem/am kilka razy",
    q4o3: "Gram regularnie",
    q4o4: "Gram w turniejach",
    q4o5: "Jestem zawodowym szachistą / szachistką",

    q5: "Czy poziom trudności pierwszej partii był odpowiedni?",
    q6: "Czy poziom trudności drugiej partii był odpowiedni?",
    q7: "Czy poziom trudności trzeciej partii był odpowiedni?",
    q5o1: "Za łatwy",
    q5o2: "Odpowiedni",
    q5o3: "Za trudny",

    q8: "Jak satysfakcjonująca była pierwsza partia?",
    q9: "Jak satysfakcjonująca była druga partia?",
    q10: "Jak satysfakcjonująca była trzecia partia?",
    q8o1: "Bardzo niesatysfakcjonująca",
    q8o2: "Niesatysfakcjonująca",
    q8o3: "Neutralna",
    q8o4: "Satysfakcjonująca",
    q8o5: "Bardzo satysfakcjonująca",
  },
};

const lang = document.cookie.match(/(?:^|; )lang=([^;]+)/)?.[1] || "en";
const t = translations[lang];

const mode = localStorage.getItem("test_mode") || "rested";
let participantCode = "";

document.getElementById("survey-intro").textContent = t.surveyIntro;
document.getElementById("submit-btn").textContent = t.submit;

const questions = [
  ["q0", ["q0o1", "q0o2", "q0o3", "q0o4"]],
  ["q1", ["q1o1", "q1o2", "q1o3", "q1o4", "q1o5"]],
  ["q2", ["q2o1", "q2o2", "q2o3", "q2o4"]],
  ["q3", ["q3o1", "q3o2", "q3o3", "q3o4", "q3o5"]],
  ["q4", ["q4o1", "q4o2", "q4o3", "q4o4", "q4o5"]],
  ["q5", ["q5o1", "q5o2", "q5o3"]],
  ["q6", ["q5o1", "q5o2", "q5o3"]],
  ["q7", ["q5o1", "q5o2", "q5o3"]],
  ["q8", ["q8o1", "q8o2", "q8o3", "q8o4", "q8o5"]],
  ["q9", ["q8o1", "q8o2", "q8o3", "q8o4", "q8o5"]],
  ["q10", ["q8o1", "q8o2", "q8o3", "q8o4", "q8o5"]],
];

const form = document.getElementById("survey-form");

if (mode === "rested") {
  participantCode = generateCode();
  document
    .getElementById("generated-code-container")
    .classList.remove("hidden");
  document.getElementById("generated-code-label").textContent = t.saveCode;
  document.getElementById("generated-code-display").textContent =
    participantCode;
  showSurvey();
} else if (mode === "tired1") {
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
} else if (mode === "tired2") {
  const storedCode = localStorage.getItem("participant_code");
  if (storedCode && storedCode.trim() !== "") {
    participantCode = storedCode.trim();
  } else {
    participantCode =
      "ANON_" + Math.random().toString(36).substr(2, 6).toUpperCase();
  }
  showSurvey();
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

  const finalResults =
    mode === "tired2"
      ? {
          participantCode: participantCode,
          survey: surveyResults,
          winsconsin: JSON.parse(
            localStorage.getItem("winsconsin_results") || "[]"
          ),
          chess: JSON.parse(localStorage.getItem("chess_results") || "[]"),
          predictedTired: localStorage.getItem("tiredness_prediction"),
        }
      : {
          participantCode: participantCode,
          survey: surveyResults,
          towerOfLondon: JSON.parse(
            localStorage.getItem("london_results") || "[]"
          ),
          matchPairs: {
            time: parseInt(localStorage.getItem("matchpairs_time")),
            mistakes: parseInt(localStorage.getItem("matchpairs_mistakes")),
          },
          stroop: {
            trials: JSON.parse(localStorage.getItem("stroop_results") || "[]"),
            mistakes: parseInt(localStorage.getItem("stroop_mistakes")),
          },
          winsconsin: JSON.parse(
            localStorage.getItem("winsconsin_results") || "[]"
          ),
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
        message.textContent =
          mode === "rested" ? `${t.thankYou} ${t.reminder}` : t.thankYou;
        document.querySelector(".container").appendChild(message);
      } else {
        alert(t.errorGeneric || "Something went wrong. Please try again.");
      }
    })
    .catch(() => {
      alert(t.errorConnection || "Failed to connect to server.");
    });
});

function generateCode() {
  return "C" + Math.random().toString(36).substr(2, 8).toUpperCase();
}

function verifyCode(code) {
  return fetch(`${BACKEND_URL}/check?code=${encodeURIComponent(code)}`)
    .then((res) => res.json())
    .then((data) => {
      if (mode === "tired1") {
        return data.in_rested && !data.in_tired1;
      }
      return false;
    })
    .catch(() => false);
}
