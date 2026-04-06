class Metronome {
    constructor(bpm = 120, beatsPerMeasure = 4, volume = 0.5) {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.bpm = bpm;
        this.beatsPerMeasure = beatsPerMeasure;
        this.volume = volume;
        this.isPlaying = false;
        this.currentBeatInMeasure = 0;
        this.nextNoteTime = 0.0;
        this.timerID = null;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const bpmRange = document.getElementById('bpm-range');
    const bpmText = document.getElementById('bpm-text');
    const volumeRange = document.getElementById('volume-range');
    const volumeText = document.getElementById('volume-text');
    const beatsText = document.getElementById('beats-text');
    const playBtn = document.getElementById('play-btn');
    const metronome = new Metronome();

    bpmRange.addEventListener('input', (e) => {
        bpmText.value = e.target.value;
        metronome.bpm = e.target.value;
    });
    bpmText.addEventListener('change', (e) => {
        let val = parseInt(e.target.value, 10);
        if (isNaN(val)) val = 120;
        val = Math.max(30, Math.min(300, val));
        e.target.value = val;
        bpmRange.value = val;
        metronome.bpm = val;
    });

    volumeRange.addEventListener('input', (e) => {
        volumeText.value = e.target.value;
        metronome.volume = e.target.value / 100;
    });

    volumeText.addEventListener('change', (e) => {
        let val = parseInt(e.target.value, 10);
        if (isNaN(val)) val = 50;
        val = Math.max(0, Math.min(100, val));
        e.target.value = val;
        volumeRange.value = val;
        metronome.volume = val / 100;
    });

    beatsText.addEventListener('change', (e) => {
        let val = parseInt(e.target.value, 10);
        if (isNaN(val) || val < 1) val = 4;
        e.target.value = val;
        metronome.beatsPerMeasure = val;
    });

    function nextNote() {
        const secondsPerBeat = 60.0 * 4 / metronome.bpm / metronome.beatsPerMeasure;
        metronome.nextNoteTime += secondsPerBeat;

        metronome.currentBeatInMeasure++;
        if (metronome.currentBeatInMeasure >= metronome.beatsPerMeasure) {
            metronome.currentBeatInMeasure = 0;
        }
    }

    function playClick(time) {
        const osc = metronome.audioContext.createOscillator();
        const gainNode = metronome.audioContext.createGain();

        if (metronome.currentBeatInMeasure === 0) {
            osc.frequency.value = 1200;
        } else {
            osc.frequency.value = 800;
        }

        gainNode.gain.setValueAtTime(metronome.volume, time);

        gainNode.gain.exponentialRampToValueAtTime(0.001, time + 0.05);

        osc.connect(gainNode);
        gainNode.connect(metronome.audioContext.destination);

        osc.start(time);
        osc.stop(time + 0.05);
    }

    function scheduler() {
        const scheduleAheadTime = 0.1;
        while (metronome.nextNoteTime < metronome.audioContext.currentTime + scheduleAheadTime) {
            playClick(metronome.nextNoteTime);
            nextNote();
        }
        metronome.timerID = setTimeout(scheduler, 25.0);
    }

    playBtn.addEventListener('click', () => {
        if (metronome.isPlaying) {
            clearTimeout(metronome.timerID);
            metronome.isPlaying = false;
            playBtn.textContent = '再生';
            playBtn.classList.remove('playing');
        } else {
            if (metronome.audioContext.state === 'suspended') {
                metronome.audioContext.resume();
            }
            metronome.currentBeatInMeasure = 0;
            metronome.nextNoteTime = metronome.audioContext.currentTime + 0.05;
            scheduler();

            metronome.isPlaying = true;
            playBtn.textContent = '停止';
            playBtn.classList.add('playing');
        }
    });
});