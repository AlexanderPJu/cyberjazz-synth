// --- ИНИЦИАЛИЗАЦИЯ АУДИО (Браузерный движок) ---
const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx;

// Глобальные узлы (Микшер)
let masterGain, masterFilter, masterReverb;

// Функция создания эха (Импульс)
function createReverbImpulse(ctx, duration, decay) {
    const rate = ctx.sampleRate;
    const length = rate * duration;
    const impulse = ctx.createBuffer(2, length, rate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);
    for (let i = 0; i < length; i++) {
        const n = i;
        left[i] = (Math.random() * 2 - 1) * Math.pow(1 - n / length, decay);
        right[i] = (Math.random() * 2 - 1) * Math.pow(1 - n / length, decay);
    }
    return impulse;
}

// Запуск аудио-движка (Роутинг)
function initAudio() {
    if (!audioCtx) {
        audioCtx = new AudioContext();
        
        // Создаем мастер-узлы
        masterGain = audioCtx.createGain(); 
        masterFilter = audioCtx.createBiquadFilter(); 
        masterReverb = audioCtx.createConvolver(); 
        const reverbGain = audioCtx.createGain(); 

        // Инициализация ползунков
        masterFilter.type = 'lowpass';
        masterFilter.frequency.value = document.getElementById('fader-filter').value;
        masterFilter.Q.value = document.getElementById('fader-q').value;

        masterReverb.buffer = createReverbImpulse(audioCtx, 3.0, 2.0); 
        reverbGain.gain.value = document.getElementById('fader-reverb').value;
        masterGain.gain.value = document.getElementById('fader-volume').value;

        // Строим цепь звука
        masterFilter.connect(masterGain);
        masterGain.connect(audioCtx.destination); 

        masterFilter.connect(masterReverb);
        masterReverb.connect(reverbGain);
        reverbGain.connect(audioCtx.destination); 

        // Слушатели ползунков UI
        document.getElementById('fader-volume').addEventListener('input', (e) => masterGain.gain.value = e.target.value);
        document.getElementById('fader-filter').addEventListener('input', (e) => masterFilter.frequency.value = e.target.value);
        document.getElementById('fader-q').addEventListener('input', (e) => masterFilter.Q.value = e.target.value);
        document.getElementById('fader-reverb').addEventListener('input', (e) => reverbGain.gain.value = e.target.value);
    }
    if (audioCtx.state === 'suspended') audioCtx.resume();
}

// --- ФУНКЦИЯ ВОСПРОИЗВЕДЕНИЯ (С балансом громкости) ---
function playTone(frequency, type, duration, volume) {
    initAudio();
    const oscillator = audioCtx.createOscillator();
    const oscGain = audioCtx.createGain(); 

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime);

    // Применяем индивидуальную громкость ноты (vol) из базы данных
    oscGain.gain.setValueAtTime(volume, audioCtx.currentTime);
    oscGain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);

    oscillator.connect(oscGain);
    oscGain.connect(masterFilter);

    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration);
}

