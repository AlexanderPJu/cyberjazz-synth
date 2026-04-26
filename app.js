// --- ИНИЦИАЛИЗАЦИЯ АУДИО И ГЛОБАЛЬНЫХ ЭФФЕКТОВ ---
const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx, masterGain, masterFilter, masterReverb, pannerNode, lfoNode, lfoGain;

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

function initAudio() {
    if (!audioCtx) {
        audioCtx = new AudioContext();
        
        // 1. Создаем мастер-узлы (Эффекты)
        masterGain = audioCtx.createGain(); 
        masterFilter = audioCtx.createBiquadFilter(); 
        masterReverb = audioCtx.createConvolver(); 
        const reverbGain = audioCtx.createGain(); 
        pannerNode = audioCtx.createStereoPanner(); // Панорама

        // Создаем LFO (Вибрация)
        lfoNode = audioCtx.createOscillator();
        lfoGain = audioCtx.createGain();
        lfoNode.type = 'sine';
        lfoNode.connect(lfoGain);
        lfoGain.connect(masterFilter.frequency); // LFO крутит частоту фильтра
        lfoNode.start();

        // 2. Инициализация ползунков UI
        masterFilter.type = 'lowpass';
        masterFilter.frequency.value = document.getElementById('fader-filter').value;
        masterFilter.Q.value = document.getElementById('fader-q').value;
        pannerNode.pan.value = document.getElementById('fader-pan').value;
        lfoNode.frequency.value = document.getElementById('fader-lfo-spd').value;
        lfoGain.gain.value = document.getElementById('fader-lfo-dep').value;
        
        masterReverb.buffer = createReverbImpulse(audioCtx, 3.0, 2.0); 
        reverbGain.gain.value = document.getElementById('fader-reverb').value;
        masterGain.gain.value = document.getElementById('fader-volume').value;

        // 3. Строим цепь звука: Panner -> Filter -> (Gain + Reverb) -> Destination
        pannerNode.connect(masterFilter);
        
        masterFilter.connect(masterGain);
        masterGain.connect(audioCtx.destination); 

        masterFilter.connect(masterReverb);
        masterReverb.connect(reverbGain);
        reverbGain.connect(audioCtx.destination); 

        // 4. Слушатели ползунков UI (Live Update)
        document.getElementById('fader-volume').addEventListener('input', (e) => masterGain.gain.value = e.target.value);
        document.getElementById('fader-pan').addEventListener('input', (e) => pannerNode.pan.value = e.target.value);
        document.getElementById('fader-filter').addEventListener('input', (e) => masterFilter.frequency.value = e.target.value);
        document.getElementById('fader-q').addEventListener('input', (e) => masterFilter.Q.value = e.target.value);
        document.getElementById('fader-reverb').addEventListener('input', (e) => reverbGain.gain.value = e.target.value);
        document.getElementById('fader-lfo-spd').addEventListener('input', (e) => lfoNode.frequency.value = e.target.value);
        document.getElementById('fader-lfo-dep').addEventListener('input', (e) => lfoGain.gain.value = e.target.value);
    }
    if (audioCtx.state === 'suspended') audioCtx.resume();
}

// --- ВОСПРОИЗВЕДЕНИЕ ---
function playTone(frequency, type, duration, volume) {
    initAudio();
    const oscillator = audioCtx.createOscillator();
    const oscGain = audioCtx.createGain(); 

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime);

    // Индивидуальная громкость ноты
    oscGain.gain.setValueAtTime(volume, audioCtx.currentTime);
    oscGain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);

    // Подключаем к Панорама-узлу (вход в мастер-цепь)
    oscillator.connect(oscGain);
    oscGain.connect(pannerNode);

    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration);
}

