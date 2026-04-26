// [ИНИЦИАЛИЗАЦИЯ АУДИО ДВИЖКА (Web Audio API)]
// ВАЖНО: Звук синтезируется браузером на лету, без mp3 файлов!
const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx;

function initAudio() {
    if (!audioCtx) {
        audioCtx = new AudioContext();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

// Функция генерации волны
function playTone(frequency, type, duration) {
    initAudio();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.type = type; // sine, square, sawtooth, triangle
    oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime);

    // Плавное затухание звука (Fade out)
    gainNode.gain.setValueAtTime(0.8, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration);
}

// [БАЗА ДАННЫХ СТИХИЙ (Полная версия 6 элементов + Физика волн)]
const db = {
    // --- ТЕПЛЫЕ / ПЛОТНЫЕ ---
    gold: {
        kanji: "金", color: "#ffda75", shadow: "0 0 20px rgba(255, 218, 117, 0.4)",
        phrase: "黄金 (Kogane) — Золото, Металл",
        code: "\n> init_module('金');\n> freq: 440.00 Hz  [ ⌁ sawtooth ]\n> density: maximum\n> state: [Alloy Stable]",
        freq: 440, wave: 'sawtooth', duration: 1.5
    },
    earth: {
        kanji: "土", color: "#8b6b4a", shadow: "0 0 20px rgba(139, 107, 74, 0.4)",
        phrase: "土 (Tsuchi) — Земля, Камень",
        code: "\n> init_module('土');\n> freq: 65.00 Hz   [ ⎍ square ]\n> gravity: heavy\n> state: [Grounding Active]",
        freq: 65, wave: 'square', duration: 2.0
    },
    hinoki: {
        kanji: "檜", color: "#e68a49", shadow: "0 0 20px rgba(230, 138, 73, 0.5)",
        phrase: "檜 (Hinoki) — Японский кипарис",
        code: "\n> init_module('檜');\n> freq: 329.63 Hz  [ ∿ sine ]\n> atmosphere: relaxing\n> state: [Organic Flow]",
        freq: 329.63, wave: 'sine', duration: 2.5
    },

    // --- ХОЛОДНЫЕ / РЕЗКИЕ ---
    water: {
        kanji: "水", color: "#4dabf7", shadow: "0 0 20px rgba(77, 171, 247, 0.5)",
        phrase: "水 (Mizu) — Вода, Течение",
        code: "\n> init_module('水');\n> freq: 523.25 Hz  [ ∿ sine ]\n> flow_rate: optimal\n> state: [Fluid Dynamics]",
        freq: 523.25, wave: 'sine', duration: 1.0
    },
    ice: {
        kanji: "氷", color: "#00ffff", shadow: "0 0 20px rgba(0, 255, 255, 0.6)",
        phrase: "氷 (Kōri) — Лед, Кристалл",
        code: "\n> init_module('氷');\n> freq: 1046.50 Hz [ ∧ triangle ]\n> temp: absolute zero\n> state: [Crystal Structure]",
        freq: 1046.50, wave: 'triangle', duration: 0.5
    },

    // --- СИСТЕМНАЯ ---
    white: {
        kanji: "白", color: "#ffffff", shadow: "0 0 20px rgba(255, 255, 255, 0.6)",
        phrase: "白紙 (Hakushi) — Чистый лист",
        code: "\n> sys_reset('白');\n> freq: 880.00 Hz  [ ∿ sine ]\n> cache: flushed\n> status: [Clean Slate]",
        freq: 880, wave: 'sine', duration: 0.8
    }
};


// [ГЛАВНЫЙ КОНТРОЛЛЕР]
const hologram = document.getElementById('hologram');
const kanjiDisplay = document.getElementById('kanji-display');
const typewriterDisplay = document.getElementById('typewriter');
let typeInterval;

function playElement(keyId, elementKey) {
    const btn = document.getElementById(keyId);
    const data = db[elementKey];

    // Генерируем звук
    playTone(data.freq, data.wave, data.duration);

    // Анимация нажатия
    document.querySelectorAll('.synth-key').forEach(b => b.classList.remove('pressed'));
    btn.classList.add('pressed');

    // Отрисовка Голограммы
    kanjiDisplay.textContent = data.kanji;
    kanjiDisplay.style.color = data.color;
    kanjiDisplay.style.textShadow = data.shadow;
    typewriterDisplay.style.color = data.color;
    typewriterDisplay.style.textShadow = data.shadow;
    typewriterDisplay.style.borderLeftColor = data.color;

    hologram.classList.add('active');
    
    // Эффект печатной машинки
    clearInterval(typeInterval);
    typewriterDisplay.textContent = '';
    let i = 0;
    const fullText = data.phrase + data.code;
    
    typeInterval = setInterval(() => {
        if (i < fullText.length) {
            typewriterDisplay.textContent += fullText.charAt(i);
            i++;
        } else {
            clearInterval(typeInterval);
        }
    }, 40);
}

// Привязка кликов к кнопкам
document.getElementById('btn-gold').addEventListener('mousedown', () => playElement('btn-gold', 'gold'));
document.getElementById('btn-earth').addEventListener('mousedown', () => playElement('btn-earth', 'earth'));
document.getElementById('btn-hinoki').addEventListener('mousedown', () => playElement('btn-hinoki', 'hinoki'));
document.getElementById('btn-water').addEventListener('mousedown', () => playElement('btn-water', 'water'));
document.getElementById('btn-ice').addEventListener('mousedown', () => playElement('btn-ice', 'ice'));
document.getElementById('btn-white').addEventListener('mousedown', () => playElement('btn-white', 'white'));

// Сброс анимации при отпускании мыши
document.querySelectorAll('.synth-key').forEach(btn => {
    btn.addEventListener('mouseup', () => btn.classList.remove('pressed'));
    btn.addEventListener('mouseleave', () => btn.classList.remove('pressed'));
});

// Инициализация звука по первому клику на странице (Требование браузеров)
document.body.addEventListener('click', initAudio, { once: true });