// --- БАЗА ДАННЫХ СТИХИЙ (Полные логи + Иконки + Баланс) ---
const db = {
    gold: {
        kanji: "金", color: "#ffda75", shadow: "0 0 20px rgba(255, 218, 117, 0.4), 0 0 40px rgba(212, 175, 55, 0.2)",
        phrase: "黄金 (Kogane) — Золото, Металл",
        code: "\n> init_module('金');\n> freq: 440.00 Hz  [ ⌁ sawtooth ]\n> density: maximum\n> state: [Alloy Stable]",
        freq: 440, wave: 'sawtooth', duration: 1.5, vol: 0.3
    },
    earth: {
        kanji: "土", color: "#8b6b4a", shadow: "0 0 20px rgba(139, 107, 74, 0.4), 0 0 40px rgba(139, 107, 74, 0.2)",
        phrase: "土 (Tsuchi) — Земля, Камень",
        code: "\n> init_module('土');\n> freq: 65.00 Hz   [ ⎍ square ]\n> gravity: heavy\n> state: [Grounding Active]",
        freq: 65, wave: 'square', duration: 2.0, vol: 0.4
    },
    hinoki: {
        kanji: "檜", color: "#e68a49", shadow: "0 0 20px rgba(230, 138, 73, 0.5), 0 0 40px rgba(180, 90, 30, 0.3)",
        phrase: "檜 (Hinoki) — Японский кипарис",
        code: "\n> init_module('檜');\n> freq: 329.63 Hz  [ ∿ sine ]\n> atmosphere: relaxing\n> state: [Organic Flow]",
        freq: 329.63, wave: 'sine', duration: 2.5, vol: 1.0
    },
    water: {
        kanji: "水", color: "#4dabf7", shadow: "0 0 20px rgba(77, 171, 247, 0.5), 0 0 40px rgba(77, 171, 247, 0.2)",
        phrase: "水 (Mizu) — Вода, Течение",
        code: "\n> init_module('水');\n> freq: 523.25 Hz  [ ∿ sine ]\n> flow_rate: optimal\n> state: [Fluid Dynamics]",
        freq: 523.25, wave: 'sine', duration: 1.0, vol: 1.0
    },
    ice: {
        kanji: "氷", color: "#00ffff", shadow: "0 0 20px rgba(0, 255, 255, 0.6), 0 0 40px rgba(0, 255, 255, 0.3)",
        phrase: "氷 (Kōri) — Лед, Кристалл",
        code: "\n> init_module('氷');\n> freq: 1046.50 Hz [ ⋀ triangle ]\n> temp: absolute zero\n> state: [Crystal Structure]",
        freq: 1046.50, wave: 'triangle', duration: 0.5, vol: 0.8
    },
    white: {
        kanji: "白", color: "#ffffff", shadow: "0 0 20px rgba(255, 255, 255, 0.6), 0 0 40px rgba(226, 232, 240, 0.3)",
        phrase: "白紙 (Hakushi) — Чистый лист",
        code: "\n> sys_reset('白');\n> freq: 880.00 Hz  [ ∿ sine ]\n> cache: flushed\n> status: [Clean Slate]",
        freq: 880, wave: 'sine', duration: 0.8, vol: 1.0
    }
};

// --- КОНТРОЛЛЕР UI (Физика и Анимация) ---
const hologram = document.getElementById('hologram');
const kanjiDisplay = document.getElementById('kanji-display');
const typewriterDisplay = document.getElementById('typewriter');

let typeInterval = null;
let activeKey = null;
let keyReleaseTimer = null; 

function playElement(keyId, elementKey) {
    const btn = document.getElementById(keyId);
    const data = db[elementKey];

    if (keyReleaseTimer) clearTimeout(keyReleaseTimer);

    document.querySelectorAll('.synth-key').forEach(b => {
        if (b.id !== keyId) b.classList.remove('pressed');
    });

    if (activeKey === keyId) {
        btn.classList.remove('pressed');
        hologram.classList.remove('active');
        clearInterval(typeInterval);
        setTimeout(() => { typewriterDisplay.textContent = ''; }, 800);
        activeKey = null;
        return;
    }

    btn.classList.add('pressed');
    activeKey = keyId;

    keyReleaseTimer = setTimeout(() => {
        btn.classList.remove('pressed');
        activeKey = null; 
    }, 300); 

    // ПЕРЕДАЕМ 4 ПАРАМЕТРА В ЗВУК (Частота, Тип, Длительность, ГРОМКОСТЬ)
    playTone(data.freq, data.wave, data.duration, data.vol);

    kanjiDisplay.textContent = data.kanji;
    kanjiDisplay.style.color = data.color;
    kanjiDisplay.style.textShadow = data.shadow;
    
    typewriterDisplay.style.color = data.color;
    typewriterDisplay.style.textShadow = data.shadow;
    typewriterDisplay.style.borderLeftColor = data.color;

    hologram.classList.add('active');
    
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

// ПРИВЯЗКА СОБЫТИЙ
document.getElementById('btn-gold').addEventListener('mousedown', () => playElement('btn-gold', 'gold'));
document.getElementById('btn-earth').addEventListener('mousedown', () => playElement('btn-earth', 'earth'));
document.getElementById('btn-hinoki').addEventListener('mousedown', () => playElement('btn-hinoki', 'hinoki'));
document.getElementById('btn-water').addEventListener('mousedown', () => playElement('btn-water', 'water'));
document.getElementById('btn-ice').addEventListener('mousedown', () => playElement('btn-ice', 'ice'));
document.getElementById('btn-white').addEventListener('mousedown', () => playElement('btn-white', 'white'));

// Активация аудио контекста (Анти-блокировка браузера)
document.body.addEventListener('click', initAudio, { once: true });
