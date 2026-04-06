const bpmRange = document.getElementById('bpm-range');
const bpmText = document.getElementById('bpm-text');
const volumeRange = document.getElementById('volume-range');
const volumeText = document.getElementById('volume-text');
const beatsText = document.getElementById('beats-text');
const playBtn = document.getElementById('play-btn');

let audioContext;
let isPlaying = false;
let currentBeatInMeasure = 0;
let nextNoteTime = 0.0;
let timerID;

bpmRange.addEventListener('input', (e) => {
    bpmText.value = e.target.value;
});
bpmText.addEventListener('change', (e) => {
    let val = parseInt(e.target.value, 10);
    if (isNaN(val)) val = 120;
    val = Math.max(30, Math.min(300, val));
    e.target.value = val;
    bpmRange.value = val;
});

volumeRange.addEventListener('input', (e) => {
    volumeText.value = e.target.value;
});
volumeText.addEventListener('change', (e) => {
    let val = parseInt(e.target.value, 10);
    if (isNaN(val)) val = 50;
    val = Math.max(0, Math.min(100, val));
    e.target.value = val;
    volumeRange.value = val;
});

beatsText.addEventListener('change', (e) => {
    let val = parseInt(e.target.value, 10);
    if (isNaN(val) || val < 1) val = 4;
    e.target.value = val;
});

function nextNote() {
    const bpm = parseInt(bpmRange.value, 10);
    const beatsPerMeasure = parseInt(beatsText.value, 10);
    const secondsPerBeat = 60.0 * 4 / bpm / beatsPerMeasure;
    nextNoteTime += secondsPerBeat;

    currentBeatInMeasure++;
    if (currentBeatInMeasure >= beatsPerMeasure) {
        currentBeatInMeasure = 0;
    }
}

function playClick(time) {
    const osc = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    if (currentBeatInMeasure === 0) {
        osc.frequency.value = 1200;
    } else {
        osc.frequency.value = 800;
    }

    const volume = parseInt(volumeRange.value, 10) / 100;
    gainNode.gain.setValueAtTime(volume, time);

    gainNode.gain.exponentialRampToValueAtTime(0.001, time + 0.05);

    osc.connect(gainNode);
    gainNode.connect(audioContext.destination);

    osc.start(time);
    osc.stop(time + 0.05);
}

function scheduler() {
    const scheduleAheadTime = 0.1;
    while (nextNoteTime < audioContext.currentTime + scheduleAheadTime) {
        playClick(nextNoteTime);
        nextNote();
    }
    timerID = setTimeout(scheduler, 25.0);
}

playBtn.addEventListener('click', () => {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }

    if (isPlaying) {
        clearTimeout(timerID);
        isPlaying = false;
        playBtn.textContent = '再生';
        playBtn.classList.remove('playing');
    } else {
        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }
        currentBeatInMeasure = 0;
        nextNoteTime = audioContext.currentTime + 0.05;
        scheduler();

        isPlaying = true;
        playBtn.textContent = '停止';
        playBtn.classList.add('playing');
    }
});