// --- БАЗА ДАННЫХ СТИХИЙ (11 Клавиш + ЛОГИ) ---
const db = {
    'btn-gold': { kanji: "金", color: "#ffda75", shadow: "0 0 20px rgba(255, 218, 117, 0.4)", phrase: "黄金 (Kogane) — Золото", code: "\n> init('金');\n> freq: 440 Hz [ ⌁ saw ]\n> alloy: stable", freq: 440, wave: 'sawtooth', duration: 1.5, vol: 0.3 },
    'btn-silver': { kanji: "銀", color: "#e2e8f0", shadow: "0 0 20px rgba(226, 232, 240, 0.4)", phrase: "銀 (Gin) — Серебро", code: "\n> init('銀');\n> freq: 587 Hz [ ⌁ saw ]\n> conductivity: high", freq: 587.33, wave: 'sawtooth', duration: 1.2, vol: 0.3 },
    'btn-bronze': { kanji: "銅", color: "#ff8c69", shadow: "0 0 20px rgba(255, 140, 105, 0.4)", phrase: "銅 (Dou) — Бронза", code: "\n> init('銅');\n> freq: 329 Hz [ ⌁ saw ]\n> resonance: deep", freq: 329.63, wave: 'sawtooth', duration: 1.8, vol: 0.4 },
    
    'btn-water': { kanji: "水", color: "#4dabf7", shadow: "0 0 20px rgba(77, 171, 247, 0.5)", phrase: "水 (Mizu) — Вода", code: "\n> init('水');\n> freq: 523 Hz [ ∿ sine ]\n> flow: optimal", freq: 523.25, wave: 'sine', duration: 1.0, vol: 1.0 },
    'btn-hotwater': { kanji: "湯", color: "#ff6b6b", shadow: "0 0 20px rgba(255, 107, 107, 0.5)", phrase: "湯 (Yu) — Онсэн", code: "\n> init('湯');\n> freq: 261 Hz [ ∿ sine ]\n> temp: 42C", freq: 261.63, wave: 'sine', duration: 2.0, vol: 1.0 },
    'btn-steam': { kanji: "蒸", color: "#a5d8ff", shadow: "0 0 20px rgba(165, 216, 255, 0.5)", phrase: "蒸気 (Jouki) — Пар", code: "\n> init('蒸');\n> freq: 880 Hz [ ∿ sine ]\n> state: vapor", freq: 880, wave: 'sine', duration: 3.0, vol: 0.6 },
    'btn-ice': { kanji: "氷", color: "#00ffff", shadow: "0 0 20px rgba(0, 255, 255, 0.6)", phrase: "氷 (Kōri) — Лед", code: "\n> init('氷');\n> freq: 1046 Hz [ ⋀ tri ]\n> struct: crystal", freq: 1046.50, wave: 'triangle', duration: 0.5, vol: 0.8 },
    
    'btn-hinoki': { kanji: "檜", color: "#e68a49", shadow: "0 0 20px rgba(230, 138, 73, 0.5)", phrase: "檜 (Hinoki) — Кипарис", code: "\n> init('檜');\n> freq: 164 Hz [ ⎍ sqr ]\n> aroma: forest", freq: 164.81, wave: 'square', duration: 2.5, vol: 0.3 },
    'btn-sugi': { kanji: "杉", color: "#c07a47", shadow: "0 0 20px rgba(192, 122, 71, 0.5)", phrase: "杉 (Sugi) — Кедр", code: "\n> init('杉');\n> freq: 130 Hz [ ⎍ sqr ]\n> age: ancient", freq: 130.81, wave: 'square', duration: 2.0, vol: 0.3 },
    'btn-take': { kanji: "竹", color: "#73d073", shadow: "0 0 20px rgba(115, 208, 115, 0.5)", phrase: "竹 (Take) — Бамбук", code: "\n> init('竹');\n> freq: 659 Hz [ ⋀ tri ]\n> core: hollow", freq: 659.25, wave: 'triangle', duration: 0.8, vol: 0.6 },

    'btn-white': { kanji: "白", color: "#ffffff", shadow: "0 0 20px rgba(255, 255, 255, 0.6)", phrase: "白紙 (Hakushi) — Чистый лист", code: "\n> sys_reset('白');\n> status: [Clean Slate]", freq: 880, wave: 'sine', duration: 0.8, vol: 1.0 }
};

// --- КОНТРОЛЛЕР UI ---
const hologram = document.getElementById('hologram');
const kanjiDisplay = document.getElementById('kanji-display');
const typewriterDisplay = document.getElementById('typewriter');

let typeInterval = null;
let activeKey = null;
let keyReleaseTimer = null; 

function playElement(keyId) {
    const btn = document.getElementById(keyId);
    const data = db[keyId]; 

    if (keyReleaseTimer) clearTimeout(keyReleaseTimer);
    document.querySelectorAll('.synth-key').forEach(b => { if (b.id !== keyId) b.classList.remove('pressed'); });

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

// Привязка кликов динамически ко всем кнопкам
document.querySelectorAll('.synth-key').forEach(btn => {
    btn.addEventListener('mousedown', () => playElement(btn.id));
});

document.body.addEventListener('click', initAudio, { once: true });
