const translations = {
  en: {
    welcome: "Thank you for your interest in participating in my research!",
    description1:
      "My research focuses on methods for detecting player fatigue in order to adjust the difficulty of computer games.",
    description2:
      "Specifically, I am investigating the possibility of detecting cognitive fatigue through simple minigames and how this fatigue influences performance in more demanding games.",
    description3:
      "You will be asked to go through a series of tests twice: once while rested, and once after a mentally exhausting day at work. In May, I will also ask you to complete the tests a third time, again after a tiring day.",
    description4:
      "The tests will consist of 5 minigames, 3 rapid chess games (5 minutes per game) with a computer and a survey. The first test will be in a rested state.",
    description5:
      "As part of this study, only data related to participants’ performance in the tests (e.g., reaction times, number of errors, number of moves in the game, etc.) and answers to the final questionnaire will be collected. All data is completely anonymous – participants are identified solely by a randomly generated code that does not allow for personal identification",
    question: "Do you know how to play chess and would like to participate?",
    participate: "I want to participate",
  },
  pl: {
    welcome: "Dziękuję za zainteresowanie udziałem w moim badaniu!",
    description1:
      "Moje badanie dotyczy metod wykrywania zmęczenia gracza w celu dynamicznego dostosowywania poziomu trudności gier komputerowych.",
    description2:
      "W szczególności badam możliwość rozpoznawania zmęczenia poznawczego za pomocą prostych minigier oraz jego wpływ na wyniki w bardziej wymagających grach.",
    description3:
      "Uczestnicy zostaną poproszeni o wykonanie serii testów dwukrotnie: raz w stanie wypoczętym oraz raz po mentalnie wyczerpującym dniu pracy. W Maju poproszę również o trzecie przejście testów, również po męczącym dniu.",
    description4:
      "Testy będą składać się z 5 minigier, trzech partii szachów błyskawicznych (po 5 minut na gracza) i ankiety. Pierwszy test będzie w stanie wypoczętym.",
    description5:
      "W ramach niniejszego badania zbierane będą wyłącznie dane dotyczące wyników uzyskanych przez uczestników w trakcie wykonywania testów (np. czas reakcji, liczba błędów, liczba ruchów w grze, itp.) oraz odpowiedzi udzielonych w ankiecie końcowej. Dane te są całkowicie anonimowe – uczestnicy są identyfikowani jedynie na podstawie losowo wygenerowanego kodu, który nie pozwala na ustalenie tożsamości żadnej osoby.",
    question: "Czy umiesz grać w szachy i chciał(a)byś wziąć udział?",
    participate: "Chcę wziąć udział",
  },
};

function setLanguage(lang) {
  const t = translations[lang];
  const contentDiv = document.getElementById("content");

  // Save language in cookie
  document.cookie = `lang=${lang}; path=/; max-age=7884000`; // 3 months

  document.getElementById("language-selection").style.display = "none";

  contentDiv.innerHTML = `
        <h1>${t.welcome}</h1>
        <p>${t.description1}</p>
        <p>${t.description2}</p>
        <p>${t.description3}</p>
        <p>${t.description4}</p>
        <p>${t.description5}</p>
        <p><strong>${t.question}</strong></p>
        <a href="mainmenu.html" class="participate-button">${t.participate}</a>
    `;

  contentDiv.classList.remove("hidden");
}

function getSavedLanguage() {
  const match = document.cookie.match(/(?:^|;) ?lang=([^;]+)/);
  return match ? match[1] : null;
}

document.addEventListener("DOMContentLoaded", () => {
  const savedLang = getSavedLanguage();
  if (savedLang && translations[savedLang]) {
    setLanguage(savedLang);
  } else {
    document.querySelectorAll("#lang-options button").forEach((button) => {
      button.addEventListener("click", () => {
        const lang = button.getAttribute("data-lang");
        setLanguage(lang);
      });
    });
  }
});
