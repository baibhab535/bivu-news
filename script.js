const playBtn = document.getElementById("playNews");
const pauseBtn = document.getElementById("pauseNews");

const synth = window.speechSynthesis;
let utterances = [];
let isPaused = false;

// ===============================
// CREATE SPEECH WITH LATENCY
// ===============================
function speakWithDelay(textArray) {
  synth.cancel();
  utterances = [];

  textArray.forEach((text, index) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;   // slightly slow for clarity
    utterance.pitch = 1;
    utterance.volume = 1;

    // Add delay BEFORE each news (except first)
    utterance.onstart = () => {
      if (index !== 0) {
        synth.pause();
        setTimeout(() => synth.resume(), 800); // 0.8 sec pause
      }
    };

    utterances.push(utterance);
  });

  utterances.forEach(u => synth.speak(u));
}

// ===============================
// FETCH & READ NEWS
// ===============================
async function playNews() {
  try {
    const res = await fetch("http://localhost:3000/news");
    const news = await res.json();

    if (!news || news.length === 0) {
      alert("No news available right now.");
      return;
    }

    let speechTexts = [
      "Here are the latest news updates from India and around the world."
    ];

    news.forEach((item, i) => {
      speechTexts.push(
        `News ${i + 1}. ${item.title}. ${item.description}`
      );
    });

    speakWithDelay(speechTexts);
    isPaused = false;

  } catch (err) {
    alert("Unable to load live news.");
  }
}

// ===============================
// PAUSE / RESUME
// ===============================
function pauseOrResume() {
  if (!synth.speaking) return;

  if (!isPaused) {
    synth.pause();
    isPaused = true;
    pauseBtn.innerText = "Resume";
  } else {
    synth.resume();
    isPaused = false;
    pauseBtn.innerText = "Pause";
  }
}

// ===============================
// BUTTON EVENTS
// ===============================
playBtn.addEventListener("click", playNews);
pauseBtn.addEventListener("click", pauseOrResume);
