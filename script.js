// ===== GLOBALS =====
const synth = window.speechSynthesis;
let voices = [];
let speechQueue = [];
let currentIndex = 0;

// Load voices
speechSynthesis.onvoiceschanged = () => {
  voices = synth.getVoices();
};

// Pick best available voice for language
function getBestVoice(lang) {
  return (
    voices.find(v => v.lang === lang) ||
    voices.find(v => v.lang.startsWith(lang.split("-")[0])) ||
    voices.find(v => v.lang.includes("IN")) ||
    voices[0]
  );
}

// Anchor intro per language
function getAnchorIntro(lang) {
  if (lang.startsWith("hi"))
    return "नमस्कार। आज की मुख्य खबरें सुनिए।";
  if (lang.startsWith("bn"))
    return "নমস্কার। আজকের গুরুত্বপূর্ণ খবরগুলো শুনুন।";
  return "Good day. Here are today’s most important updates.";
}

// Student / Exam filter
function filterStudentNews(articles) {
  const keywords = [
    "exam", "result", "admit", "education",
    "student", "university", "job", "recruitment",
    "board", "college", "entrance"
  ];

  return articles.filter(a =>
    keywords.some(k =>
      ((a.title || "") + (a.description || ""))
        .toLowerCase()
        .includes(k)
    )
  );
}

// Speak next item smoothly
function speakNext(lang, speed) {
  if (currentIndex >= speechQueue.length) return;

  const utterance = new SpeechSynthesisUtterance(
    speechQueue[currentIndex]
  );
  utterance.lang = lang;
  utterance.voice = getBestVoice(lang);
  utterance.rate = speed;
  utterance.pitch = 1;

  utterance.onend = () => {
    currentIndex++;
    setTimeout(() => speakNext(lang, speed), 900);
  };

  synth.speak(utterance);
}

// MAIN: Today’s Brief
async function todayBrief() {
  synth.cancel();
  speechQueue = [];
  currentIndex = 0;

  const apiKey = "YOUR_GNEWS_API_KEY";
  const langCode = document.getElementById("language").value;
  const speed = parseFloat(document.getElementById("speed").value);
  const category = document.getElementById("category").value;
  const studentMode = document.getElementById("studentMode").checked;

  const apiLang =
    langCode.startsWith("hi") ? "hi" :
    langCode.startsWith("bn") ? "bn" : "en";

  const url = `https://gnews.io/api/v4/top-headlines?country=in&category=${category}&lang=${apiLang}&max=8&apikey=${apiKey}`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    let articles = data.articles || [];

    if (studentMode) {
      articles = filterStudentNews(articles);
    }

    articles = articles.slice(0, 3);

    if (articles.length === 0) {
      throw new Error("No relevant news");
    }

    // Save for offline use
    localStorage.setItem("lastNews", JSON.stringify(articles));

    // Build speech queue
    speechQueue.push(getAnchorIntro(langCode));

    articles.forEach((a, i) => {
      const text =
        `Update ${i + 1}. ` +
        (a.description || a.title || "Details not available.");
      speechQueue.push(text);
    });

    speakNext(langCode, speed);

  } catch (err) {
    // Offline fallback
    const saved = localStorage.getItem("lastNews");
    if (!saved) {
      alert("No internet and no saved news available.");
      return;
    }

    const articles = JSON.parse(saved);
    speechQueue.push("You are offline. Here is the last available update.");

    articles.forEach((a, i) => {
      speechQueue.push(
        `Update ${i + 1}. ${a.description || a.title}`
      );
    });

    speakNext(langCode, speed);
  }
}

// Controls
function pauseNews() {
  if (synth.speaking) synth.pause();
}

function resumeNews() {
  if (synth.paused) synth.resume();
}

function toggleTheme() {
  document.body.classList.toggle("dark");
  document.body.classList.toggle("light");
}
